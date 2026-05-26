---
description: Build, pack, commit pending changes, push to GitHub, and deploy to Vercel production. Stops on any failure.
---

# Ship the prototype

Run the full release flow:

1. `npm run build` — fail fast if TypeScript or Vite errors.
2. `npm run pack` — refresh `proto-bundle.txt` for Figma Make.
3. `git status --porcelain` — if there are uncommitted changes:
   - Show the diff briefly to the user (`git status -sb` + summary)
   - Ask if they want a commit message, or use `chore: ship` as the default
   - `git add -A && git commit -m "<message>"`
4. `git push origin main`
5. `vercel --prod --yes` — capture the deployment URL.

After deployment, print a short summary block:

```
## Deploy result
- URL: <deployment-url>
- Status: READY
- Commit: <short-sha>
- Routes: /, /v2, /v3, /v4
```

If any step fails, **stop** and tell the user what failed. Don't try to
recover automatically — the user may need to fix a build error or resolve a
merge conflict before continuing.

Reminder: you cannot verify mobile rendering yourself — note this in the
summary if v3/v4 was touched.
