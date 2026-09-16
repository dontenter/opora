# Opora

Three workouts per week with set tracking, rest timer, workout history and private Supabase sync. The interface is in English and designed for phones.

## Run locally

Requires Node.js 22 or later:

```sh
npm ci
npm run dev
```

Open http://localhost:4173. Run checks with `npm test` and build with `npm run build`.

## Previous workouts

- Check off the sets you complete. At the end of your session, select **Finish & save workout**. This archives the session and starts a fresh one, keeping your weights and reps as editable defaults.
- Each exercise has a **Last time** panel showing the date and checked sets from your most recent saved session of the same workout (A, B or C). It shows weight, reps or seconds, and left/right values where relevant. Unchecked sets are not presented as completed results.
- **View history** jumps to the full history. Filter by workout and open a session to view every exercise and its notes.
- Imported or conflict-recovery copies remain in history but do not become the automatic previous-workout comparison. If the last saved session did not include a particular exercise, its card says so instead of silently showing an older session.
- Existing records and personal notes are preserved. The interface translation does not modify notes entered by the user.

## Vercel

Repository: `dontenter/opora`, production branch: `main`. Framework: Other. Build command: `npm run build`. Output directory: `dist`. Configuration lives in `vercel.json`; dependencies are locked in `package-lock.json`.

Production: https://opora-snowy.vercel.app/

## Supabase

Project: `mjbqqvygyixuuvijtmar`. `src/public-config.json` contains the project URL and browser-safe **publishable key**. Server-side RLS policies enforce access to each user's records. Never include secret or service-role keys in browser code or this repository.

Override public settings with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel or `.env.local` if needed; see `.env.example`. Rebuild after configuration changes.

1. Apply `supabase/migrations/202609160001_opora.sql` in SQL Editor. The owner has already applied the initial version. The migration can be reapplied by the GitHub integration without recreating existing data. It creates the `opora_training` table, its RLS policies and the `opora_save` function.
2. Authentication → URL Configuration: set Site URL to `https://opora-snowy.vercel.app/`. Include that URL and `http://localhost:4173/` in Redirect URLs.
3. Enable the Email provider. Sign-in uses `signInWithOtp` and the standard Supabase magic-link email. Open the email in the browser where you want to sign in.
4. If the Magic Link template was changed to send a numeric code, restore a link using `{{ .ConfirmationURL }}`. This app uses links rather than numeric codes.
5. Configure custom SMTP in Supabase for reliable delivery to arbitrary recipients. Supabase's built-in email service restricts recipients and send frequency. Store SMTP secrets only in Supabase. Email delivery must be verified by signing in with a real address.

## Data and privacy

- Before sign-in, records use the original `localStorage` key, `opora-training-v1`. They are not uploaded automatically. The import button adds them to account history without replacing current cloud workouts.
- After sign-in, current A/B/C sessions and history are stored as one JSONB document per user in `opora_training`. This includes weights, reps, completion marks, notes and pain ratings. RLS requires `auth.uid() = user_id`. Anonymous reads and writes are denied.
- Each account has a separate local cache. Edits are saved locally first and then synced. Rest timer state and the selected workout stay on the device.
- Sync runs after edits, when the window regains focus, when connectivity returns, manually, and every 30 seconds while visible. **Saved to cloud** confirms completion.
- Revision checks prevent a stale device from silently overwriting newer cloud data. If versions conflict, choose which current version to keep; the alternative is preserved in history as a saved copy.
- Signing out returns to the local guest diary. Account caches, including unsent edits, remain for the next sign-in. On shared devices, clear browser data only after syncing.
- Clearing browser data before sync loses unsent changes. An already-open page works during a connection loss; full offline page startup is not implemented. Localhost and production guest data are independent.
- History is stored in one document. A separate paginated table may be appropriate for many years of records.

## Verification

`npm test` covers form persistence, workout switching, archives, prior-session comparisons, time and side units, account separation, offline errors, conflicting revisions and edits during a request. The official Supabase SDK is bundled locally. Tests do not send emails or create users. A full email sign-in requires the address owner's participation.

## Training plan

Workouts A/B/C are based on the original conversation. Where the original plan specified 2–3 sets, the lower volume is used. For unilateral exercises, record each side separately. Record dumbbell weights per dumbbell and machine/cable weights according to the equipment's scale.

This is not medical advice or a scoliosis correction plan. Discuss exercises and loads with a clinician given scoliosis, chronic pain and the CIDP mentioned in the conversation. Stop and seek professional advice if symptoms worsen.

Reference: https://www.nhs.uk/conditions/scoliosis/treatment-in-adults/
