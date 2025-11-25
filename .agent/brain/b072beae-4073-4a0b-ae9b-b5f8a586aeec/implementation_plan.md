# Implementation Plan - Fix Outing Creation Datetime Error

## Goal
Resolve the `DBAPIError` caused by "can't subtract offset-naive and offset-aware datetimes" when creating an outing. This occurs because the frontend sends a timezone-aware datetime for `signups_close_at`, but the database column is `TIMESTAMP WITHOUT TIME ZONE` (naive), and other fields like `created_at` are naive UTC.

## Proposed Changes
1.  **Update `backend/app/crud/outing.py`**:
    *   In the `create_outing` function, check if `outing.signups_close_at` is timezone-aware.
    *   If it is, convert it to UTC and strip the timezone info (make it naive) before creating the `Outing` model instance.
    *   This ensures consistency with `created_at` and `updated_at` which are naive UTC.

## Verification Plan
1.  **Automated Tests**:
    *   Create a new test case in `backend/tests/test_crud_outing.py` or `backend/tests/test_api_outings.py` that specifically passes a timezone-aware datetime for `signups_close_at`.
    *   Verify that the outing is created successfully.
2.  **Manual Verification**:
    *   Use the frontend Outing Wizard to create an outing with a "Signup Close Date" set.
    *   Verify that the request succeeds and the outing is created.
