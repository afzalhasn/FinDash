# Plan

Create a refreshed, appealing UI theme for the FinDash frontend with a clear color system, typography update, and consistent component styling applied across pages.

## Requirements
- Define a cohesive visual direction (palette, typography, density, states, chart styling).
- Implement theme tokens in Tailwind/global styles and propagate through shared components.
- Update key screens (login, dashboard, transactions, insights, investors, accounts) to reflect the new look without breaking flows.
- Preserve accessibility (contrast, focus states) and responsiveness.

## Scope
- In: Frontend visual design and UX polish; shared components, layouts, charts; minor copy/spacing tweaks.
- Out: Backend changes; new product features; routing or data model changes.

## Files and entry points
- frontend/tailwind.config.mjs, frontend/src/styles/globals.css (or theme files) for tokens and base styles.
- Shared primitives in frontend/src/app/components and frontend/src/shared.
- Page shells in frontend/src/app/pages (login, dashboard, transactions, insights, investor, accounts).
- Charts/stats components in frontend/src/features and frontend/src/shared where Recharts/Embla are used.

## Data model / API changes
- None expected.

## Action items
[ ] Audit current theme tokens, component library usage, and page-level styles to map what is driven by Tailwind config vs custom CSS.  
[ ] Define new design direction using brand colors for the core palette (primary/secondary/neutrals, backgrounds, surfaces), typography stack and scale, spacing/radius/shadows, interactive states; document brief style notes.  
[ ] Update theme tokens (Tailwind config, CSS variables) and global styles to reflect the new direction, including default backgrounds and text colors.  
[ ] Restyle shared components (buttons, inputs, cards, nav/sidebar, tables, tabs, toasts) to use updated tokens and consistent paddings/radii/states.  
[ ] Apply layout/spacing and color updates to key pages (login hero/split, dashboard cards/charts, transactions filters/table, insights charts, investor/accounts forms) while validating responsive behavior.  
[ ] Refresh chart styling (colors, gridlines, tooltips) to match the palette and improve readability.  
[ ] Run validations (lint/build/tests) and perform visual QA for contrast/accessibility and hover/focus/disabled states.

## Testing and validation
- cd frontend && npm run lint
- npm run build
- Optional: npm run test:e2e (or targeted Playwright specs) after visual changes.
- Manual QA across desktop and mobile breakpoints; check contrast (WCAG AA), focus rings, and hover/active states.

## Risks and edge cases
- Palette may reduce contrast; ensure WCAG-compliant combinations.
- Token changes might subtly break layout spacing; audit key screens after updates.
- Chart color clashes or illegible tooltips on different backgrounds.

## Open questions
- Preferred visual direction (light-modern with soft gradients vs bold dark)? Confirm exact brand colors or logo references to anchor the palette.
- Should we introduce accent gradients or keep flat fills?
