# AI Context & Project Rules

This document serves as a guide for the AI assistant when working on the Trailhead project. Please refer to these rules and context for every task.

## Development Guidelines

### 1. Accessibility
*   **Requirement**: Any new feature must be designed and implemented with accessibility in mind.
*   **Action**: Ensure proper ARIA labels, semantic HTML, and keyboard navigation support.

### 2. Styling
*   **Requirement**: Avoid inline CSS.
*   **Action**: All styling should be applied using the project's theme system (CSS variables, Tailwind classes if applicable, or centralized stylesheets).

### 3. Version Control
*   **Requirement**: Major changes must be isolated.
*   **Action**: Create a new git branch for any major feature or refactor.

### 4. Database Schema
*   **Requirement**: Schema changes must be portable and automated.
*   **Action**: Ensure any changes to the database schema are packaged (e.g., migration files) so that the backend picks up the changes cleanly upon the next startup.

## Project Context

### Environments
*   **Local Development**:
    *   Backend and Postgres run in Docker containers.
    *   Frontend typically runs locally (e.g., `npm run dev`).
*   **Production**:
    *   Backend, Postgres, Frontend, and Nginx reverse proxy all run in Docker containers.

### Architecture
*   **Backend**: Python/FastAPI (running in Docker).
*   **Database**: PostgreSQL (running in Docker).
*   **Frontend**: React/TypeScript.
