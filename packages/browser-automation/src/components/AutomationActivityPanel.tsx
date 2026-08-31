import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleAlert,
	Sparkles,
	Wrench,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge, Button, Muted, Small, Spinner } from "@semoss/ui/next";
import type {
	AutomationHistoryEntry,
	AutomationRunStatus,
} from "../types/automation.types";

interface AutomationActivityPanelProps {
	open: boolean;
	history: AutomationHistoryEntry[];
	runStatus: AutomationRunStatus | null;
	onToggle: () => void;
}

function typeLabel(entry: AutomationHistoryEntry): string {
	if (entry.type === "webmcp") return entry.toolName || entry.label;
	return entry.label || entry.type;
}

function StepRow({ entry }: { entry: AutomationHistoryEntry }) {
	const [expanded, setExpanded] = useState(false);
	const hasDetail = !!(
		entry.toolResult ||
		entry.toolArguments ||
		entry.value ||
		entry.error
	);

	return (
		<div className="rounded-md border border-line p-2">
			<div className="flex items-start gap-2">
				{entry.status === "success" ? (
					<CheckCircle2
						className="mt-0.5 size-3.5 shrink-0 text-success"
						aria-hidden
					/>
				) : (
					<CircleAlert
						className="mt-0.5 size-3.5 shrink-0 text-destructive"
						aria-hidden
					/>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<Small className="font-medium">
							Step {entry.iteration}
						</Small>
						<Badge
							variant={
								entry.type === "webmcp"
									? "default"
									: "secondary"
							}
							className="gap-1"
						>
							{entry.type === "webmcp" ? (
								<Wrench className="size-3" aria-hidden />
							) : null}
							{entry.type}
						</Badge>
						{typeof entry.elapsedMs === "number" && (
							<Muted className="text-xs">
								{(entry.elapsedMs / 1000).toFixed(1)}s
							</Muted>
						)}
					</div>
					<Small className="block truncate" title={typeLabel(entry)}>
						{typeLabel(entry)}
					</Small>
					{entry.reason ? (
						<Muted className="mt-0.5 block text-xs italic">
							{entry.reason}
						</Muted>
					) : null}
				</div>
				{hasDetail && (
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => setExpanded((value) => !value)}
						aria-label={
							expanded
								? `Hide step ${entry.iteration} details`
								: `Show step ${entry.iteration} details`
						}
					>
						{expanded ? <ChevronDown /> : <ChevronRight />}
					</Button>
				)}
			</div>

			{expanded && (
				<div className="mt-2 space-y-2 border-line border-t pt-2">
					{entry.toolArguments && (
						<div>
							<Muted className="text-xs uppercase">
								Arguments
							</Muted>
							<pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-surface-raised p-1.5 text-xs">
								{JSON.stringify(entry.toolArguments, null, 2)}
							</pre>
						</div>
					)}
					{entry.value && (
						<div>
							<Muted className="text-xs uppercase">Value</Muted>
							<Small className="block break-all">
								{entry.value}
							</Small>
						</div>
					)}
					{entry.toolResult && (
						<div>
							<Muted className="text-xs uppercase">
								Tool output
							</Muted>
							<pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-surface-raised p-1.5 text-xs">
								{entry.toolResult}
							</pre>
						</div>
					)}
					{entry.error && (
						<div>
							<Muted className="text-xs uppercase">Error</Muted>
							<Small className="block break-all text-destructive">
								{entry.error}
							</Small>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/** Live transcript of the goal-automation run: what the model chose and what came back. */
export const AutomationActivityPanel: React.FC<
	AutomationActivityPanelProps
> = ({ open, history, runStatus, onToggle }) => {
	return (
		<section className="border-line border-b bg-surface-raised/30">
			<div className="flex items-center gap-2 px-2 py-2">
				<Button
					size="icon-sm"
					variant="ghost"
					onClick={onToggle}
					aria-label={
						open
							? "Collapse automation activity"
							: "Expand automation activity"
					}
				>
					{open ? <ChevronDown /> : <ChevronRight />}
				</Button>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5 font-semibold text-sm">
						<Sparkles className="size-3.5 text-accent" />
						Automation activity
						<Badge variant="secondary">{history.length}</Badge>
					</div>
				</div>
			</div>

			{open && (
				<div className="max-h-[50vh] space-y-2 overflow-y-auto px-2 pb-2">
					{history.map((entry) => (
						<StepRow
							key={`${entry.iteration}-${entry.type}-${entry.toolName || entry.label}`}
							entry={entry}
						/>
					))}
					{runStatus && (
						<div className="flex items-center gap-2 rounded-md border border-line border-dashed p-2">
							<Spinner className="h-3.5 w-3.5 shrink-0 text-accent" />
							<Muted className="min-w-0 flex-1 truncate text-xs">
								{runStatus.detail}
							</Muted>
						</div>
					)}
					{!history.length && !runStatus && (
						<Muted className="block px-1 pb-1 text-xs">
							Run a goal to see each planned action, the model's
							reasoning, and any tool output here.
						</Muted>
					)}
				</div>
			)}
		</section>
	);
};
