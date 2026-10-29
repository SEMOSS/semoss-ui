import { AlertTriangle, ChevronRight, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Code,
	CodeContainer,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
	Progress,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type {
	AgentRunAssessment,
	AgentRunDetail,
	AssessAgentEffectivenessOutput,
	AssessmentDimension,
	EngineInfo,
	JudgeModelOption,
	RunAssessmentState,
} from "./agent-activity-types";
import { toPrettyJson } from "./agent-activity-types";

const DIMENSIONS: {
	key: keyof Pick<
		AgentRunAssessment,
		| "goalAchievement"
		| "toolUseQuality"
		| "efficiency"
		| "skillUtilization"
		| "communicationQuality"
	>;
	label: string;
}[] = [
	{ key: "goalAchievement", label: "Goal achievement" },
	{ key: "toolUseQuality", label: "Tool use quality" },
	{ key: "efficiency", label: "Efficiency" },
	{ key: "skillUtilization", label: "Skill utilization" },
	{ key: "communicationQuality", label: "Communication" },
];

/** 0-10 dimension score, or null when the judge omitted/mistyped it. */
const scoreOf = (dimension?: AssessmentDimension): number | null =>
	typeof dimension?.score === "number" && Number.isFinite(dimension.score)
		? Math.max(0, Math.min(10, dimension.score))
		: null;

/** 0-100 overall score, or null when the judge omitted/mistyped it. */
const overallScoreOf = (assessment: AgentRunAssessment): number | null =>
	typeof assessment.overallScore === "number" &&
	Number.isFinite(assessment.overallScore)
		? Math.max(0, Math.min(100, assessment.overallScore))
		: null;

const stringItems = (values?: string[]): string[] =>
	Array.isArray(values)
		? values.filter(
				(value): value is string =>
					typeof value === "string" && value.trim().length > 0,
			)
		: [];

const BulletSection = ({ title, items }: { title: string; items: string[] }) =>
	items.length > 0 ? (
		<div>
			<p className="mb-1 font-medium text-xs">{title}</p>
			<ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground text-xs">
				{items.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	) : null;

export interface AnalyzeRunPanelProps {
	/** The run the assessment targets. Key the panel by its runId. */
	run: AgentRunDetail;
	/** Model engine id -> display info resolved via GetEngineMetadata. */
	engineInfo: Record<string, EngineInfo>;
	/** Judge model options from MyEngines; null while the fetch is in flight. */
	judgeModels: JudgeModelOption[] | null;
	/** This run's assessment lifecycle, owned by the graph so it survives node switches. */
	state?: RunAssessmentState;
	onAnalyze: (
		run: AgentRunDetail,
		judgeModelId: string,
		focus: string,
	) => void;
}

/**
 * "Analyze" tab of the run graph detail panel - runs AssessAgentEffectiveness
 * (LLM-as-judge over the run transcript plus deterministic metrics) with a
 * caller-picked judge model and optional focus, and renders the structured
 * assessment it returns.
 */
export const AnalyzeRunPanel = ({
	run,
	engineInfo,
	judgeModels,
	state,
	onAnalyze,
}: AnalyzeRunPanelProps) => {
	const [judgeModelId, setJudgeModelId] = useState<string>(run.modelId ?? "");
	const [focus, setFocus] = useState("");

	const loadingModels = judgeModels === null;
	const options = judgeModels ?? [];
	// The run's own model can be missing from the text-generation list (e.g.
	// untagged engine) - surface it anyway so the default selection has a label.
	const runModelListed =
		!run.modelId ||
		options.some((option) => option.engineId === run.modelId);
	const running = state?.status === "running";

	const resolveModelName = (engineId: string): string =>
		options.find((option) => option.engineId === engineId)?.engineName ??
		engineInfo[engineId]?.name ??
		engineId;

	const handleCopy = async (output: AssessAgentEffectivenessOutput) => {
		try {
			await navigator.clipboard.writeText(toPrettyJson(output));
			toast.success("Assessment copied to clipboard");
		} catch (error) {
			console.error("Error copying assessment:", error);
			toast.error("Unable to copy to clipboard");
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<div>
				<p
					className="truncate font-medium text-sm"
					title={run.input || run.runId}
				>
					{run.input || run.runId}
				</p>
				<p
					className="truncate font-mono text-[10px] text-muted-foreground"
					title={run.runId}
				>
					{run.runId}
				</p>
			</div>

			<Select
				value={judgeModelId}
				onValueChange={setJudgeModelId}
				disabled={loadingModels || running}
			>
				<SelectTrigger className="w-full">
					<SelectValue
						placeholder={
							loadingModels
								? "Loading models..."
								: "Select judge model"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{!runModelListed && run.modelId && (
						<SelectItem value={run.modelId}>
							{engineInfo[run.modelId]?.name ?? run.modelId}
						</SelectItem>
					)}
					{options.map((option) => (
						<SelectItem
							key={option.engineId}
							value={option.engineId}
						>
							{option.engineName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div className="flex items-center gap-2">
				<Input
					value={focus}
					placeholder="Focus on something (optional)"
					disabled={running}
					onChange={(event) => setFocus(event.target.value)}
				/>
				<Button
					size="sm"
					className="shrink-0"
					disabled={running || !judgeModelId}
					onClick={() => onAnalyze(run, judgeModelId, focus)}
				>
					<Sparkles className="size-4" />
					Analyze
				</Button>
			</div>

			{!state && (
				<p className="text-muted-foreground text-xs">
					Runs an LLM-as-judge assessment of this run - goal
					achievement, tool use quality, efficiency, skill
					utilization, and communication - grounded in metrics
					computed from the transcript.
				</p>
			)}

			{state?.status === "running" && (
				<div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground text-xs">
					<Spinner className="shrink-0" />
					Assessing with {resolveModelName(state.judgeModelId)}...
					this can take a minute.
				</div>
			)}

			{state?.status === "error" && (
				<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive text-xs">
					<p className="mb-1 flex items-center gap-1 font-medium">
						<AlertTriangle className="size-3.5 shrink-0" />
						Assessment failed
					</p>
					<p className="whitespace-pre-wrap">{state.message}</p>
				</div>
			)}

			{state?.status === "done" && (
				<AssessmentResult
					state={state}
					judgeModelName={resolveModelName(state.judgeModelId)}
					onCopy={handleCopy}
				/>
			)}
		</div>
	);
};

const AssessmentResult = ({
	state,
	judgeModelName,
	onCopy,
}: {
	state: Extract<RunAssessmentState, { status: "done" }>;
	judgeModelName: string;
	onCopy: (output: AssessAgentEffectivenessOutput) => void;
}) => {
	const { output } = state;
	const assessment = output.assessment;
	const overall = assessment ? overallScoreOf(assessment) : null;

	return (
		<>
			{assessment ? (
				<>
					{overall !== null && (
						<div className="flex flex-col gap-1.5 rounded-lg border bg-muted/40 p-3">
							<div className="flex items-baseline justify-between gap-2">
								<span className="font-medium text-muted-foreground text-xs">
									Overall score
								</span>
								<span className="font-semibold text-lg">
									{overall}
									<span className="font-normal text-muted-foreground text-xs">
										{" "}
										/ 100
									</span>
								</span>
							</div>
							<Progress value={overall} />
						</div>
					)}
					{assessment.verdict && (
						<p className="text-sm">{assessment.verdict}</p>
					)}
					<div className="flex flex-col gap-2.5">
						{DIMENSIONS.map(({ key, label }) => {
							const dimension = assessment[key];
							const score = scoreOf(dimension);
							if (score === null && !dimension?.rationale) {
								return null;
							}
							return (
								<div key={key} className="flex flex-col gap-1">
									<div className="flex items-center justify-between gap-2 text-xs">
										<span className="font-medium">
											{label}
										</span>
										{score !== null && (
											<span className="text-muted-foreground">
												{score}/10
											</span>
										)}
									</div>
									{score !== null && (
										<Progress
											value={score * 10}
											className="h-1.5"
										/>
									)}
									{dimension?.rationale && (
										<p className="text-muted-foreground text-xs">
											{dimension.rationale}
										</p>
									)}
								</div>
							);
						})}
					</div>
					<BulletSection
						title="Top issues"
						items={stringItems(assessment.topIssues)}
					/>
					<BulletSection
						title="Recommendations"
						items={stringItems(assessment.recommendations)}
					/>
					<BulletSection
						title="Metric disagreements"
						items={stringItems(assessment.metricsDisagreements)}
					/>
				</>
			) : (
				<div className="flex flex-col gap-2">
					<p className="flex items-center gap-1 text-destructive text-xs">
						<AlertTriangle className="size-3.5 shrink-0" />
						{output.parseError ??
							"The judge did not return structured output."}
					</p>
					{output.assessmentRaw && (
						<CodeContainer className="max-h-64 overflow-auto bg-muted text-xs">
							<Code code={output.assessmentRaw} language="text" />
						</CodeContainer>
					)}
				</div>
			)}

			{output.metrics && (
				<Collapsible>
					<CollapsibleTrigger className="group flex items-center gap-1 font-medium text-muted-foreground text-xs">
						<ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
						Deterministic metrics
					</CollapsibleTrigger>
					<CollapsibleContent className="pt-2">
						<CodeContainer className="max-h-64 overflow-auto bg-muted text-xs">
							<Code
								code={toPrettyJson(output.metrics)}
								language="json"
							/>
						</CodeContainer>
					</CollapsibleContent>
				</Collapsible>
			)}

			<div className="flex items-center justify-between gap-2 border-t pt-2 text-muted-foreground text-xs">
				<span className="min-w-0 truncate">
					Generated by {judgeModelName} in{" "}
					{(state.elapsedMs / 1000).toFixed(1)}s
				</span>
				<Button
					variant="ghost"
					size="sm"
					className="shrink-0"
					onClick={() => onCopy(output)}
				>
					<Copy className="size-3.5" />
					Copy
				</Button>
			</div>
		</>
	);
};
