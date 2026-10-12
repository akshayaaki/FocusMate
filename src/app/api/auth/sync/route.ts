import { NextResponse, type NextRequest } from "next/server";
import { Client } from "pg";
import { authUidToUuid } from "@/lib/auth/uid-utils";

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName, photoUrl } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing user UID" }, { status: 400 });
    }

    const userUuid = authUidToUuid(uid);
    const sanitizedEmail = email || `${uid}@clerk.focusmate.app`;
    const sanitizedName = displayName || sanitizedEmail.split("@")[0] || "Student";

    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres:XEUG6YoEYWAOe2xJ@db.lkdtgjwvtuknfjjixrif.supabase.co:5432/postgres";

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    try {
      // 1. Ensure user row exists in auth.users with matching UUID
      await client.query(
        `
        INSERT INTO auth.users (
          id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at
        )
        VALUES ($1, 'authenticated', 'authenticated', $2, NOW(), $3::jsonb, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
      `,
        [
          userUuid,
          sanitizedEmail,
          JSON.stringify({
            full_name: sanitizedName,
            avatar_url: photoUrl || null,
            clerk_user_id: uid,
            provider: "clerk",
          }),
        ]
      );

      // 2. Upsert into public.profiles
      await client.query(
        `
        INSERT INTO public.profiles (id, display_name, timezone, avatar_url, onboarding_completed, updated_at)
        VALUES ($1, $2, 'Asia/Kolkata', $3, true, NOW())
        ON CONFLICT (id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
            updated_at = NOW();
      `,
        [userUuid, sanitizedName, photoUrl || null]
      );

      // 3. Ensure user_preferences exist
      await client.query(
        `
        INSERT INTO public.user_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
      `,
        [userUuid]
      );

      // 4. Ensure notification_preferences exist
      await client.query(
        `
        INSERT INTO public.notification_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
      `,
        [userUuid]
      );

      // 5. Ensure balance_score_preferences exist
      await client.query(
        `
        INSERT INTO public.balance_score_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
      `,
        [userUuid]
      );

      // 6. Ensure default finance categories exist
      const catCheck = await client.query(
        `SELECT id FROM public.finance_categories WHERE user_id = $1 LIMIT 1;`,
        [userUuid]
      );

      if (catCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO public.finance_categories (user_id, name, type, color, is_default) VALUES
            ('${userUuid}', 'Food & Dining', 'expense', '#9CAEA9', TRUE),
            ('${userUuid}', 'Transportation', 'expense', '#788585', TRUE),
            ('${userUuid}', 'Education & Books', 'expense', '#38302E', TRUE),
            ('${userUuid}', 'Accommodation & Rent', 'expense', '#6F6866', TRUE),
            ('${userUuid}', 'Entertainment', 'expense', '#CCDAD1', TRUE),
            ('${userUuid}', 'Shopping', 'expense', '#9CAEA9', TRUE),
            ('${userUuid}', 'Health & Fitness', 'expense', '#788585', TRUE),
            ('${userUuid}', 'Allowance / Salary', 'income', '#38302E', TRUE),
            ('${userUuid}', 'Other Income', 'income', '#9CAEA9', TRUE),
            ('${userUuid}', 'Other Expenses', 'expense', '#6F6866', TRUE);
        `);
      }

      const response = NextResponse.json({
        success: true,
        uid: userUuid,
        clerkId: uid,
        email: sanitizedEmail,
        displayName: sanitizedName,
      });

      response.cookies.set("focusmate_uid", userUuid, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });

      return response;
    } finally {
      await client.end();
    }
  } catch (error: any) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to sync user" },
      { status: 500 }
    );
  }
}
