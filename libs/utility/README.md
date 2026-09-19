# `@semoss/utility`

Small, reusable helpers shared across SEMOSS libraries and applications.

## Import Paths

Use the narrowest category subpath needed by the consumer:

- `@semoss/utility/clipboard` for browser clipboard access.
- `@semoss/utility/date` for date formatting and SEMOSS timestamp normalization.
- `@semoss/utility/file` for image MIME and inline-image helpers.
- `@semoss/utility/json` for tolerant output parsing and deep copying.
- `@semoss/utility/string` for labels, identifiers, initials, and string transforms.

The package has no dependency on `@semoss/shared` or UI notification systems.
Browser-only helpers expose behavior and errors; the consuming application owns
toasts, alerts, and other presentation.

Add a helper here only when it has multiple consumers and a stable, generic
contract. Keep feature-specific adapters and UI composition in the owning
package.