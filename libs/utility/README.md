# `@semoss/utility`

Small, reusable functions shared across SEMOSS libraries and applications.
Use the narrowest public category subpath. Hosts compile this source-only package.

| Import suffix | Functions |
| --- | --- |
| `/text` | Text transforms, initials, hashing, non-empty strings, ANSI stripping, line counts, text size, occurrence counting |
| `/identifier` | Identifier labels, slugs, validation, collision suffixes |
| `/date` | Date/time and duration formatting, timestamp normalization, local-day calculations, relative date buckets |
| `/array` | Ordered item-by-item array comparison |
| `/object` | Date-preserving copying and non-null, non-array object detection |
| `/json` | Strict and tolerant parsing, string-array parsing, formatting, key-sorted serialization, tabular detection, parse-error locations |
| `/file` | File extensions and filename-stem sanitization |
| `/encoding` | Byte/UTF-8 Base64 encoding and strict decoding |
| `/browser` | Favicon updates and Blob downloads |
| `/clipboard` | Clipboard writes with optional result callbacks |
| `/csv` | CSV cell escaping |
| `/async` | Timer-based sleep |
| `/error` | Error-message extraction with optional fallback |
| `/image` | Image MIME lookup and inline-image parsing |
| `/markdown` | Markdown/HTML detection and Markdown input normalization |

Import helpers by their function category:

```ts
import {
    formatLocalDateTime,
    parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { encodeTextToBase64 } from "@semoss/utility/encoding";
import { deepCopy } from "@semoss/utility/object";
import { formatTextByteSize, hashString } from "@semoss/utility/text";
```

The root also exports these helpers. Existing `/string` and `/file-extension`
category paths remain available; prefer the defining categories above for new code.

The package has no React, SDK, shared, or UI dependencies. Browser globals are
accessed only when browser helpers run; callers own notifications and feature policy.
Day.js remains the date dependency; existing native Date/Intl output is preserved.
`getDateBucket` and `DATE_BUCKET_ORDER` provide relative groups; callers translate
the bucket IDs and add feature-specific groups such as favorites.
See [AGENTS.md](./AGENTS.md) for package purpose, organization, and available utilities.
