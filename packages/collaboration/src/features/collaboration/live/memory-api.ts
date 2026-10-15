import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import type { Memory } from "../state/collaboration.types";
import { mapMemory, runBatch } from "./live-state";

// Owner actions taken on the chat's memory card. They go to the server at once, and their results update the
// session (memory.server), instead of going through the saver, because the card acts on what the assistant saved.

type Row = Record<string, unknown>;

export type MemoryAction =
	| "accept"
	| "confirm"
	| "dismiss"
	| "restore"
	| "reopen"
	| "unconfirm";

/** BrainResolveMemory: the memory as it is now, and the one a dismiss brought back. */
export async function resolveMemoryNow(
	actions: InsightActions,
	memoryId: string,
	action: MemoryAction,
): Promise<{ memory: Memory | null; restored: Memory | null }> {
	const [output] = (await runBatch(actions, [
		pixel("BrainResolveMemory", { memoryId, action }),
	])) as Row[];
	return {
		memory: output?.memory ? mapMemory(output.memory as Row) : null,
		restored: output?.restored ? mapMemory(output.restored as Row) : null,
	};
}

/** BrainSaveMemory as the owner: their change, confirmed. */
export async function saveMemoryNow(
	actions: InsightActions,
	memory: Record<string, unknown>,
): Promise<Memory> {
	const [output] = (await runBatch(actions, [
		pixel("BrainSaveMemory", { memory }),
	])) as Row[];
	return mapMemory(output ?? {});
}

/** BrainDeleteMemory: erased, with the versions it replaced. */
export async function deleteMemoryNow(
	actions: InsightActions,
	memoryId: string,
): Promise<void> {
	await runBatch(actions, [pixel("BrainDeleteMemory", { memoryId })]);
}
