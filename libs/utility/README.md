# `@semoss/utility`

Small, reusable functions shared across SEMOSS libraries and applications.
Use the narrowest public category subpath. Hosts compile this source-only package.

| Import suffix | Functions |
| --- | --- |
| `/text` | Text transforms, initials, hashing, non-empty strings, ANSI stripping, line counts, text size, occurrence counting |
| `/identifier` | Identifier labels, slugs, validation, collision suffixes |
| `/date` | Date/time and duration formatting, timestamp normalization, local-day calculations |
| `/object` | Date-preserving copying and non-null, non-array object detection |
| `/json` | Tolerant output parsing, tabular detection, parse-error locations |
| `/file` | File extensions and filename-stem sanitization |
| `/encoding` | Byte/UTF-8 Base64 encoding and strict decoding |
| `/browser` | Favicon updates and Blob downloads |
| `/clipboard` | Clipboard writes with optional result callbacks |
| `/csv` | CSV cell escaping |
| `/async` | Timer-based sleep |
| `/error` | Error-message extraction with optional fallback |
| `/image` | Image MIME lookup and inline-image parsing |
| `/markdown` | Markdown/HTML detection and Markdown input normalization |

For example, import `hashString` from `@semoss/utility/text`. The root and old
`/string`, `/file-extension`, Markdown text-helper, and JSON copy exports remain
compatible. Prefer the categories above for new code.

The package has no React, SDK, shared, or UI dependencies. Browser globals are
accessed only when browser helpers run; callers own notifications and feature policy.
Day.js remains the date dependency; existing native Date/Intl output is preserved.
See [AGENTS.md](./AGENTS.md) for ownership, compatibility, and validation guidance.
