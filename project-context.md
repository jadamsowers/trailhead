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

- **Backend**: Python/FastAPI (running in Docker) with **async SQLAlchemy**.
  - **SQLAlchemy Requirement**: All database operations must use async sessions and async ORM methods. Do not use synchronous SQLAlchemy code.
  - Use `AsyncSession` from `sqlalchemy.ext.asyncio` for all database interactions.
  - Database queries should use `await` with async methods like `execute()`, `scalar()`, `scalars()`, etc.
- **Database**: PostgreSQL (running in Docker) with **Atlas migrations** (timestamp versioning format: `YYYYMMDDHHmmss_description.sql`).
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

## Backend Development Patterns

### API Endpoint Structure

All FastAPI endpoints follow a consistent pattern to ensure maintainability and security:

#### 1. Dependency Injection

- **Database Session**: Always inject `AsyncSession` via `db: AsyncSession = Depends(get_db)`
- **Authentication**: Use `current_user: User = Depends(get_current_user)` for authenticated endpoints
- **Admin Authorization**: Use `current_user: User = Depends(get_current_admin_user)` for admin-only endpoints
- Never instantiate sessions or users manually; rely on FastAPI's dependency injection system

#### 2. Authentication & Authorization

- **Role-Based Access Control**: Check user roles explicitly for sensitive operations:
  ```python
  if current_user.role != "admin":
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Only admins can perform this action"
      )
  ```
- **Ownership Validation**: Always verify resource ownership before allowing operations:
  ```python
  if resource.user_id != current_user.id:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="You do not have permission to access this resource"
      )
  ```
- **Admin Dependency**: Use `get_current_admin_user` dependency for admin-only endpoints instead of manual role checks

#### 3. Error Handling

- **HTTP Status Codes**: Use appropriate status codes consistently:

  - `404 NOT_FOUND`: Resource doesn't exist
  - `403 FORBIDDEN`: User lacks permission
  - `400 BAD_REQUEST`: Invalid input or business logic violation
  - `201 CREATED`: Successful resource creation
  - `204 NO_CONTENT`: Successful deletion
  - `500 INTERNAL_SERVER_ERROR`: Unexpected errors (rare, caught in general exception handler)

- **Error Response Format**: Always include descriptive `detail` messages:

  ```python
  raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Outing not found"
  )
  ```

- **Transaction Rollback**: Wrap database operations in try/catch with explicit rollback:
  ```python
  try:
      # database operations
      await db.commit()
  except Exception as e:
      await db.rollback()
      raise HTTPException(
          status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
          detail=f"Database error: {str(e)}"
      )
  ```

#### 4. Response Models

- **Type Safety**: Always specify `response_model` parameter in route decorators:
  ```python
  @router.get("/items/{item_id}", response_model=ItemResponse)
  async def get_item(...):
  ```
- **Status Codes**: Specify explicit status codes for create/delete operations:
  ```python
  @router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
  @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
  ```
- **List Responses**: Use wrapper schemas with `items` and `total` fields for list endpoints:
  ```python
  class ItemListResponse(BaseModel):
      items: List[ItemResponse]
      total: int
  ```

#### 5. Query Parameters

- **Pagination**: Provide `skip` and `limit` parameters for list endpoints:
  ```python
  async def list_items(
      skip: int = 0,
      limit: int = 100,
      db: AsyncSession = Depends(get_db)
  ):
  ```
- **Filtering**: Use optional query parameters with descriptive names
- **Validation**: Leverage FastAPI's `Query()` for complex validation needs

### CRUD Layer Patterns

All CRUD operations follow async patterns with consistent transaction management:

#### 1. Function Signatures

- **Async Functions**: All CRUD functions must be async:
  ```python
  async def get_item(db: AsyncSession, item_id: UUID) -> Optional[Item]:
  ```
- **Session Parameter**: Always accept `AsyncSession` as first parameter after `self` (if applicable)
- **Type Hints**: Use proper return type hints including `Optional[]` for nullable returns

#### 2. Query Execution

- **Select Construct**: Use SQLAlchemy 2.0 `select()` construct:
  ```python
  from sqlalchemy import select
  result = await db.execute(select(Item).where(Item.id == item_id))
  ```
- **Result Handling**:
  - Single result: `result.scalar_one_or_none()` or `result.scalar_one()`
  - Multiple results: `result.scalars().all()`
  - Existence check: `result.scalar_one_or_none() is not None`

#### 3. Transaction Management

- **Create Operations**: Follow this pattern:
  ```python
  db_item = Item(**item_data)
  db.add(db_item)
  await db.flush()  # Get ID and relationships without committing
  await db.commit()
  await db.refresh(db_item)  # Refresh computed fields
  return db_item
  ```
- **Update Operations**: Load, modify, commit:
  ```python
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()
  if not item:
      return None
  for key, value in updates.items():
      setattr(item, key, value)
  await db.commit()
  await db.refresh(item)
  return item
  ```
- **Delete Operations**: Load, delete, commit:
  ```python
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()
  if not item:
      return False
  await db.delete(item)
  await db.commit()
  return True
  ```

#### 4. Relationship Loading

- **Eager Loading**: Use `selectinload()` for relationships:
  ```python
  from sqlalchemy.orm import selectinload
  result = await db.execute(
      select(Item).options(selectinload(Item.related_items))
  )
  ```
- **Multiple Relations**: Chain `selectinload()` calls or pass multiple to `options()`

#### 5. Helper Functions

- **Get or Create Pattern**: Implement idempotent operations:
  ```python
  async def get_or_create_item(db: AsyncSession, name: str) -> Item:
      result = await db.execute(select(Item).where(Item.name == name))
      item = result.scalar_one_or_none()
      if not item:
          item = Item(name=name)
          db.add(item)
          await db.flush()
      return item
  ```
- **Reusable Queries**: Extract complex query logic into helper functions

### Schema (Pydantic) Patterns

#### 1. Base Schemas

- **Inheritance**: Use base schemas for shared fields:
  ```python
  class ItemBase(BaseModel):
      name: str = Field(..., min_length=1, max_length=255)
      description: Optional[str] = None
  ```
- **Field Validation**: Use Pydantic's `Field()` for constraints (min/max length, ranges, patterns)

#### 2. Create/Update Schemas

- **Explicit Schemas**: Separate schemas for create vs update operations:

  ```python
  class ItemCreate(ItemBase):
      pass  # All fields from base required

  class ItemUpdate(ItemBase):
      name: Optional[str] = None  # Allow partial updates
  ```

- **Validators**: Use `@field_validator` for cross-field validation

#### 3. Response Schemas

- **Computed Fields**: Include read-only computed properties:

  ```python
  class ItemResponse(ItemBase):
      id: UUID
      created_at: datetime
      updated_at: datetime
      computed_value: int  # Calculated in model

      model_config = ConfigDict(from_attributes=True)
  ```

- **Nested Objects**: Include related data in responses when needed
- **Model Config**: Always set `from_attributes=True` (Pydantic v2) or `orm_mode=True` (v1) for ORM compatibility

### General Best Practices

1. **Consistency**: Follow these patterns across all endpoints and CRUD operations
2. **Security First**: Always validate ownership and permissions before operations
3. **Explicit is Better**: Don't rely on implicit behaviors; be explicit with types, status codes, and error messages
4. **Transaction Safety**: Always use try/catch with rollback for write operations
5. **Type Hints**: Use proper type hints everywhere for IDE support and runtime validation
6. **Async All the Way**: Never mix sync and async database operations
7. **Descriptive Names**: Use clear, self-documenting function and variable names
8. **Documentation**: Include docstrings for all public endpoint functions explaining purpose, auth requirements, and special behavior

## Async SQLAlchemy / Pydantic Greenlet Troubleshooting & Checklist

This project uses async SQLAlchemy together with Pydantic response models. A common class of runtime error looks like:

- MissingGreenlet: greenlet_spawn has not been called; can't call await_only() here.
- pydantic_core.\_pydantic_core.ValidationError: Error extracting attribute

These errors occur when Pydantic attempts to access an ORM attribute that triggers SQLAlchemy to lazy-load a relationship (which performs IO). In the async runtime that IO must be awaited from a greenlet-aware context; if it's attempted indirectly during Pydantic attribute extraction it fails.

When you (or the assistant) encounter this, follow this checklist to diagnose and fix reliably:

- Reproduce & capture

  - Reproduce the failure locally and capture the full traceback and the exact request that triggered it (method, URL, payload, headers).
  - Example: run the failing request with `curl` (include auth token) or run the unit test that triggers it.

- Identify the failing attribute

  - The Pydantic ValidationError will include the attribute name (e.g., `outing_place`). Note that the attribute may be a property that internally iterates relationships.
  - Search the model class for that attribute/property (e.g., `app/models/outing.py`).

- Inspect how the ORM object was loaded

  - Open the CRUD function that returned the ORM instance (e.g., `app/crud/outing.py`).
  - Confirm whether the query used `selectinload()` / `joinedload()` for relationships referenced by the Pydantic model or by computed properties.

- Fix options (pick one, prefer 1 or 2)

  1. Eager-load relationships the response needs

     - Add `selectinload()` to the select options for each relationship used by the response model or by computed properties.
     - After create/update, explicitly `await db.refresh(obj, ["rel1","rel2"])` to ensure the relationship objects are populated before serialization.
     - This is the recommended, minimal change and keeps Pydantic's `from_attributes=True` workflow.

  2. Build an explicit response dict before validating with Pydantic
     - If a response computes values with properties that could trigger IO, compute those values while still in a context where IO is allowed (i.e., after eager-loading), and pass a plain dict to Pydantic.
     - Example pattern used in endpoints:

```python
# compute explicit response dict to avoid hidden lazy loads
outing = db_outing
outing_data = {k: getattr(outing, k) for k in ("id","name","outing_date","location","created_at","updated_at")}
outing_data.update({
    "signup_count": outing.signup_count,
    "available_spots": outing.available_spots,
    "outing_place": PlaceResponse.model_validate(outing.outing_place) if outing.outing_place else None,
})
return OutingResponse.model_validate(outing_data)
```

3. Avoid triggering lazy loads from property getters
   - If a property performs navigation that may lazy-load, consider rewriting it to expect relationships to be present or move the computation into the CRUD layer and store the result on the response dict.

- Developer testing commands
  - Start Docker services (backend + db):

```bash
docker-compose up -d
```

- Restart only the backend container (if needed):

```bash
docker-compose restart trailhead-backend
```

- Run the failing request (adapt token/payload):

```bash
curl -X POST "http://localhost:8000/api/outings" \
  -H "Authorization: Bearer $YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Outing","outing_date":"2025-11-28","location":"Test","max_participants":10}'
```

- Quick async script pattern to run CRUD functions from a REPL/test harness (use the project's async session factory):

```python
import asyncio
from app.db.session import AsyncSessionLocal
from app.schemas.outing import OutingCreate
from app.crud import outing as crud_outing

async def main():
    async with AsyncSessionLocal() as db:
        oc = OutingCreate(name="Test", outing_date="2025-11-28", location="Test", max_participants=5)
        created = await crud_outing.create_outing(db, oc)
        print('created', created.id)

asyncio.run(main())
```

- Test & verify
  - Run the project's test suite to ensure no regression:

```bash
cd backend
pytest -q
```

- PR checklist for fixes
  - Add/adjust migrations (Atlas) if model columns changed.
  - Add unit tests that exercise endpoint serialization (including computed properties and nested relationships).
  - Ensure CRUD uses `selectinload()` for relationships used by schemas/property getters.
  - Ensure create/update functions `await db.refresh(obj, [...])` for relationships referenced immediately after creation.

Notes / gotchas

- Do not mix sync SQLAlchemy sessions with async sessions in the same request or test harness; it will produce confusing failures.
- Passing raw ORM instances directly to Pydantic is convenient but requires care: either eager-load all referenced relationships or pass a plain dict with computed values.
- When debugging, instrument the CRUD function with a temporary `print()` or logger showing SQL emitted, or enable SQLAlchemy echo (`echo=True` for debugging) to see lazy-load queries.
