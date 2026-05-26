---
description: Capture the current state as a Figma-Make-ready bundle and tag the git commit, so this milestone can be restored later.
---

# Snapshot

A "snapshot" = three things in lockstep:

1. **A regenerated `proto-bundle.txt`** — `npm run pack`. Don't commit it
   (it's gitignored), but the user can drop it into Figma Make to recreate
   this exact state.
2. **A git tag** on the current HEAD — `git tag snapshot/<YYYY-MM-DD>-<slug>`
   where slug is one or two words describing the milestone. Ask the user
   what to call it ("snapshot-1", "after-v4-redesign", etc.) if not obvious.
3. **A short `SNAPSHOTS.md` entry** at the project root — append a line:
   `- <YYYY-MM-DD> <slug> — <commit short sha> — <one-sentence description>`.
   Create the file if it doesn't exist.

## Steps

1. Confirm working tree is clean (`git status -sb`). If not, ask the user
   whether to commit first or snapshot the dirty tree (and warn that the tag
   won't reflect the uncommitted changes).
2. Run `npm run pack`.
3. Create the tag locally and push it: `git tag <name> && git push --tags`.
4. Update `SNAPSHOTS.md` with the entry and `git commit -m "chore: snapshot <slug>"`.
5. Print the result block:

```
## Snapshot taken
- Tag: <name>
- Commit: <short sha>
- Bundle: proto-bundle.txt (<size> KB)
- Restore later: `git checkout <name>`
```

## Why this exists

The user iterates fast on variants and wants to be able to come back to a
known-good design milestone. The tag + the regenerated bundle + the
SNAPSHOTS.md note are enough to recreate the prototype in Figma Make
*and* in the repo.
