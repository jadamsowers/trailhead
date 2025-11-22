# Database Workflow Guidelines

## Important Directives

### Database Container Management
- The database backend is running in a Docker container
- All schema updates MUST be performed through the Docker container
- Never attempt to run migrations directly on the host system

### Migration Management
- **Always merge heads after schema updates**
- Multiple migration branches can occur when working on different features
- Use Alembic's merge command to consolidate migration heads before applying changes

## Common Commands

### Running Migrations in Container
```bash
# Access the backend container
docker-compose exec backend bash

# Create a new migration
alembic revision --autogenerate -m "description"

# Check for multiple heads
alembic heads

# Merge heads if multiple exist
alembic merge heads -m "merge heads"

# Apply migrations
alembic upgrade head
```

### Checking Migration Status
```bash
# View current migration status
docker-compose exec backend alembic current

# View migration history
docker-compose exec backend alembic history
```

## Workflow for Schema Changes

1. Make changes to SQLAlchemy models in `backend/app/models/`
2. Access the backend container: `docker-compose exec backend bash`
3. Generate migration: `alembic revision --autogenerate -m "description"`
4. Check for multiple heads: `alembic heads`
5. If multiple heads exist, merge them: `alembic merge heads -m "merge heads"`
6. Review the generated migration file
7. Apply migration: `alembic upgrade head`
8. Exit container and commit changes

## References
- See `backend/docs/MIGRATIONS.md` for detailed migration documentation
- See `docs/SCHEMA_RESET_GUIDE.md` for schema reset procedures