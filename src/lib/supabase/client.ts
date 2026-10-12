import { DEFAULT_USER_ID, getCurrentUser } from "@/lib/auth/get-user";

const defaultAuthUser = {
  id: DEFAULT_USER_ID,
  email: "student@focusmate.app",
  displayName: "Student",
  user_metadata: {
    full_name: "Student",
  },
};

class QueryBuilder<T = any> {
  private table: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private columns = "*";
  private dataPayload: unknown = null;
  private filters: Array<{ col: string; op: string; val: unknown }> = [];
  private orders: Array<{ col: string; ascending: boolean }> = [];
  private limitVal?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private isHead = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", options?: { count?: string; head?: boolean }): QueryBuilder<Record<string, any>[]> {
    this.action = "select";
    this.columns = columns;
    if (options?.head) {
      this.isHead = true;
    }
    return this as any;
  }

  insert(data: unknown) {
    this.action = "insert";
    this.dataPayload = data;
    return this;
  }

  update(data: unknown) {
    this.action = "update";
    this.dataPayload = data;
    return this;
  }

  upsert(data: unknown, _options?: unknown) {
    this.action = "upsert";
    this.dataPayload = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push({ col, op: "neq", val });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ col, op: "gte", val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ col, op: "lte", val });
    return this;
  }

  gt(col: string, val: unknown) {
    this.filters.push({ col, op: "gt", val });
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push({ col, op: "lt", val });
    return this;
  }

  is(col: string, val: unknown) {
    this.filters.push({ col, op: "is", val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitVal = count;
    return this;
  }

  single(): QueryBuilder<Record<string, any>> {
    this.isSingle = true;
    return this as any;
  }

  maybeSingle(): QueryBuilder<Record<string, any>> {
    this.isMaybeSingle = true;
    return this as any;
  }

  async execute(): Promise<{ data: T | null; error: any; count?: number | null }> {
    try {
      const endpoint = typeof window !== "undefined"
        ? "/api/db"
        : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/db`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: this.action,
          table: this.table,
          columns: this.columns,
          data: this.dataPayload,
          filters: this.filters,
          orders: this.orders,
          limit: this.limitVal,
          single: this.isSingle,
          maybeSingle: this.isMaybeSingle,
          head: this.isHead,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { data: null, error: new Error(errJson.error || `HTTP ${res.status}`), count: null };
      }

      const json = await res.json();
      return {
        data: (json.data as T) ?? null,
        error: json.error ? new Error(json.error) : null,
        count: json.count ?? null,
      };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)), count: null };
    }
  }

  then<TResult1 = { data: T | null; error: any; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function createClient() {
  return {
    auth: {
      async getUser() {
        return {
          data: { user: defaultAuthUser },
          error: null as any,
        };
      },
      async getSession() {
        return {
          data: {
            session: {
              user: defaultAuthUser,
              access_token: "mock-session-token",
              refresh_token: "mock-refresh-token",
            },
          },
          error: null as any,
        };
      },
      async signOut() {
        return { error: null as any };
      },
      async updateUser(_attributes: unknown) {
        return { data: { user: defaultAuthUser }, error: null as any };
      },
      async signInWithPassword(_credentials: unknown) {
        return { data: { user: defaultAuthUser, session: { user: defaultAuthUser } }, error: null as any };
      },
      async signUp(_credentials: unknown) {
        return { data: { user: defaultAuthUser, session: { user: defaultAuthUser } }, error: null as any };
      },
      async resetPasswordForEmail(_email: string, _options?: unknown) {
        return { data: {}, error: null as any };
      },
      onAuthStateChange(_callback: unknown) {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
    from(table: string) {
      return new QueryBuilder(table);
    },
  };
}
