import type { ActionMessages } from "@semoss/renderer";

// Keep template action message constants local and type-only.
// Do not import the runtime `ActionMessages` enum from `@semoss/renderer` here.
// These templates are serialized JSON-like state definitions; using local string
// literals avoids pulling renderer runtime code into the template modules while
// still enforcing compile-time compatibility via `ActionMessages.<KEY>` types.
export const TEMPLATE_ACTION_MESSAGES = {
	RUN_NOTEBOOK: "RUN_QUERY" as ActionMessages.RUN_NOTEBOOK,
	RUN_CELL: "RUN_CELL" as ActionMessages.RUN_CELL,
	MODIFY_VARIABLE: "MODIFY_VARIABLE" as ActionMessages.MODIFY_VARIABLE,
} as const;
