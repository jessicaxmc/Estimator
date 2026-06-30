# App starter (Next.js + Supabase)

A minimal, working connection between a Next.js app and a Supabase database.
It has one placeholder table (`items`) just to prove reads/writes work end to end.
Swap in the real schema and pages once the app spec is ready.

## 1. Supabase

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste in the contents of `supabase/schema.sql` and click **Run**.
3. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.

## 2. Local setup (optional, to test before deploying)

1. Copy `.env.local.example` to `.env.local` and fill in the two values from step 1.
2. `npm install`
3. `npm run dev` and open `http://localhost:3000` — you should see "Connected to Supabase."

## 3. Push to GitHub

```
git init
git add .
git commit -m "app starter"
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

## 4. Deploy on Vercel

1. "Add New Project" → import the GitHub repo.
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. You'll get a `*.vercel.app` URL.

## Next

This confirms the wiring works. Once the real app spec is ready, the `items` table
gets replaced with the actual schema, and `app/page.tsx` becomes the real UI.
