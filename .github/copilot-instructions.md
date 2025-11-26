# GitHub Copilot Instructions

This file is automatically read by GitHub Copilot in every conversation.

## Project Context

**IMPORTANT**: Before starting any new feature, bug fix, or code change, you MUST read the project context file:

```
/Users/jadam/Development/trailhead/project-context.md
```

This file contains critical information about:
- Frontend styling guidelines (Tailwind + CSS variables)
- Backend development patterns (async SQLAlchemy)
- Database migration procedures (Atlas)
- Authentication and authorization patterns
- CRUD layer conventions
- Testing requirements

## Quick Reference: Frontend Styling

All new UI components MUST:
- ✅ Use Tailwind utility classes for layout/spacing
- ✅ Use CSS variables for ALL colors (never hardcode colors)
- ✅ Follow the theme pattern: `var(--text-primary)`, `var(--btn-primary-bg)`, etc.
- ✅ Use semantic HTML elements
- ✅ Include responsive breakpoints (`sm:`, `md:`, `lg:`)
- ✅ Have hover/focus states
- ❌ NO Material UI, Chakra UI, or other component libraries
- ❌ NO inline CSS (except when using CSS variables)
- ❌ NO hardcoded color values

## Quick Reference: Backend Development

All backend code MUST:
- ✅ Use async SQLAlchemy (AsyncSession, await db.execute())
- ✅ Use dependency injection for database and authentication
- ✅ Follow CRUD patterns with proper transaction management
- ✅ Use Atlas for database migrations (timestamp format: `YYYYMMDDHHmmss_description.sql`)
- ✅ Eager-load relationships with `selectinload()` to avoid greenlet errors
- ✅ Use proper HTTP status codes and error messages

## When Starting a New Task

1. **Read project-context.md** first
2. Check existing similar components for patterns
3. Follow the established conventions
4. Test your changes
5. Ensure styling matches the rest of the site

## File Locations

- Frontend code: `/frontend/src/`
- Backend code: `/backend/app/`
- Migrations: `/backend/migrations/`
- Documentation: `/docs/` and `/backend/docs/`
- Tests: `/backend/tests/`
