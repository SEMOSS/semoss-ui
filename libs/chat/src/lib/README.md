# `lib/`

Small, framework-agnostic utility functions with no dependency on React,
Zustand, or `@semoss/sdk` — pure functions that can be reused by any file in
the package.

## Layout

```
lib/
├── date.ts          getDateBucket, normalizeTimestamp, DATE_BUCKET_ORDER
├── clipboard.ts      copy-to-clipboard helper
└── utils.ts          cn() (clsx + tailwind-merge) and other small helpers
```

## Conventions

- One file per concern, named after what it does (`date.ts`, `clipboard.ts`),
  not after a consumer.
- Keep functions pure and side-effect-light where possible; anything that
  needs Zustand/React state belongs in `../stores/` or `../contexts/`
  instead.
