# AI Context & Project Rules

This document serves as a guide for the AI assistant when working on the Trailhead project. Please refer to these rules and context for every task.

## Development Guidelines

### 1. Accessibility

- **Requirement**: Any new feature must be designed and implemented with accessibility in mind.
- **Action**: Ensure proper ARIA labels, semantic HTML, and keyboard navigation support.

### 2. Styling

- **Requirement**: Avoid inline CSS.
- **Action**: All styling must use the project's theme system (CSS variables + Tailwind utility classes). Do not introduce component libraries like Material UI (MUI); build components with semantic HTML + Tailwind.

### 3. Version Control

- **Requirement**: Major changes must be isolated.
- **Action**: Create a new git branch for any major feature or refactor.

### 4. Database Schema

- **Requirement**: Schema changes must be portable and automated.
- **Action**: Ensure any changes to the database schema are packaged as Atlas migration files using timestamp versioning so that the backend picks up the changes cleanly upon the next startup.
- **Migration Tool**: We use **Atlas** (not Alembic) for database migrations. See `backend/docs/MIGRATIONS.md` for workflow details.
- **Versioning Convention**: `YYYYMMDDHHmmss_description.sql` (e.g., `20251124000008_add_outing_logistics_fields.sql`). When multiple migrations are created on the same day, increment the last digits (seconds) to ensure uniqueness.
- **Do Not** rename already-applied migration files; create a new timestamped file for subsequent changes.
- **Hashing**: After adding or editing migration files run `atlas migrate hash --env sqlalchemy` to update `atlas.sum`.

## Project Context

### Environments

- **Local Development**:
  - Backend and Postgres run in Docker containers.
  - Frontend typically runs locally (e.g., `npm run dev`).
- **Production**:
  - Backend, Postgres, Frontend, and Nginx reverse proxy all run in Docker containers.

### Architecture

- **Backend**: Python/FastAPI (running in Docker).
- **Database**: PostgreSQL (running in Docker) with **Atlas migrations** (sequential versioning: v001, v002...).
- **Frontend**: React/TypeScript with Tailwind CSS (no Material UI).

### Frontend Styling Guidelines

- **Tailwind-Only Mandate**: All UI components should be styled exclusively with Tailwind utility classes, CSS variables, and minimal custom CSS modules if absolutely required. This ensures consistency, performance, and reduces bundle weight.
- **Prohibited Libraries**: Do NOT add Material UI (MUI) or similar heavy UI kits (Chakra, Ant Design, Bootstrap React). Rationale: they add runtime + CSS bloat, conflict with existing theme tokens, and slow iteration.
- **Component Patterns**:
  - Prefer small, composable primitives (buttons, inputs, modals) built manually.
  - Extract repeated Tailwind class sets into helper components or class constants when duplication exceeds 3 occurrences.
  - Use semantic HTML elements first (e.g., `<button>`, `<nav>`, `<fieldset>`, `<section>`).
- **Responsive Design**: Leverage Tailwind breakpoint utilities (`sm:`, `md:`, `lg:`) directly; avoid custom media queries unless edge case.
- **Stateful Styles**: Use Tailwind pseudo-class variants (`hover:`, `focus:`, `disabled:`, `aria-[]:`) instead of inline style mutation where possible. Fallback to small inline style changes only for dynamic numeric values.
- **Dark Mode / Theming**: Continue using existing CSS variables (e.g., `--text-primary`, `--bg-tertiary`) combined with Tailwind classes; do not hardcode colors that bypass the theme.
- **Animations**: Prefer Tailwind built-in transition/animation utilities; if custom keyframes are needed, define them once in a global stylesheet.
- **Forms**: Native HTML form controls styled via Tailwind; avoid replacing with headless libraries unless accessibility gaps force it.
- **Accessibility**: Ensure interactive regions have focus styles (`focus:outline-none focus:ring` patterns) and proper ARIA roles only when semantics are insufficient.
- **Icon Usage**: Continue using existing icon strategy (custom, emojis, or lightweight sets). Avoid importing large icon packs tied to UI libraries.
- **Testing Visual Changes**: When adding new UI, include a quick screenshot diff step or visual verification note if substantial layout shifts occur.

### Rationale (Tailwind over MUI)

- **Performance**: No large component abstraction layer or theme context overhead.
- **Design Consistency**: Tailwind + variables enforce a single source of truth; MUI theming would duplicate effort.
- **Maintainability**: Easier to refactor class-based utility composition than override deep generated styles.
- **Bundle Size**: Avoids shipping unused prebuilt component logic.

### Enforcement

- PRs introducing Material UI (or similar) should be rejected.
- If a complex component (e.g., date picker, autocomplete) is needed, first attempt a native HTML / lightweight custom solution. Document tradeoffs if a third-party headless solution becomes necessary.
- All new components must include: semantic structure, Tailwind classes, and optional notes if extending theme variables.
