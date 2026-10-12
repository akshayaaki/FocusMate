# FocusMate — Production Deployment & Operational Runbook

## 1. Prerequisites & Required Infrastructure

To deploy FocusMate into production, prepare the following resources:
1. **Supabase Project**: PostgreSQL database with Row Level Security and Supabase Auth.
2. **Hosting Platform**: Vercel (recommended for Next.js App Router) or containerized Node.js.
3. **Domain / DNS**: With SSL certificate termination.

---

## 2. Supabase Setup & Migrations

### Step 1: Create Supabase Project
1. Log into your Supabase Dashboard at [supabase.com](https://supabase.com).
2. Create a new organization and project titled `focusmate-prod`.
3. Select your preferred database region (e.g. `ap-south-1` for Mumbai / Indian subcontinent).

### Step 2: Apply Database Migrations
Run the version-controlled migration file located at:
`supabase/migrations/20261012000000_focusmate_schema.sql`

Via Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```
Or via the Supabase SQL Editor:
1. Open the SQL Editor in your Supabase dashboard.
2. Paste the entire content of `20261012000000_focusmate_schema.sql`.
3. Execute the script. It creates all 28 tables, indexes, triggers, and activates Row Level Security with strict tenant-isolation policies.

### Step 3: Configure Authentication
1. **Email Auth**: In Authentication > Providers > Email:
   - Enable Email Provider.
   - Set Site URL to `https://your-domain.com`.
   - Add Redirect URLs: `https://your-domain.com/auth/callback` and `https://your-domain.com/reset-password`.
2. **Google OAuth (Optional)**:
   - In Google Cloud Console, configure OAuth Client ID and secret.
   - Add Authorized Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   - Paste Client ID and Secret into Supabase Auth > Providers > Google.

---

## 3. Production Environment Variables

Configure the following environment variables in Vercel (or your hosting provider):

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Your project URL: `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Standard Anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (Server only) | Privileged key for administrative tasks |
| `RESEND_API_KEY` | Secret (Server only) | Optional: For production transactional emails |
| `VAPID_PUBLIC_KEY` | Public (Client) | Optional: Web Push public key |
| `VAPID_PRIVATE_KEY` | Secret (Server only) | Optional: Web Push private key |
| `NEXT_PUBLIC_APP_URL` | Public | Domain URL: `https://focusmate.app` |

---

## 4. Vercel Deployment

1. Connect your Git repository to Vercel.
2. Select Framework Preset: `Next.js`.
3. Set Root Directory: `./`.
4. Enter the Environment Variables listed above.
5. Click **Deploy**.

---

## 5. Post-Deployment Verification Checklist

- [ ] Visit `/` — Verify marketing landing page renders with brand palette.
- [ ] Register new student account at `/signup`.
- [ ] Confirm email / sign in at `/login`.
- [ ] Verify clean, authentic zero-data state on `/dashboard`.
- [ ] Create a task at `/tasks` and verify it displays on `/calendar`.
- [ ] Run a focus timer session at `/study` and confirm elapsed minutes are logged.
- [ ] Create a habit at `/habits` and toggle today's completion.
- [ ] Add an expense at `/finance` and verify budget utilization.
- [ ] Log sleep and daily reflection at `/wellbeing`.
- [ ] Inspect transparent dimensions on `/balance`.
- [ ] Download PDF and CSV report at `/reports`.
- [ ] Test full JSON data export at `/settings/data`.
- [ ] Verify Row Level Security by verifying another user account cannot see these records.
