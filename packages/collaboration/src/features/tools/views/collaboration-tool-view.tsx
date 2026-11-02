import {
	BookOpen,
	Brain,
	CalendarDays,
	FolderOpen,
	Mail,
	MessageSquare,
	Tags,
	Timer,
} from "lucide-react";
import type { ToolViewProps } from "@semoss/shared";
import { Alert, AlertDescription, H4, Muted, Spinner } from "@semoss/ui/next";
import { useToolWorkbench } from "../tool-workbench.context";
import { CollaborationToolApproval } from "./collaboration-tool-approval";
import {
	COLLABORATION_TOOL_VIEWS,
	type CollaborationToolDefinition,
	type CollaborationToolName,
} from "./collaboration-tool-catalog";
import {
	parseToolResult,
	resultCollection,
	resultRecord,
} from "./tool-result-data";
import { ToolResultDetails } from "./tool-result-details";
import { ToolResultList } from "./tool-result-list";

const FAMILY_ICONS = {
	calendar: CalendarDays,
	topics: Tags,
	mail: Mail,
	teams: MessageSquare,
	files: FolderOpen,
	memory: Brain,
	routines: Timer,
	skills: BookOpen,
};

/** A consistent native view for every dedicated tool without its own connector/editor UI. */
export function CollaborationToolView(props: ToolViewProps) {
	const { call, params, mode } = props;
	const { tools } = useToolWorkbench();
	const name = params.tool;
	if (!Object.hasOwn(COLLABORATION_TOOL_VIEWS, name))
		throw new Error("Unknown collaboration tool view");
	const definition: CollaborationToolDefinition =
		COLLABORATION_TOOL_VIEWS[name as CollaborationToolName];
	const Icon = FAMILY_ICONS[definition.family];
	const result = parseToolResult(call.result);
	const record = resultRecord(result);
	const collection = resultCollection(result, definition.collection);
	const details =
		collection && record
			? Object.fromEntries(
					Object.entries(record).filter(
						([, value]) => value !== collection,
					),
				)
			: undefined;
	const hasMore =
		record?.hasMore === true ||
		(collection &&
			typeof record?.total === "number" &&
			record.total > collection.length);
	const isActive = call.status === "pending" || call.status === "running";
	return (
		<section
			aria-label={definition.title}
			className="flex min-w-0 flex-col gap-4 p-3"
		>
			<div className="flex min-w-0 items-center gap-2">
				<Icon
					aria-hidden="true"
					className="size-5 shrink-0 text-muted-foreground"
				/>
				<H4 className="break-words font-medium text-sm">
					{definition.title}
				</H4>
			</div>
			{mode === "approval" ? (
				<CollaborationToolApproval {...props} tool={tools[call.id]} />
			) : call.status === "failed" ? (
				<Alert variant="destructive">
					<AlertDescription>
						{call.result || "This action could not be completed."}
					</AlertDescription>
				</Alert>
			) : call.status === "declined" ? (
				<Muted className="text-sm">This action was not run.</Muted>
			) : isActive ? (
				<output className="flex min-h-24 items-center gap-2 text-muted-foreground text-sm">
					<Spinner
						aria-hidden="true"
						className="size-4 motion-reduce:animate-none"
					/>
					{call.status === "pending"
						? "Waiting to start…"
						: "Working…"}
				</output>
			) : result === undefined ? (
				<Muted className="text-sm">
					The tool completed without returning details.
				</Muted>
			) : (
				<>
					{hasMore && (
						<Alert>
							<AlertDescription>
								These are the results returned so far. More are
								available from the source.
							</AlertDescription>
						</Alert>
					)}
					{collection ? (
						<ToolResultList
							key={call.id}
							items={collection}
							title={definition.title}
						/>
					) : (
						<ToolResultDetails value={result} />
					)}
					{details && Object.keys(details).length > 0 && (
						<details>
							<summary className="cursor-pointer rounded-sm py-2 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								Result details
							</summary>
							<div className="mt-3">
								<ToolResultDetails value={details} />
							</div>
						</details>
					)}
				</>
			)}
		</section>
	);
}
