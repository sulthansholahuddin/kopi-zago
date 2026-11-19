<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (Kopi Jago)
- Business logic that changes money, stock, orders, or points lives in Postgres SECURITY DEFINER functions called via `supabase.rpc` (place_order, cancel_order, admin_set_order_status, redeem_reward, scan_qr, ...). Why: keeps prices/stock server-authoritative without extra server functions.
- Roles live in `public.user_roles` and are checked with `has_role()`; the admin area is gated by `src/routes/_authenticated/admin/route.tsx`. Why: never trust client-side role flags.
- Imported users from the old system sit in `public.legacy_users` and are linked by `claim_account()` only for a verified email. Why: old passwords cannot be migrated.
- Shared pricing/points formulas used by the UI live in `src/lib/jago.ts` with tests in `src/lib/jago.test.ts`; the database functions mirror them.
- Media uses Lovable asset pointers in `src/assets/jago/*.asset.json`; menu photos are stored as asset URLs in `menu_items.image_url`.
