// `useAccess` and the permission cache behind it moved to @semoss/panels with
// the file panels. Re-exported so existing `@/hooks` imports keep resolving.
export { type AccessState, useAccess } from "@semoss/panels";
