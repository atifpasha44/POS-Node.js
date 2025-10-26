# Migration Notes — IT_CONF_REASONS additions

2025-10-24: Added `display_sequence` (INT) and `OPERATION_TYPE` (VARCHAR) columns to `IT_CONF_REASONS` to align backend schema with frontend Reason Codes functionality. These columns were added via conditional migration scripts to avoid errors on existing installs.

Notes:
- `display_sequence` is used to control ordering of reason codes in the UI.
- `OPERATION_TYPE` stores the reason classification required by business logic.
- Audit/reserve fields in `IT_CONF_PROPERTY` are now server-managed and should not be submitted from the client.
