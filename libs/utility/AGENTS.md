# AGENTS.md - @semoss/utility

Inherits the [root guide](../../AGENTS.md) and
[React/TypeScript standard](../../skills/react-standard.skill.md).

## Purpose

`@semoss/utility` provides small, reusable, framework-independent helpers shared
across SEMOSS libraries and applications. UI behavior and domain-specific logic
belong in their owning packages.

## Organization

Helpers live in flat files under `src/`, grouped by function. Import from the
matching category, such as `@semoss/utility/text` or `@semoss/utility/date`.
Reuse existing helpers before adding new ones, and keep abstractions simple.

This package is source-only; consuming applications compile it. The root also
exports the public helpers. See the [README](./README.md) for import examples.

## Available utilities

| Category | Purpose |
| --- | --- |
| `text` | Text transforms, initials, hashing, counting, and HTML character references |
| `identifier` | Identifier labels, slugs, validation, and unique names |
| `date` | Date/time formatting, durations, local dates, and date buckets |
| `array` | Array comparison |
| `object` | Object checks and copying |
| `json` | JSON parsing and formatting, key-sorted serialization, tabular detection, and error locations |
| `file` | File extensions and filename sanitization |
| `encoding` | Base64 encoding and decoding |
| `browser` | Favicons and file downloads |
| `clipboard` | Copying text to the clipboard |
| `csv` | CSV cell escaping |
| `async` | Timing helpers |
| `error` | Error-message extraction |
| `image` | Image MIME types and inline-image parsing |
| `markdown` | Markdown/HTML detection and text normalization |
