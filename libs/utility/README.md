# `@semoss/utility`

Small, reusable functions shared across SEMOSS libraries and applications.
Use the narrowest public category subpath. Hosts compile this source-only package.

| Import suffix | Functions |
| --- | --- |
| `/text` | Text transforms, initials, hashing, non-empty strings, ANSI stripping, line counts, text size, occurrence counting |
| `/identifier` | Identifier labels, slugs, validation, collision suffixes |
| `/date` | Date/time and duration formatting, timestamp normalization, local-day calculations, relative date buckets |
| `/array` | Ordered item-by-item array comparison |
| `/object` | Date-preserving copying, non-null, non-array object detection, plain-object detection, and shallow equality |
| `/store` | `StoreState`, an immutable-snapshot state holder with subscribe, for framework-free stores, and the `ReadableStore` contract |
| `/react/use-store-selector` | `useStoreSelector`, a React hook that reads a store, or part of one, and renders only when what it reads changes |
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

`isShallowEqual` compares plain records (including null-prototype records) and
ordinary arrays by their own enumerable string-keyed entries, with matching
prototypes and array lengths. Nested values use identity. Other objects, such as
errors, dates, maps, sets, and class instances, compare by identity rather than
their enumerable fields.

`StoreState` holds one immutable snapshot and is what shared application state is
built on, in place of MobX and Zustand. A store keeps one privately and exposes
`getSnapshot` and `subscribe`:

```ts
import { StoreState } from "@semoss/utility/store";

interface CounterSnapshot {
    readonly count: number;
}

class CounterStore {
    private readonly state = new StoreState<CounterSnapshot>({ count: 0 });

    getSnapshot = (): CounterSnapshot => this.state.getSnapshot();
    subscribe = (listener: () => void): (() => void) => this.state.subscribe(listener);

    increment = (): void => {
        this.state.update((current) => ({ count: current.count + 1 }));
    };
}
```

Read a store from React with `useStoreSelector`, which renders only when the
selected part changes. A selector may build an object or array; one holding the
same entries as the last does not render. With no selector it returns the whole
state:

```tsx
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";

const count = useStoreSelector(counterStore, (state) => state.count);
const everything = useStoreSelector(counterStore);
```

Never change a snapshot in place. `update` merges into plain-object state only;
replace arrays, maps, and other state with `set`. Both take a value or a function
of the current state, and a write that changes nothing tells no one. See the [state management skill](../../skills/state-management.skill.md)
for the full rules and [AGENTS.md](./AGENTS.md#storestate) for what the class does
and does not guarantee.

Add a helper here only when it has multiple consumers and a stable, generic
contract. Keep feature-specific adapters and UI composition in the owning
package.

The package has no SDK, shared, or UI dependencies. React is an optional peer,
imported only by the files under `src/react/`, each with its own entry in `exports`,
such as `@semoss/utility/react/use-store-selector`; the root and every other category
work without it. Browser globals are
accessed only when browser helpers run; callers own notifications and feature policy.
Day.js remains the date dependency; existing native Date/Intl output is preserved.
`getDateBucket` and `DATE_BUCKET_ORDER` provide relative groups; callers translate
the bucket IDs and add feature-specific groups such as favorites.
See [AGENTS.md](./AGENTS.md) for package purpose, organization, and available utilities.
