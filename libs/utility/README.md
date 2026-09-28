# `@semoss/utility`

Small, reusable helpers shared across SEMOSS libraries and applications.

## Import Path

Import public helpers from `@semoss/utility`. The package index exposes clipboard,
date, error, file, image, JSON, Markdown, and string utilities.

The package has no dependency on `@semoss/shared` or UI notification systems.
Browser-only helpers expose behavior and errors; the consuming application owns
toasts, alerts, and other presentation.

Add a helper here only when it has multiple consumers and a stable, generic
contract. Keep feature-specific adapters and UI composition in the owning
package.
