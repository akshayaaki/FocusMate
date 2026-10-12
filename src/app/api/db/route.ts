import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/auth/get-user";

const VALID_IDENTIFIER = /^[a-zA-Z0-9_]+$/;

function sanitizeIdentifier(ident: string): string {
  if (!VALID_IDENTIFIER.test(ident)) {
    throw new Error(`Invalid identifier: ${ident}`);
  }
  return `"${ident}"`;
}

interface FilterCondition {
  col: string;
  op: "eq" | "neq" | "gte" | "lte" | "gt" | "lt" | "is";
  val: unknown;
}

interface OrderCondition {
  col: string;
  ascending: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, table, columns, data, filters, orders, limit, single, maybeSingle, head } = body;

    if (!table || !VALID_IDENTIFIER.test(table)) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    const safeTable = `public."${table}"`;

    if (action === "select") {
      const selectCols =
        !columns || columns === "*"
          ? "*"
          : typeof columns === "string"
          ? columns
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
              .map(sanitizeIdentifier)
              .join(", ")
          : "*";

      const params: unknown[] = [];
      const whereClauses: string[] = [];

      if (Array.isArray(filters)) {
        for (const f of filters as FilterCondition[]) {
          if (!VALID_IDENTIFIER.test(f.col)) continue;
          if (f.op === "is") {
            if (f.val === null) {
              whereClauses.push(`"${f.col}" IS NULL`);
            } else {
              whereClauses.push(`"${f.col}" IS NOT NULL`);
            }
          } else {
            params.push(f.val);
            const pIndex = `$${params.length}`;
            const opSymbol =
              f.op === "eq"
                ? "="
                : f.op === "neq"
                ? "!="
                : f.op === "gte"
                ? ">="
                : f.op === "lte"
                ? "<="
                : f.op === "gt"
                ? ">"
                : f.op === "lt"
                ? "<"
                : "=";
            whereClauses.push(`"${f.col}" ${opSymbol} ${pIndex}`);
          }
        }
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      if (head) {
        // Count query
        const countSql = `SELECT COUNT(*) AS exact_count FROM ${safeTable} ${whereSql}`;
        const res = await query(countSql, params);
        const count = parseInt(res.rows[0]?.exact_count || "0", 10);
        return NextResponse.json({ data: null, count, error: null });
      }

      let orderSql = "";
      if (Array.isArray(orders) && orders.length > 0) {
        const orderParts = orders
          .filter((o: OrderCondition) => VALID_IDENTIFIER.test(o.col))
          .map((o: OrderCondition) => `"${o.col}" ${o.ascending ? "ASC" : "DESC"}`);
        if (orderParts.length > 0) {
          orderSql = `ORDER BY ${orderParts.join(", ")}`;
        }
      }

      let limitSql = "";
      if (typeof limit === "number" && limit > 0) {
        params.push(limit);
        limitSql = `LIMIT $${params.length}`;
      }

      const sql = `SELECT ${selectCols} FROM ${safeTable} ${whereSql} ${orderSql} ${limitSql}`;
      const res = await query(sql, params);

      if (single) {
        return NextResponse.json({
          data: res.rows[0] || null,
          count: res.rows.length,
          error: res.rows.length === 0 ? "Row not found" : null,
        });
      }

      if (maybeSingle) {
        return NextResponse.json({
          data: res.rows[0] || null,
          count: res.rows.length,
          error: null,
        });
      }

      return NextResponse.json({
        data: res.rows,
        count: res.rows.length,
        error: null,
      });
    }

    if (action === "insert") {
      const records = Array.isArray(data) ? data : [data];
      if (records.length === 0) {
        return NextResponse.json({ data: [], error: null });
      }

      const results = [];
      for (const rec of records) {
        const row = { ...rec };
        // Ensure default user_id if column exists and empty
        if (!row.user_id && ["tasks", "study_sessions", "subjects", "habits", "goals", "finance_transactions", "sleep_logs", "wellbeing_checkins"].includes(table)) {
          row.user_id = DEFAULT_USER_ID;
        }

        const keys = Object.keys(row).filter((k) => VALID_IDENTIFIER.test(k) && row[k] !== undefined);
        const cols = keys.map(sanitizeIdentifier).join(", ");
        const params: unknown[] = [];
        const placeholders = keys.map((k) => {
          params.push(row[k]);
          return `$${params.length}`;
        }).join(", ");

        const sql = `INSERT INTO ${safeTable} (${cols}) VALUES (${placeholders}) RETURNING *`;
        const res = await query(sql, params);
        results.push(res.rows[0]);
      }

      return NextResponse.json({
        data: Array.isArray(data) ? results : results[0],
        error: null,
      });
    }

    if (action === "update") {
      const row = { ...data };
      const keys = Object.keys(row).filter((k) => VALID_IDENTIFIER.test(k) && row[k] !== undefined);
      if (keys.length === 0) {
        return NextResponse.json({ data: null, error: null });
      }

      const params: unknown[] = [];
      const setClauses = keys.map((k) => {
        params.push(row[k]);
        return `"${k}" = $${params.length}`;
      });

      const whereClauses: string[] = [];
      if (Array.isArray(filters)) {
        for (const f of filters as FilterCondition[]) {
          if (!VALID_IDENTIFIER.test(f.col)) continue;
          params.push(f.val);
          whereClauses.push(`"${f.col}" = $${params.length}`);
        }
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const sql = `UPDATE ${safeTable} SET ${setClauses.join(", ")}, updated_at = NOW() ${whereSql} RETURNING *`;
      const res = await query(sql, params);

      return NextResponse.json({
        data: res.rows,
        error: null,
      });
    }

    if (action === "upsert") {
      const records = Array.isArray(data) ? data : [data];
      const results = [];

      for (const rec of records) {
        const row = { ...rec };
        if (!row.user_id && ["profiles", "user_preferences", "notification_preferences", "balance_score_preferences"].includes(table)) {
          row.user_id = DEFAULT_USER_ID;
        }

        const conflictCol =
          table === "profiles"
            ? "id"
            : table === "user_preferences" || table === "notification_preferences" || table === "balance_score_preferences"
            ? "user_id"
            : table === "wellbeing_checkins"
            ? "user_id, checkin_date"
            : table === "habit_entries"
            ? "habit_id, entry_date"
            : "id";

        const keys = Object.keys(row).filter((k) => VALID_IDENTIFIER.test(k) && row[k] !== undefined);
        const cols = keys.map(sanitizeIdentifier).join(", ");
        const params: unknown[] = [];
        const placeholders = keys.map((k) => {
          params.push(row[k]);
          return `$${params.length}`;
        }).join(", ");

        const updateSet = keys
          .filter((k) => !conflictCol.includes(k))
          .map((k) => `"${k}" = EXCLUDED."${k}"`);

        const conflictSql =
          updateSet.length > 0
            ? `ON CONFLICT (${conflictCol.split(",").map(c => `"${c.trim()}"`).join(", ")}) DO UPDATE SET ${updateSet.join(", ")}, updated_at = NOW()`
            : `ON CONFLICT (${conflictCol.split(",").map(c => `"${c.trim()}"`).join(", ")}) DO NOTHING`;

        const sql = `INSERT INTO ${safeTable} (${cols}) VALUES (${placeholders}) ${conflictSql} RETURNING *`;
        const res = await query(sql, params);
        results.push(res.rows[0] || row);
      }

      return NextResponse.json({
        data: Array.isArray(data) ? results : results[0],
        error: null,
      });
    }

    if (action === "delete") {
      const params: unknown[] = [];
      const whereClauses: string[] = [];

      if (Array.isArray(filters)) {
        for (const f of filters as FilterCondition[]) {
          if (!VALID_IDENTIFIER.test(f.col)) continue;
          params.push(f.val);
          whereClauses.push(`"${f.col}" = $${params.length}`);
        }
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const sql = `DELETE FROM ${safeTable} ${whereSql} RETURNING *`;
      const res = await query(sql, params);

      return NextResponse.json({
        data: res.rows,
        error: null,
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[api/db] error:", error);
    return NextResponse.json({ data: null, error: error?.message || "Internal database error" }, { status: 500 });
  }
}
