// The file panels moved to @semoss/panels so the playground and terminal can
// mount them too. Re-exported here so the eleven domain workbenches and the
// `@/components/workbench` barrel keep resolving; new code should import the
// package directly.
export * from "@semoss/panels";
