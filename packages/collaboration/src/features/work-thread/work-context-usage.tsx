import { useId, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	H4,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Spinner,
	z,
} from "@semoss/ui/next";
import type { ThreadCompactionStrategy } from "@/features/thread-assistant/api/thread-compaction";
import { useWorkThread } from "./work-thread-context";

const strategySchema = z.enum(["AUTO", "SUMMARY", "TOOL_PRUNE"]);
/** Recorded usage and explicit compaction, sharing the conversation's mutation lock. */
export function WorkContextUsage() {
	const { session, snapshot } = useWorkThread();
	const id = useId();
	const [strategy, setStrategy] = useState<ThreadCompactionStrategy>("AUTO");
	const [error, setError] = useState("");
	const query = usePixel<unknown>(
		snapshot.isReady && snapshot.modelId
			? `META | GetContextWindow(${JSON.stringify(snapshot.modelId)});`
			: "",
	);
	const parsed = z.number().positive().safeParse(query.data);
	const capacity = parsed.success ? parsed.data : null;
	const usage = snapshot.usage;
	const leaf = snapshot.turn.messages.at(-1);
	const isLocked =
		!snapshot.isReady ||
		!snapshot.association ||
		Boolean(snapshot.error) ||
		snapshot.isLoading ||
		snapshot.isCompacting ||
		snapshot.isPreparing ||
		snapshot.isSavingSettings ||
		snapshot.turn.isSubmitting ||
		snapshot.turn.isRunning ||
		snapshot.turn.isRestoring ||
		snapshot.turn.pendingApprovals.length > 0 ||
		Boolean(snapshot.turn.transportError) ||
		snapshot.hasUnconfirmedSubmission ||
		snapshot.isCreationUncertain ||
		!leaf ||
		leaf.role !== "assistant" ||
		leaf.parts.some((part) => part.type === "tool");
	const handleCompact = async (): Promise<void> => {
		if (isLocked) return;
		setError("");
		try {
			await session.compact(strategy);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not compact the conversation.",
			);
		}
	};
	return (
		<section
			className="space-y-3 border-t pt-4"
			aria-label="Conversation usage"
		>
			<H4>Conversation usage</H4>
			<dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
				<dt className="text-muted-foreground">Last recorded context</dt>
				<dd className="text-end tabular-nums">
					{usage.contextTokens === null
						? "Not available yet"
						: `${usage.contextTokens.toLocaleString()} tokens`}
				</dd>
				<dt className="text-muted-foreground">Model capacity</dt>
				<dd className="text-end tabular-nums">
					{capacity
						? `${capacity.toLocaleString()} tokens`
						: query.status === "LOADING"
							? "Loading…"
							: "Not available"}
				</dd>
				<dt className="text-muted-foreground">Total consumed</dt>
				<dd className="text-end tabular-nums">
					{usage.totalTokens === null
						? "Not available yet"
						: `${usage.totalTokens.toLocaleString()} tokens`}
				</dd>
			</dl>
			{query.error && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={query.refresh}
				>
					Retry model capacity
				</Button>
			)}
			<P className="text-muted-foreground text-sm">
				Compact older conversation context to make room for new
				messages. Saved source messages remain available.
			</P>
			<div className="space-y-2">
				<Label htmlFor={id}>Compaction strategy</Label>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={strategy}
						disabled={isLocked}
						onValueChange={(value) => {
							const next = strategySchema.safeParse(value);
							if (next.success) setStrategy(next.data);
						}}
					>
						<SelectTrigger id={id} className="min-w-0 flex-1">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="AUTO">Automatic</SelectItem>
							<SelectItem value="SUMMARY">
								Summarize history
							</SelectItem>
							<SelectItem value="TOOL_PRUNE">
								Prune tool results
							</SelectItem>
						</SelectContent>
					</Select>
					<Button
						type="button"
						variant="outline"
						disabled={isLocked}
						onClick={() => void handleCompact()}
					>
						{snapshot.isCompacting && <Spinner />}
						{snapshot.isCompacting ? "Compacting…" : "Compact"}
					</Button>
				</div>
			</div>
			{isLocked && !snapshot.isCompacting && (
				<Small className="block text-muted-foreground">
					Available after Assistant finishes a response and all tools
					are resolved.
				</Small>
			)}
			{(error || snapshot.compactionError) && (
				<Alert variant="destructive">
					<AlertDescription>
						{error || snapshot.compactionError}
					</AlertDescription>
				</Alert>
			)}
			{snapshot.compactionNotice && (
				<output className="block text-sm">
					{snapshot.compactionNotice}
				</output>
			)}
		</section>
	);
}
