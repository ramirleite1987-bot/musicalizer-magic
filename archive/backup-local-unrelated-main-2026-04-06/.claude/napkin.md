# Napkin Runbook

## Curation Rules
1. **[2026-04-06] Keep only recurring repo guidance**
   Do instead: update this file only with stable, reusable execution notes.

## Execution & Validation (Highest Priority)
1. **[2026-04-06] Verify both `/` and `/dashboard` for app entry**
   Do instead: confirm exported App Router pages match the deployed URLs before debugging deeper runtime issues.
2. **[2026-04-06] Protect server-rendered data loading from hard failures**
   Do instead: wrap initial Prisma reads so the shell UI can render even when database configuration is missing or temporarily unavailable.

## Shell & Command Reliability
1. **[2026-04-06] Local Next dev server may be blocked in sandbox**
   Do instead: rely on `next build`, route manifests, and targeted file inspection when `listen EPERM` prevents `next dev`.
