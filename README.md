# FREEDOM website + admin CMS (final prototype)

## Run
```bash
ADMIN_PASSWORD=your-password npm start
```
Open `http://localhost:3000/` and admin at `http://localhost:3000/admin`.

## Final operating model
- Homepage visual design is fixed in code.
- Admin edits links, YouTube labels/videos, homepage guide cards, and all multipage content.
- Multipages: `/page/deposit`, `/page/withdraw`, `/page/trade`, `/page/benefit`.
- Admin supports step add/delete, step image URL, warning boxes, checklists, CTA buttons, and repeatable event cards.
- Every save creates a JSON backup under `data/backups/`.

## Important
Replace all `#` placeholder URLs in Admin before public deployment. Use a strong `ADMIN_PASSWORD` environment variable in production.
