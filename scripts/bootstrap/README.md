# Bootstrap Scripts

This directory contains modular scripts for initializing the Trailhead system.

## Overview

The bootstrap process has been refactored from a single monolithic script into a series of focused, single-purpose scripts. This makes the setup process easier to understand, maintain, and debug.

## Scripts

### Utility Library

- **`lib_utils.sh`**: Shared utility functions used by all scripts
  - Color output functions (`print_success`, `print_error`, `print_info`, etc.)
  - Docker detection and command resolution
  - Password/secret generation
  - Config file reading/writing
  - Email validation
  - Domain extraction

### Bootstrap Steps

1. **`01_check_dependencies.sh`**: Check system dependencies

   - Verifies Docker is installed
   - Checks Docker daemon is running
   - Detects Docker Compose command
   - Exports Docker Compose command for other scripts

2. **`02_gather_config.sh`**: Gather configuration from user

   - Prompts for setup mode (quick/custom)
   - Collects deployment mode (dev/production)
   - Gathers host URI and SSL configuration (production)
   - Collects database credentials
   - Generates security keys
   - Configures admin user email
   - Sets up Authentik configuration
   - Saves all settings to `bootstrap_config.env`

3. **`03_cleanup_docker.sh`**: Clean up Docker resources

   - Stops and removes existing containers
   - Optionally removes PostgreSQL volumes
   - Confirms before deleting data

4. **`04_generate_env_files.sh`**: Generate environment files

   - Creates `backend/.env` with API configuration
   - Creates `frontend/.env` with Vite configuration
   - Creates root `.env` for Docker Compose
   - Validates generated files for malformed keys
   - Optionally creates `credentials.txt` with all passwords

5. **`05_start_services.sh`**: Start Postgres database only

   - Starts only the Postgres container
   - Waits for Postgres to be ready
   - Required before creating Authentik database

6. **`06_init_database.sh`**: Create Authentik database

   - Creates Authentik database and user in Postgres
   - Must run before Authentik service starts
   - Handles both `docker compose exec` and `docker exec` methods

7. **`07_start_all_services.sh`**: Build and start all Docker services

   - Builds Docker images
   - Starts all remaining containers
   - Waits for services to be ready
   - Verifies services are running

8. **`08_init_backend_db.sh`**: Initialize backend database

   - Runs backend database initialization
   - Creates tables and initial data
   - Verifies database connection

9. **`09_display_summary.sh`**: Display setup completion information
   - Shows access URLs
   - Displays credentials
   - Provides next steps for Authentik configuration
   - Shows useful commands for managing services

## Usage

### Run Complete Bootstrap

From the project root:

```bash
./bootstrap.sh
```

This runs all scripts in sequence.

### Run Individual Steps

You can run individual scripts for specific tasks:

```bash
# Check dependencies only
./scripts/bootstrap/01_check_dependencies.sh

# Regenerate environment files (requires existing config)
./scripts/bootstrap/04_generate_env_files.sh

# Reinitialize database only
./scripts/bootstrap/06_init_database.sh
```

**Note**: Most scripts depend on configuration from earlier steps. Running scripts out of order may fail.

## Configuration Files

The scripts create and use several configuration files:

- **`scripts/bootstrap/bootstrap_config.env`**: Temporary config file created during bootstrap, contains all settings
- **`scripts/bootstrap/.docker_compose_cmd`**: Contains the detected Docker Compose command
- **`.env`**: Docker Compose environment variables (in project root)
- **`backend/.env`**: Backend API configuration
- **`frontend/.env`**: Frontend build configuration
- **`credentials.txt`**: Optional file with all passwords and secrets (added to .gitignore)
- **`admin-email.txt`**: Saved admin email (added to .gitignore)
- **`production-host.txt`**: Saved production host URI (added to .gitignore)
- **`production-ssl-cert-dir.txt`**: Saved SSL certificate directory (added to .gitignore)

## Development

### Adding New Steps

To add a new bootstrap step:

1. Create a new script: `scripts/bootstrap/NN_step_name.sh`
2. Source the utility library: `source "$SCRIPT_DIR/lib_utils.sh"`
3. Source the config file if needed: `source "$SCRIPT_DIR/bootstrap_config.env"`
4. Add your logic
5. Update `bootstrap.sh` to call your new script in the appropriate order
6. Make it executable: `chmod +x scripts/bootstrap/NN_step_name.sh`

### Modifying Existing Steps

Each script is independent and focused on a single task. To modify behavior:

1. Locate the appropriate script
2. Edit the script directly
3. Test by running the script individually (ensure dependencies are satisfied)

### Error Handling

All scripts use `set -e` to exit on errors. Each script returns a non-zero exit code on failure, which stops the bootstrap process.

## Benefits of Modular Design

1. **Maintainability**: Each script has a single, clear purpose
2. **Reusability**: Individual steps can be run independently
3. **Debugging**: Easier to identify and fix issues in specific steps
4. **Testing**: Scripts can be tested in isolation
5. **Understanding**: Smaller, focused scripts are easier to understand
6. **Flexibility**: Users can skip or customize specific steps

## Migration from Old Bootstrap

The original monolithic `bootstrap.sh` has been backed up to `bootstrap.sh.backup`. The new modular version provides the same functionality with better organization.

Key differences:

- Functions moved to `lib_utils.sh`
- Configuration gathering isolated in `02_gather_config.sh`
- Each major task has its own script
- Main bootstrap script is now a simple orchestrator
