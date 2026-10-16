import { Trash2 } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { ModelUsageCounts, ModelUsageMetric } from "@semoss/sdk";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { findWindowLengthProblem } from "./model-usage-limit-checks";
import {
	formatComputeTime,
	getSourceCounts,
	isAcrossAllModels,
	MODEL_USAGE_METRICS,
	MODEL_USAGE_WINDOWS,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";
import {
	clampLengthInput,
	cleanAmountInput,
	cleanLengthInput,
	fromRuleDraft,
	hasWindowLength,
	type ModelUsageRuleDraft,
} from "./model-usage-rule-draft";

/** Props for {@link ModelUsageRuleRow}. */
export interface ModelUsageRuleRowProps {
	/** The rule as the editor holds it */
	draft: ModelUsageRuleDraft;
	/** Its place in the list, from 1, for the controls' names */
	number: number;
	/** Where the limit is set, which decides the counts offered */
	source: ModelUsageLimitSource;
	/** Whether the model has known prices, so Cost can be chosen */
	isCostAvailable: boolean;
	/**
	 * Why the rule cannot be saved, or null when it can or the editor does not
	 * show problems yet; its fields are marked invalid only while this is set
	 */
	problem: string | null;
	/** Why the rule may never be reached, or null */
	warning: string | null;
	/** Called with the rule after an edit */
	onChange: (draft: ModelUsageRuleDraft) => void;
	/** Called to remove the rule */
	onRemove: () => void;
}

/**
 * One rule of a usage limit: its amount, what it counts, its window and, for a
 * team or public use, whose use it counts. A minute or hour window has a length
 * beside it, so the rule reads "every 10 minutes".
 */
export const ModelUsageRuleRow = ({
	draft,
	number,
	source,
	isCostAvailable,
	problem,
	warning,
	onChange,
	onRemove,
}: ModelUsageRuleRowProps) => {
	const { t } = useTranslation("members");
	const countsOffered = getSourceCounts(source);
	const rule = fromRuleDraft(draft);
	const isCostOffered = isCostAvailable || isAcrossAllModels(source);
	const isLengthShown = hasWindowLength(draft.window);
	const lengthProblem = findWindowLengthProblem(rule);
	// the problem shown is the first, so it names the length or another field
	const isLengthTheProblem = problem !== null && problem === lengthProblem;
	// the units after the length, such as "Minutes"; plural until a length is typed
	const lengthCount = Number(draft.lengthText) || 2;
	const problemId = `${draft.id}-problem`;

	const handleMetricChange = (value: string) => {
		const metric = MODEL_USAGE_METRICS.find((option) => option === value);
		if (metric && metric !== draft.metric) {
			// an amount means something else in another measure
			onChange({ ...draft, metric, amountText: "" });
		}
	};

	const handleWindowChange = (value: string) => {
		const window = MODEL_USAGE_WINDOWS.find((option) => option === value);
		if (window) {
			// a length kept from minutes may be too long for hours
			onChange({
				...draft,
				window,
				lengthText: hasWindowLength(window)
					? clampLengthInput(window, draft.lengthText)
					: draft.lengthText,
			});
		}
	};

	const handleCountsChange = (value: string) => {
		const counts = countsOffered.find((option) => option === value);
		if (counts) {
			onChange({ ...draft, counts });
		}
	};

	const getCountsLabel = (counts: ModelUsageCounts): string => {
		if (source === "PUBLIC") {
			return counts === "SHARED"
				? t("usageLimit.counts.publicShared")
				: t("usageLimit.counts.publicEach");
		}
		return counts === "SHARED"
			? t("usageLimit.counts.teamShared")
			: t("usageLimit.counts.teamEach");
	};

	const getMetricLabel = (metric: ModelUsageMetric): string =>
		t(`usageLimit.metrics.${metric}`);

	return (
		<li className="flex flex-col gap-2 rounded-md border border-border p-3">
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="w-40">
					{draft.metric === "COST" ? (
						<InputGroupAddon>$</InputGroupAddon>
					) : null}
					<InputGroupInput
						inputMode={
							draft.metric === "COST" ? "decimal" : "numeric"
						}
						aria-label={t("usageLimit.rule.amount", { number })}
						aria-invalid={problem !== null && !isLengthTheProblem}
						aria-describedby={
							problem && !isLengthTheProblem
								? problemId
								: undefined
						}
						value={draft.amountText}
						onChange={(e) =>
							onChange({
								...draft,
								amountText: cleanAmountInput(
									draft.metric,
									e.target.value,
								),
							})
						}
					/>
					{draft.metric === "COMPUTE_TIME" ? (
						<InputGroupAddon align="inline-end">ms</InputGroupAddon>
					) : null}
				</InputGroup>
				<Select value={draft.metric} onValueChange={handleMetricChange}>
					<SelectTrigger
						size="sm"
						className="w-44"
						aria-label={t("usageLimit.rule.metric", { number })}
					>
						<SelectValue>
							{getMetricLabel(draft.metric)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{MODEL_USAGE_METRICS.map((metric) =>
							metric === "COST" && !isCostOffered ? (
								<SelectItem
									key={metric}
									value={metric}
									disabled
								>
									<span className="flex flex-col items-start">
										<span>{getMetricLabel(metric)}</span>
										<span className="text-muted-foreground text-xs">
											{t("usageLimit.noKnownPrices")}
										</span>
									</span>
								</SelectItem>
							) : (
								<SelectItem key={metric} value={metric}>
									{getMetricLabel(metric)}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
				{isLengthShown ? (
					<InputGroup className="w-28">
						<InputGroupAddon>
							{t("usageLimit.rule.every")}
						</InputGroupAddon>
						<InputGroupInput
							inputMode="numeric"
							aria-label={t("usageLimit.rule.windowLength", {
								number,
							})}
							// marked only while the row shows a problem, which is this
							// one or an earlier one such as a missing amount
							aria-invalid={
								problem !== null && lengthProblem !== null
							}
							aria-describedby={
								isLengthTheProblem ? problemId : undefined
							}
							value={draft.lengthText}
							onChange={(e) =>
								onChange({
									...draft,
									lengthText: cleanLengthInput(
										e.target.value,
									),
								})
							}
							onBlur={() => {
								const lengthText = clampLengthInput(
									draft.window,
									draft.lengthText,
								);
								if (lengthText !== draft.lengthText) {
									onChange({ ...draft, lengthText });
								}
							}}
						/>
					</InputGroup>
				) : null}
				<Select value={draft.window} onValueChange={handleWindowChange}>
					<SelectTrigger
						size="sm"
						className="w-32"
						aria-label={t("usageLimit.rule.window", { number })}
					>
						{/* after "Every" and a length, the window reads as its units. The
						label is always given, so the select never copies the chosen
						item's text into the same node, which can leave it blank when
						the window changes between the two */}
						<SelectValue>
							{isLengthShown
								? t(
										`usageLimit.rule.windowUnits.${draft.window}`,
										{
											count: lengthCount,
										},
									)
								: t(`usageLimit.windows.${draft.window}`)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{MODEL_USAGE_WINDOWS.map((window) => (
							<SelectItem key={window} value={window}>
								{t(`usageLimit.windows.${window}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{countsOffered.length > 1 ? (
					<Select
						value={draft.counts}
						onValueChange={handleCountsChange}
					>
						<SelectTrigger
							size="sm"
							className="w-52"
							aria-label={t("usageLimit.rule.counts", { number })}
						>
							<SelectValue>
								{getCountsLabel(draft.counts)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{countsOffered.map((counts) => (
								<SelectItem key={counts} value={counts}>
									{getCountsLabel(counts)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : null}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="ms-auto"
							aria-label={t("usageLimit.rule.remove", { number })}
							onClick={onRemove}
						>
							<Trash2 className="size-4" aria-hidden />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t("usageLimit.rule.remove", { number })}
					</TooltipContent>
				</Tooltip>
			</div>
			{draft.metric === "COMPUTE_TIME" ? (
				<p className="text-muted-foreground text-xs">
					{rule.amount !== null
						? `${t("usageLimit.rule.computeEquals", {
								time: formatComputeTime(rule.amount),
							})}. `
						: ""}
					{t("usageLimit.rule.computeHint")}
				</p>
			) : null}
			{problem ? (
				<p id={problemId} className="text-destructive text-xs">
					{problem}
				</p>
			) : null}
			{warning ? <p className="text-warning text-xs">{warning}</p> : null}
		</li>
	);
};
