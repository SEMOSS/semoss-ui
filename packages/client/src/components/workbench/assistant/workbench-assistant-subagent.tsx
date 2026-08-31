import { BotIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn, Spinner } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type { BuildRun } from "@/stores/workbench";
import {
	displayToolName,
	isCompleteStatus,
	isToolActive,
	statusLabel,
} from "./workbench-assistant-tools";

interface WorkbenchAssistantSubagentProps {
	/** ID of the delegated child run to display */
	childRunId: string;

	/**
	 * Renders the nested run feed for the expanded child; passed down from
	 * the feed component to avoid a circular import
	 */
	renderFeed: (run: BuildRun) => ReactNode;
}

/**
 * Delegated-agent card on the run feed: alias, live status (colored with the
 * design-system success/destructive tokens on completion/failure), and the
 * child's latest active tool while running. Auto-opens when the child
 * fails or needs input. Expanding lazily hydrates the child run's durable
 * record when it hasn't been reconciled yet, then renders a nested run feed
 * via the `renderFeed` prop.
 *
 * @name WorkbenchAssistantSubagent
 * @param childRunId - ID of the delegated child run to display.
 * @param renderFeed - Renders the nested run feed for the expanded child.
 * @return The expandable subagent card.
 */
export const WorkbenchAssistantSubagent = ({
	childRunId,
	renderFeed,
}: WorkbenchAssistantSubagentProps) => {
	const child = useWorkbench((state) => state.assistant.runs[childRunId]) as
		| BuildRun
		| undefined;
	const fetchRun = useWorkbench((state) => state.assistant.fetchRun);
	const status = child?.status ?? "SUBMITTED";
	const failed = status === "FAILED";
	const attention = failed || status === "INPUT_REQUIRED";
	const [open, setOpen] = useState(attention);
	const [loading, setLoading] = useState(false);

	const activeTool = child
		? [...child.tools].reverse().find(isToolActive)
		: undefined;
	const latestMessage = child?.messages.at(-1)?.text;

	useEffect(() => {
		if (attention) setOpen(true);
	}, [attention]);

	const toggle = () => {
		const nextOpen = !open;
		setOpen(nextOpen);
		if (!nextOpen || loading) return;
		if (!child || !child.reconciled) {
			setLoading(true);
			void fetchRun(childRunId).finally(() => setLoading(false));
		}
	};

	return (
		<div className="rounded-lg border border-border bg-card">
			<button
				type="button"
				onClick={toggle}
				className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left"
			>
				<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
					<BotIcon className="size-3.5" />
				</span>
				<span className="min-w-0 flex-1">
					<span className="flex items-center gap-2">
						<span className="truncate font-medium text-sm">
							{child?.alias || "Subagent"}
						</span>
						<span
							className={cn(
								"text-xs",
								failed
									? "text-destructive"
									: isCompleteStatus(status)
										? "text-success"
										: "text-muted-foreground",
							)}
						>
							{statusLabel(status)}
						</span>
					</span>
					<span className="mt-0.5 block truncate text-muted-foreground text-xs">
						{activeTool
							? displayToolName(activeTool)
							: latestMessage ||
								child?.resultPreview ||
								"Waiting for activity"}
					</span>
				</span>
				{loading ? (
					<Spinner className="mt-1 size-4 text-muted-foreground" />
				) : open ? (
					<ChevronDownIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRightIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
				)}
			</button>
			{open && child ? (
				<div className="border-border border-t px-3 py-2">
					{renderFeed(child)}
				</div>
			) : null}
		</div>
	);
};
