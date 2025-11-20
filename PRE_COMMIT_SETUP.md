# Pre-Commit Hooks Setup Guide

This project uses pre-commit hooks to automatically maintain type synchronization between the Python/FastAPI backend and TypeScript frontend.

## What Are Pre-Commit Hooks?

Pre-commit hooks are scripts that run automatically before each git commit. In this project, they:

1. **Regenerate TypeScript types** when backend schema files change
2. **Run contract tests** to verify type compatibility
3. **Stage generated types** for commit automatically
4. **Run code quality checks** (formatting, linting)

## Installation

### Quick Setup

Run the setup script:

```bash
bash scripts/setup-pre-commit.sh
```

### Manual Setup

If you prefer to set up manually:

```bash
# Install pre-commit
pip install pre-commit

# Install the git hooks
pre-commit install
```

## How It Works

### Automatic Type Synchronization

When you commit changes to any file in `backend/app/schemas/`, the hooks will:

1. **Detect schema changes** - Monitors `backend/app/schemas/*.py` files
2. **Regenerate types** - Runs `npm run generate-types` in the frontend directory
3. **Run contract tests** - Executes `pytest tests/test_contracts.py` to verify compatibility
4. **Stage generated files** - Automatically adds `frontend/src/types/generated.ts` to your commit

### Example Workflow

```bash
# 1. Make changes to a backend schema
vim backend/app/schemas/trip.py

# 2. Stage your changes
git add backend/app/schemas/trip.py

# 3. Commit (hooks run automatically)
git commit -m "Add new field to Trip schema"

# Output:
# Regenerate TypeScript types from OpenAPI...........Passed
# Run contract tests.................................Passed
# Stage generated TypeScript types...................Passed
# black..............................................Passed
# isort..............................................Passed
# flake8.............................................Passed
```

The generated TypeScript types are automatically included in your commit!

## Configured Hooks

### Type Synchronization Hooks

1. **regenerate-types**
   - Triggers on: Changes to `backend/app/schemas/*.py`
   - Action: Runs `npm run generate-types`
   - Purpose: Keep frontend types in sync with backend schemas

2. **contract-tests**
   - Triggers on: Changes to `backend/app/schemas/*.py`
   - Action: Runs `pytest tests/test_contracts.py`
   - Purpose: Verify API responses match TypeScript expectations

3. **stage-generated-types**
   - Triggers on: Changes to `backend/app/schemas/*.py`
   - Action: Stages `frontend/src/types/generated.ts`
   - Purpose: Include generated types in the commit

### Code Quality Hooks

4. **black** - Python code formatter
5. **isort** - Python import sorter
6. **flake8** - Python linter
7. **trailing-whitespace** - Remove trailing whitespace
8. **end-of-file-fixer** - Ensure files end with newline
9. **check-yaml** - Validate YAML syntax
10. **check-added-large-files** - Prevent large files
11. **check-merge-conflict** - Detect merge conflict markers
12. **detect-private-key** - Prevent committing private keys

## Running Hooks Manually

### Run all hooks on all files
```bash
pre-commit run --all-files
```

### Run specific hook
```bash
pre-commit run regenerate-types --all-files
pre-commit run contract-tests --all-files
```

### Run hooks on staged files only
```bash
pre-commit run
```

## Skipping Hooks (Not Recommended)

If you need to skip hooks for a specific commit:

```bash
git commit --no-verify -m "Your commit message"
```

**Warning:** Skipping hooks may cause type mismatches between frontend and backend!

## Troubleshooting

### Hook fails with "command not found"

Make sure you have all dependencies installed:

```bash
# Backend dependencies
cd backend
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install --legacy-peer-deps
```

### Contract tests fail

This means your schema changes broke the contract with the frontend. Review the test output and ensure:

1. All required fields are present in response schemas
2. Field types match between backend and frontend
3. Optional fields are properly marked as optional

### Types not regenerating

1. Check that the backend server is running (types are generated from the OpenAPI endpoint)
2. Verify `frontend/scripts/generate-types.sh` is executable
3. Run manually: `cd frontend && npm run generate-types`

## Updating Hooks

To update to the latest hook versions:

```bash
pre-commit autoupdate
```

## Disabling Hooks

To temporarily disable hooks:

```bash
pre-commit uninstall
```

To re-enable:

```bash
pre-commit install
```

## Benefits

✅ **Automatic type sync** - Never forget to regenerate types
✅ **Catch breaking changes** - Contract tests run before commit
✅ **Code quality** - Consistent formatting and linting
✅ **Prevent errors** - Catch issues before they reach CI/CD
✅ **Save time** - No manual type generation needed

## Related Documentation

- [TYPE_SYNC_IMPLEMENTATION.md](TYPE_SYNC_IMPLEMENTATION.md) - Complete type synchronization guide
- [backend/tests/test_contracts.py](backend/tests/test_contracts.py) - Contract test implementation
- [frontend/scripts/generate-types.sh](frontend/scripts/generate-types.sh) - Type generation script