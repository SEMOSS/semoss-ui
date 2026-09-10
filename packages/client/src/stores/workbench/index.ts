// The dock itself lives in @semoss/workbench. Re-exported here so the many
// existing `@/stores/workbench` imports keep resolving; new code may import
// the package directly.
export * from "@semoss/workbench";
export * from "./workbench.constants";
