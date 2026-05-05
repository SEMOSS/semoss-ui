import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Database,
	Wrench,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import type { AgentTraceStep } from "./types";

interface SpanTreeProps {
	steps: AgentTraceStep[];
}

interface StepNodeProps {
	step: AgentTraceStep;
	expanded: boolean;
	onToggle: () => void;
}

function computeDuration(step: AgentTraceStep): string {
	// Prefer server-computed DURATION_MS (millisecond precision)
	if (step.DURATION_MS != null && step.DURATION_MS > 0) {
		const ms = step.DURATION_MS;
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}
	try {
		const diff =
			new Date(step.END_TIME.replace(" ", "T")).getTime() -
			new Date(step.START_TIME.replace(" ", "T")).getTime();
		if (Number.isNaN(diff) || diff < 0) return "—";
		if (diff === 0) return "< 1s";
		if (diff < 1000) return `${diff}ms`;
		return `${(diff / 1000).toFixed(1)}s`;
	} catch {
		return "—";
	}
}

const StepNode = ({ step, expanded, onToggle }: StepNodeProps) => {
	const isSuccess = step.STATUS === "success";
	const isMcp = step.IS_MCP;

	return (
		<div className="border-border border-b last:border-b-0">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
				onClick={onToggle}
			>
				<span className="w-4 shrink-0 text-muted-foreground">
					{expanded ? (
						<ChevronDown className="size-3.5" />
					) : (
						<ChevronRight className="size-3.5" />
					)}
				</span>

				{isSuccess ? (
					<CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
				) : (
					<XCircle className="size-3.5 shrink-0 text-red-500" />
				)}

				{isMcp ? (
					<Database className="size-3.5 shrink-0 text-blue-500" />
				) : (
					<Wrench className="size-3.5 shrink-0 text-amber-500" />
				)}

				<span className="flex-1 truncate font-medium text-sm">
					{step.TOOL_NAME}
				</span>

				<span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
					<Clock className="size-3" />
					{computeDuration(step)}
				</span>

				<span
					className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-medium text-[10px] ${
						isSuccess
							? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
							: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
					}`}
				>
					{step.STATUS}
				</span>
			</button>

			{expanded && (
				<div className="space-y-2 border-border border-t bg-muted/20 px-4 py-3">
					<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
						<div>
							<span className="text-muted-foreground">
								Tool Call ID:
							</span>{" "}
							<span className="font-mono">
								{step.TOOL_CALL_ID?.slice(0, 20)}...
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								Step #:
							</span>{" "}
							{step.STEP_NUMBER}
						</div>
						{step.ENGINE_ID && (
							<div>
								<span className="text-muted-foreground">
									Engine:
								</span>{" "}
								<span className="font-mono text-[11px]">
									{step.ENGINE_ID.slice(0, 12)}...
								</span>
							</div>
						)}
						{step.ENGINE_TYPE && (
							<div>
								<span className="text-muted-foreground">
									Engine Type:
								</span>{" "}
								{step.ENGINE_TYPE}
							</div>
						)}
						<div>
							<span className="text-muted-foreground">MCP:</span>{" "}
							{step.IS_MCP ? "Yes" : "No"}
						</div>
						<div>
							<span className="text-muted-foreground">
								Start:
							</span>{" "}
							{step.START_TIME}
						</div>
					</div>

					{step.TOOL_INPUT_JSON && (
						<div>
							<p className="mb-1 font-medium text-muted-foreground text-xs">
								Input
							</p>
							<pre className="max-h-32 overflow-auto rounded bg-background p-2 font-mono text-[11px]">
								{formatJson(step.TOOL_INPUT_JSON)}
							</pre>
						</div>
					)}

					{step.OUTPUT_TEXT && (
						<div>
							<p className="mb-1 font-medium text-muted-foreground text-xs">
								Output
							</p>
							<pre className="max-h-48 overflow-auto rounded bg-background p-2 font-mono text-[11px]">
								{step.OUTPUT_TEXT.length > 2000
									? `${step.OUTPUT_TEXT.slice(0, 2000)}...`
									: step.OUTPUT_TEXT}
							</pre>
						</div>
					)}

					{step.ERROR_MESSAGE && (
						<div>
							<p className="mb-1 font-medium text-red-600 text-xs">
								Error
							</p>
							<pre className="max-h-32 overflow-auto rounded bg-red-50 p-2 font-mono text-[11px] text-red-700 dark:bg-red-950/30 dark:text-red-400">
								{step.ERROR_MESSAGE}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

function formatJson(input: string): string {
	try {
		return JSON.stringify(JSON.parse(input), null, 2);
	} catch {
		return input;
	}
}

export const SpanTree = ({ steps }: SpanTreeProps) => {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	if (!steps || steps.length === 0) {
		return (
			<p className="py-4 text-center text-muted-foreground text-sm">
				No tool steps recorded for this trace.
			</p>
		);
	}

	const toggle = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<div className="divide-y-0 rounded border border-border bg-card">
			{steps.map((step) => (
				<StepNode
					key={step.STEP_ID}
					step={step}
					expanded={expandedIds.has(step.STEP_ID)}
					onToggle={() => toggle(step.STEP_ID)}
				/>
			))}
		</div>
	);
};
