import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	H4,
	P,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { downloadBlob } from "@semoss/utility/browser";
import type { EngineInfo, RoomRunDetail } from "./agent-activity-types";
import { AgentRoomDetailLine } from "./agent-room-detail-line";
import {
	type AgentRoomExportDetail,
	agentRoomExportFileName,
	buildAgentRoomMarkdown,
} from "./agent-room-markdown";
import { AgentRunGraph } from "./agent-run-graph";

export interface AgentRoomViewProps {
	/** The room shown */
	roomId: string;
	/** The room's name, shown over its id; "Untitled room" when it has none */
	roomName: string | null;
	/** A summary between the header and the graph, such as who the room belongs to */
	details?: ReactNode;
	/** More actions after Refresh and Export, such as closing the room */
	actions?: ReactNode;
	/** More lines for the export's header, such as the room's user and agent */
	exportDetails?: AgentRoomExportDetail[];
	/** The room's runs, each with its transcript and subagent tree */
	runs: RoomRunDetail[];
	/** Model display names, keyed by engine id */
	engineInfo: Record<string, EngineInfo>;
	/** Whether the room's runs are loading for the first time */
	isLoading: boolean;
	/** Whether the room's runs are being read again */
	isRefreshing: boolean;
	/** Why the room's runs could not be read, shown with Retry in place of the graph */
	error?: string | null;
	/** Goes back to the list of rooms */
	onBack: () => void;
	/** Reads the room's runs again */
	onRefresh: () => void;
	/** Shows the graph without the Analyze tab, as a view of another user's runs */
	isReadOnly?: boolean;
}

/**
 * One room's agent runs: a header with Back, the room's name and its actions,
 * an optional summary, and the execution graph of its runs, subagents and tool
 * calls. Export downloads the runs as Markdown, every message between the user,
 * the agent and its tools included, for someone investigating the room. The graph stays mounted while it refreshes - only the button spins -
 * so the selected node and the pan and zoom are kept. The room's name takes
 * focus when the view opens, since the list it replaced held the focus.
 */
export const AgentRoomView = ({
	roomId,
	roomName,
	details,
	actions,
	exportDetails,
	runs,
	engineInfo,
	isLoading,
	isRefreshing,
	error = null,
	onBack,
	onRefresh,
	isReadOnly = false,
}: AgentRoomViewProps) => {
	const isBusy = isRefreshing || isLoading;
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		headingRef.current?.focus({ preventScroll: true });
	}, []);

	const handleExport = () => {
		const markdown = buildAgentRoomMarkdown({
			roomId,
			roomName,
			runs,
			engineInfo,
			details: exportDetails,
			exportedAt: new Date().toISOString(),
		});
		downloadBlob(
			new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
			agentRoomExportFileName(roomId, roomName),
		);
	};
	const canExport = !isBusy && runs.length > 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
				<div className="flex min-w-0 flex-1 items-start gap-3">
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								aria-label="Back to list"
								variant="outline"
								size="icon-sm"
								className="shrink-0"
								onClick={onBack}
							>
								<ArrowLeft
									className="size-4"
									aria-hidden="true"
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent
							sideOffset={4}
							className="max-w-xs break-words"
						>
							Back to list
						</TooltipContent>
					</Tooltip>
					<div className="min-w-0 flex-1">
						<H4
							ref={headingRef}
							tabIndex={-1}
							className="break-words text-base outline-none"
						>
							{roomName ?? "Untitled room"}
						</H4>
						<AgentRoomDetailLine
							className="block"
							title={`id: ${roomId}`}
						>
							id: {roomId}
						</AgentRoomDetailLine>
						<P className="text-muted-foreground text-xs">
							Execution graph of agent runs, subagents, and tool
							calls in this room.
						</P>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2 ps-11 sm:shrink-0 sm:ps-0">
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<span
								className="inline-flex"
								tabIndex={isBusy ? 0 : undefined}
							>
								<Button
									variant="outline"
									size="sm"
									disabled={isBusy}
									onClick={onRefresh}
								>
									<RefreshCw
										className={
											isRefreshing
												? "size-4 animate-spin"
												: "size-4"
										}
										aria-hidden="true"
									/>
									Refresh
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent
							sideOffset={4}
							className="max-w-xs break-words"
						>
							{isBusy
								? "Loading run details..."
								: "Pull the latest runs for this room"}
						</TooltipContent>
					</Tooltip>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<span
								className="inline-flex"
								tabIndex={canExport ? undefined : 0}
							>
								<Button
									variant="outline"
									size="sm"
									disabled={!canExport}
									onClick={handleExport}
								>
									<Download
										className="size-4"
										aria-hidden="true"
									/>
									Export
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent
							sideOffset={4}
							className="max-w-xs break-words"
						>
							{isBusy
								? "Loading run details..."
								: runs.length > 0
									? "Download as Markdown"
									: "No runs to export"}
						</TooltipContent>
					</Tooltip>
					{actions}
				</div>
			</div>
			{details}

			{isLoading ? (
				// design-lint-disable-next-line arbitrary-size -- the run graph's fixed height
				<Skeleton className="h-[600px] w-full rounded-xl" />
			) : error && runs.length === 0 ? (
				<Alert variant="destructive">
					<AlertTitle>Unable to load this room's runs</AlertTitle>
					<AlertDescription>
						<P className="break-words text-sm">{error}</P>
						<Button
							type="button"
							variant="outline"
							disabled={isBusy}
							onClick={onRefresh}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			) : runs.length > 0 ? (
				<AgentRunGraph
					key={roomId}
					roomId={roomId}
					roomName={roomName ?? undefined}
					runs={runs}
					engineInfo={engineInfo}
					isReadOnly={isReadOnly}
				/>
			) : (
				<P className="text-muted-foreground text-sm">
					No run data available.
				</P>
			)}
		</div>
	);
};
