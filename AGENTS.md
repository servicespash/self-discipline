<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- The ported Cymatic app lives in `src/cymatic/` and renders client-only from `/`; it came from servicespash/self-discipline, so keep its structure for easy comparison.
- In-app views use the local hash router shim (`src/cymatic/lib/hash-router.tsx`, `#/dashboard` etc.) because react-router-dom is not allowed.
- Ported files carry `// @ts-nocheck` since the original used a looser tsconfig; remove it per file when tightening types.
- Rama AI endpoints are TanStack server routes (`/api/chat`, `/api/chat/summary`) using the Lovable AI Gateway; the browser never holds AI keys.
- Data and auth still use the original external Supabase project configured in `src/cymatic/utils/supabase.ts`, so existing users and data keep working.
