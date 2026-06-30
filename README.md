# AP Psych Quizzer

A chapter-based multiple-choice quiz app built from "500 AP Psychology Questions to
Know by Test Day" and "Kaplan AP Psychology Prep Plus" (680 questions across 34
chapters), with every answer you give recorded to a Postgres database so your stats
persist across devices and sessions.

## What's included

- **Home page** — pick a book and chapter, see live accuracy badges on each chapter card
- **Quiz flow** — one question at a time, instant correct/incorrect feedback with explanations
- **Stats dashboard** (`/stats`) — total questions answered, accuracy, a day streak,
  chapter-by-chapter strength (weakest chapters surfaced first), a "questions to
  review" list of your most-missed questions, and a recent activity feed
- Every attempt is written to a single `attempts` table in Postgres — no auth, since
  this is meant for your own personal use

## 1. Push this to GitHub

```bash
cd ap-psych-quiz
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

(Or just upload the folder directly — Vercel also supports importing a local
folder via the CLI, see step 4 below, if you'd rather skip GitHub entirely.)

## 2. Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo
   (or run `npx vercel` from inside the project folder and follow the prompts).
2. Framework preset should auto-detect as **Next.js** — leave build settings as default.
3. Don't deploy yet — first set up the database (next step), since the app needs
   `DATABASE_URL` to work.

## 3. Add a Postgres database (Neon, via the Vercel Marketplace)

Vercel's first-party "Vercel Postgres" product has been sunset — the current path
is provisioning a **Neon** Postgres database through the Vercel Marketplace, which
auto-injects the connection string as an environment variable for you.

1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database** → choose **Postgres** → select the **Neon** integration.
3. Follow the prompts (pick a name and region close to where you'll use the app).
4. Once created, click **Connect Project** and select this project — Vercel will
   automatically add `DATABASE_URL` (and a few related env vars) to your project's
   Environment Variables.

## 4. Create the `attempts` table

You need to run the schema once. Easiest way, no local setup required:

1. In Vercel, go to **Storage** → your Neon database → the **Query** tab in the dashboard.
2. Paste the contents of [`sql/schema.sql`](./sql/schema.sql) and run it.

(Alternative: if you have `psql` installed locally, run
`psql "$DATABASE_URL" -f sql/schema.sql` after pulling your env vars with
`vercel env pull .env.local`.)

## 5. Deploy

Back in your Vercel project, click **Deploy** (or push a commit / run `vercel --prod`
if you used the CLI). Once it finishes, open the deployed URL — pick a chapter and
answer a few questions, then check `/stats` to confirm your answers are being saved.

## Local development (optional)

```bash
npm install
vercel env pull .env.local   # pulls DATABASE_URL from your Vercel project
npm run dev
```

Then open http://localhost:3000.

## Notes

- This app has no login — it's built for a single person's use, and all visitors
  to the deployed URL will share the same stats. If you ever want to share the link
  publicly, you'd want to add authentication first.
- The "Reset All Stats" button on `/stats` permanently truncates the `attempts`
  table — there's no undo.
- The quiz content (questions, options, answers, explanations) is bundled directly
  into the app in `lib/quizData.js` — no separate database table needed for that part,
  since it never changes.
