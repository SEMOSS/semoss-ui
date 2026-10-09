import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, Muted, P } from "@semoss/ui/next";
import { mapMemory } from "@/features/collaboration/live/live-state";
import {
	deleteMemoryNow,
	resolveMemoryNow,
	saveMemoryNow,
} from "@/features/collaboration/live/memory-api";
import type {
	Memory,
	MemoryRef,
} from "@/features/collaboration/state/collaboration.types";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationTool } from "@/features/messages/types/message";

/** What Remember or Forget returned (BrainMemoryUtils.toolResult). */
export interface MemoryToolResult {
	status:
		| "saved"
		| "updated"
		| "exists"
		| "undone_here"
		| "needs_owner"
		| "forgotten";
	memory: Memory;
	replaced?: Memory;
	proposed?: {
		kind: Memory["kind"];
		text: string;
		about: MemoryRef[];
		expiresAt: string | null;
	};
}

const STATUSES = new Set<string>([
	"saved",
	"updated",
	"exists",
	"undone_here",
	"needs_owner",
	"forgotten",
]);

/** The memory tool's JSON output, or null when it is not one. */
export function parseMemoryResult(
	output: string | undefined,
): MemoryToolResult | null {
	if (!output) return null;
	try {
		const parsed = JSON.parse(output) as Record<string, unknown>;
		const memory = parsed?.memory as Record<string, unknown> | undefined;
		if (!STATUSES.has(String(parsed?.status)) || !memory?.id) return null;
		const proposed = parsed.proposed as Record<string, unknown> | undefined;
		return {
			status: parsed.status as MemoryToolResult["status"],
			memory: mapMemory(memory),
			...(parsed.replaced
				? {
						replaced: mapMemory(
							parsed.replaced as Record<string, unknown>,
						),
					}
				: {}),
			...(proposed && typeof proposed.text === "string"
				? {
						proposed: {
							kind:
								proposed.kind === "preference"
									? "preference"
									: "fact",
							text: proposed.text,
							about: Array.isArray(proposed.about)
								? (proposed.about as MemoryRef[])
								: [],
							expiresAt:
								typeof proposed.expiresAt === "string"
									? proposed.expiresAt
									: null,
						},
					}
				: {}),
		};
	} catch {
		return null;
	}
}

// each live result reaches the session once per page, so reopening a thread never brings back a memory deleted since
const applied = new Set<string>();

/** Remember and Forget in the chat: what changed, and the owner's Undo, Confirm, or approval. */
export function MemoryToolCard({
	tool,
	result,
	isLive,
}: {
	tool: ConversationTool;
	result: MemoryToolResult;
	/** The call ran while this page was open, so its result is news to the session. */
	isLive: boolean;
}) {
	const { actions } = useInsight();
	const session = useOptionalCollaborationSession();
	const [outcome, setOutcome] = useState("");
	const [error, setError] = useState("");
	const [isBusy, setIsBusy] = useState(false);
	const { memory, replaced, proposed, status } = result;
	const dispatch = session?.dispatch;

	useEffect(() => {
		if (!isLive || !dispatch || applied.has(tool.id)) return;
		applied.add(tool.id);
		const memories =
			status === "saved" || status === "updated" ? [memory] : [];
		const removedIds = [
			...(status === "updated" && replaced ? [replaced.id] : []),
			...(status === "forgotten" ? [memory.id] : []),
		];
		if (memories.length || removedIds.length)
			dispatch({ type: "memory.server", memories, removedIds });
	}, [isLive, dispatch, tool.id, status, memory, replaced]);

	// actions only while the memory is still as the card shows it, never for an old card
	const current = session?.state.memories.find(
		(candidate) => candidate.id === memory.id,
	);
	const canUndo =
		(status === "saved" || status === "updated") &&
		current?.state === "active" &&
		!current.confirmed;
	const canApprove = status === "needs_owner" && current?.state === "active";
	const canRestore = status === "forgotten" && isLive && !current;

	const run = async (work: () => Promise<string>) => {
		setIsBusy(true);
		setError("");
		try {
			setOutcome(await work());
		} catch (cause: unknown) {
			setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			setIsBusy(false);
		}
	};
	const undo = () =>
		run(async () => {
			const out = await resolveMemoryNow(actions, memory.id, "dismiss");
			dispatch?.({
				type: "memory.server",
				memories: out.restored ? [out.restored] : [],
				removedIds: [memory.id],
			});
			return out.restored
				? "Undone. The earlier memory is back."
				: "Undone.";
		});
	const confirm = () =>
		run(async () => {
			const out = await resolveMemoryNow(actions, memory.id, "confirm");
			if (out.memory)
				dispatch?.({ type: "memory.server", memories: [out.memory] });
			return "Confirmed. The assistant can act on it.";
		});
	const restore = () =>
		run(async () => {
			const out = await resolveMemoryNow(actions, memory.id, "restore");
			if (out.memory)
				dispatch?.({ type: "memory.server", memories: [out.memory] });
			return "Kept. The assistant remembers it again.";
		});
	const apply = () =>
		run(async () => {
			if (proposed) {
				const saved = await saveMemoryNow(actions, {
					id: memory.id,
					kind: proposed.kind,
					text: proposed.text,
					about: proposed.about,
					expiresAt: proposed.expiresAt ?? "",
				});
				dispatch?.({ type: "memory.server", memories: [saved] });
				return "Updated.";
			}
			await deleteMemoryNow(actions, memory.id);
			dispatch?.({ type: "memory.server", removedIds: [memory.id] });
			return "Forgotten.";
		});

	const title =
		status === "saved"
			? "Saved to memory"
			: status === "updated"
				? "Updated memory"
				: status === "exists"
					? "Already in memory"
					: status === "undone_here"
						? "Not saved again"
						: status === "forgotten"
							? "Forgot"
							: proposed
								? "Update this memory?"
								: "Forget this memory?";
	const shown =
		status === "needs_owner" && proposed ? proposed.text : memory.text;
	return (
		<div
			data-tool-id={tool.id}
			className="min-w-0 space-y-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
		>
			<div className="flex items-center gap-2">
				<Brain
					aria-hidden="true"
					className="size-4 shrink-0 text-muted-foreground"
				/>
				<Muted className="font-medium text-foreground text-sm">
					{title}
				</Muted>
			</div>
			<P
				className={cn(
					"break-words text-sm leading-6",
					status === "forgotten" &&
						"text-muted-foreground line-through",
				)}
			>
				{shown}
			</P>
			{status === "updated" && replaced && (
				<Muted className="block break-words text-xs">
					Was: {replaced.text}
				</Muted>
			)}
			{status === "needs_owner" && (
				<Muted className="block break-words text-xs">
					{proposed
						? `You wrote: ${memory.text}`
						: "You wrote this memory, so the assistant asks first."}
				</Muted>
			)}
			{status === "undone_here" && (
				<Muted className="block text-xs">
					You removed this here. Type /remember and the sentence to
					keep it.
				</Muted>
			)}
			{(status === "saved" || status === "updated") && !outcome && (
				<Muted className="block text-xs">
					{current?.confirmed
						? "Confirmed."
						: "Learned: used as background until you confirm it."}
				</Muted>
			)}
			{outcome && <Muted className="block text-xs">{outcome}</Muted>}
			{error && <P className="text-destructive text-xs">{error}</P>}
			{!outcome && (canUndo || canApprove || canRestore) && (
				<div className="-ml-2 flex flex-wrap gap-1">
					{canUndo && (
						<Button
							variant="ghost"
							size="sm"
							disabled={isBusy}
							onClick={undo}
						>
							Undo
						</Button>
					)}
					{canUndo && (
						<Button
							variant="ghost"
							size="sm"
							disabled={isBusy}
							onClick={confirm}
						>
							Confirm
						</Button>
					)}
					{canApprove && (
						<Button
							variant="ghost"
							size="sm"
							disabled={isBusy}
							onClick={apply}
						>
							{proposed ? "Update" : "Forget it"}
						</Button>
					)}
					{canApprove && (
						<Button
							variant="ghost"
							size="sm"
							disabled={isBusy}
							onClick={() => setOutcome("Kept as it was.")}
						>
							Keep
						</Button>
					)}
					{canRestore && (
						<Button
							variant="ghost"
							size="sm"
							disabled={isBusy}
							onClick={restore}
						>
							Undo
						</Button>
					)}
					<Button asChild variant="ghost" size="sm">
						<Link to="/brain/memory">Manage</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
