## Packages
canvas-confetti | For payout simulation visual celebrations
@types/canvas-confetti | Types for canvas-confetti
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes without style conflicts

## Notes
- LocalStorage is used to persist the simulated logged-in worker session (`gigshield_worker_id`).
- Mock parametric insurance flow on the frontend orchestrates `trigger disruption` -> `create claim` -> `simulate payout` sequentially to ensure a complete visual demonstration if the backend doesn't trigger them automatically.
- Custom fonts (Outfit for display, Plus Jakarta Sans for body) will be loaded via Google Fonts in index.css.
