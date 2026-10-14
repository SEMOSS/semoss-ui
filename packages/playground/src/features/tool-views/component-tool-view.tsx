import { observer } from "mobx-react-lite";
import { type ReactNode, useState } from "react";
import { type ResolvedToolView, ToolViewRenderer } from "@semoss/shared";
import { cn, Skeleton } from "@semoss/ui/next";
import type { ToolStore } from "@/stores/tool/tool.store";
import { toToolViewCall, toToolViewMode } from "./tool-view-call";
import { createToolViewDecisions } from "./tool-view-decisions";
import { useRoomToolViewHost } from "./use-room-tool-view-host";

/**
 * A decision that, once made, tells the view so.
 *
 * @param decide - Makes the decision.
 * @param onDecided - Called once it is made.
 * @return The decision.
 */
const afterDecision =
	<A extends unknown[]>(
		decide: (...args: A) => Promise<void>,
		onDecided: () => void,
	) =>
	async (...args: A): Promise<void> => {
		await decide(...args);
		onDecided();
	};

/** Props for {@link ComponentToolView}. */
export interface ComponentToolViewProps {
	/** The call. */
	tool: ToolStore;
	/** The view its `component://` URI names, from `useToolView`. */
	view: ResolvedToolView;
	/**
	 * `inline` sits in the conversation, where a result is kept to a bounded
	 * height and an approval sizes to its form; `panel` fills a sidebar tab.
	 */
	variant: "inline" | "panel";
	/** Shown if the view fails, such as the call's generic card. */
	fallback: ReactNode;
}

/**
 * A tool call drawn with the `component://` view it names, in the page: the
 * call's arguments, its result, and its decisions go to the view directly,
 * never through a frame. Once a decision is made the view shows the call's
 * result, even before an agent run's next update says it is no longer
 * waiting, so it cannot be decided twice.
 */
export const ComponentToolView = observer(
	({ tool, view, variant, fallback }: ComponentToolViewProps) => {
		const host = useRoomToolViewHost(view.params);
		const [isDecided, setIsDecided] = useState(false);
		const mode = isDecided ? "result" : toToolViewMode(tool);
		const decisions = createToolViewDecisions(tool);
		const markDecided = () => setIsDecided(true);
		return (
			<div
				className={cn(
					"min-w-0 overflow-auto",
					variant === "panel"
						? "h-full w-full"
						: "rounded-lg border border-border bg-background",
					variant === "inline" && mode === "result" && "max-h-96",
				)}
			>
				<ToolViewRenderer
					view={view}
					call={toToolViewCall(tool)}
					mode={mode}
					host={host}
					onApprove={afterDecision(decisions.onApprove, markDecided)}
					onDecline={afterDecision(decisions.onDecline, markDecided)}
					onRespond={afterDecision(decisions.onRespond, markDecided)}
					loading={<Skeleton className="h-24 w-full" />}
					fallback={fallback}
				/>
			</div>
		);
	},
);
