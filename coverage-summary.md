# Test Coverage Improvement Summary

This document summarizes the improvements in test coverage.

## `apps/server/src/state/store.ts`

- **Previous Coverage**: 0%
- **New Coverage**: 95.74%

### Added Tests

A new test file, `apps/server/test/store.test.ts`, was created to cover the functionality of the `MemoryStateStore` and its related utility functions.

The following functions and behaviors are now covered:

- **`computeEtag`**:
  - Verification of consistent ETag generation for the same value and version.
  - Verification of different ETags for different values or versions.

- **`MemoryStateStore`**:
  - `set` and `get`: Basic operations for setting and retrieving state.
  - `merge`: Merging new data into existing state.
  - `delete`: Deleting state.
  - `list`: Listing all artifacts.
  - `snapshot`: Creating a snapshot of the entire store.
  - `clear`: Clearing all data from the store.

- **Snapshot Redaction**:
  - Verification that common secret-like fields (e.g., `secret`, `token`, `password`) are correctly redacted when creating a snapshot.
  - Verification that non-secret fields are not redacted.
  - Verification that redaction can be disabled.
