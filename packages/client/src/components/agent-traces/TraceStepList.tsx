import type React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { AgentTraceStep } from "./types";

interface TraceStepListProps {
	steps: AgentTraceStep[];
	harnessName?: string;
}

function calcDurationMs(start: string, end: string): string {
	const diff = new Date(end).getTime() - new Date(start).getTime();
	return Number.isNaN(diff) ? "—" : `${diff}ms`;
}

const ENGINE_TYPE_COLORS: Record<string, string> = {
	MODEL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
	VECTOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
	FUNCTION:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
	STORAGE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
	DATABASE:
		"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
	GUARDRAIL:
		"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

/** Classifies a tool step's source for display. */
function getToolSource(
	step: AgentTraceStep,
	harnessName?: string,
): { label: string; color: string } {
	// SDK-based harnesses — the tool was executed by an external SDK
	if (
		harnessName === "claude_code" ||
		harnessName === "github_copilot" ||
		harnessName === "github_copilot_py"
	) {
		const sdkLabels: Record<string, string> = {
			claude_code: "Claude Code SDK",
			github_copilot: "GitHub Copilot SDK",
			github_copilot_py: "GitHub Copilot SDK",
		};
		return {
			label: sdkLabels[harnessName] ?? "SDK",
			color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
		};
	}

	// MCP tool routed through a SEMOSS engine (DATABASE, MODEL, VECTOR, etc.)
	if (step.IS_MCP && step.ENGINE_TYPE) {
		return {
			label: `Engine MCP · ${step.ENGINE_TYPE}`,
			color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		};
	}

	// MCP tool routed through a project/app (no ENGINE_TYPE)
	if (step.IS_MCP && step.ENGINE_ID) {
		return {
			label: "App MCP",
			color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
		};
	}

	// Internal MCP (no engine routing)
	if (step.IS_MCP) {
		return {
			label: "Internal MCP",
			color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
		};
	}

	// No MCP flag — direct reactor call or internal tool
	return {
		label: "Internal",
		color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
	};
}

export const TraceStepList: React.FC<TraceStepListProps> = ({
	steps,
	harnessName,
}) => {
	if (!steps.length) {
		return (
			<p className="py-2 text-muted-foreground text-sm">
				No steps found.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-10">#</TableHead>
						<TableHead>Tool</TableHead>
						<TableHead>Engine</TableHead>
						<TableHead>Source</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Error</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{steps
						.slice()
						.sort((a, b) => a.STEP_NUMBER - b.STEP_NUMBER)
						.map((step) => (
							<TableRow key={step.STEP_ID}>
								<TableCell className="font-mono text-muted-foreground text-xs">
									{step.STEP_NUMBER}
								</TableCell>
								<TableCell className="font-medium text-sm">
									{step.TOOL_NAME}
								</TableCell>
								<TableCell>
									{step.ENGINE_TYPE ? (
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${ENGINE_TYPE_COLORS[step.ENGINE_TYPE] ?? "bg-muted text-muted-foreground"}`}
										>
											{step.ENGINE_TYPE}
										</span>
									) : (
										<span className="text-muted-foreground text-xs">
											—
										</span>
									)}
								</TableCell>
								<TableCell>
									{(() => {
										const source = getToolSource(
											step,
											harnessName,
										);
										return (
											<span
												className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${source.color}`}
											>
												{source.label}
											</span>
										);
									})()}
								</TableCell>
								<TableCell className="font-mono text-xs">
									{calcDurationMs(
										step.START_TIME,
										step.END_TIME,
									)}
								</TableCell>
								<TableCell>
									<span
										className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-xs ${
											step.STATUS === "success"
												? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
												: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
										}`}
									>
										{step.STATUS}
									</span>
								</TableCell>
								<TableCell className="max-w-xs truncate text-red-600 text-xs">
									{step.ERROR_MESSAGE ?? ""}
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
		</div>
	);
};
