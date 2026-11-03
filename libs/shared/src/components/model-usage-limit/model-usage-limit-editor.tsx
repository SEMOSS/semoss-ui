import { Lock, Plus } from "lucide-react";
import {
	Fragment,
	type Ref,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import type { ModelUsageLimit } from "@semoss/sdk";
import { Button, cn, ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
import { checkModelUsageLimitRules } from "./model-usage-limit-checks";
import {
	isAcrossAllModels,
	isUnlimitedOffered,
	type ModelUsageLimitSource,
} from "./model-usage-limit-format";
import { ModelUsageLimitRules } from "./model-usage-limit-rules";
import {
	type ModelUsageLimitMode,
	type ModelUsageRuleDraft,
	makeNewRuleDraft,
	toModelUsageLimit,
	toRuleDraft,
} from "./model-usage-rule-draft";
import { ModelUsageRuleRow } from "./model-usage-rule-row";

/** What a host can ask of {@link ModelUsageLimitEditor} through its `ref`. */
export interface ModelUsageLimitEditorHandle {
	/**
	 * Moves focus to the first field marked invalid, or to Add Rule when Rules
	 * has no rules, once the problems are drawn. A host calls it with
	 * `shouldShowProblems` on a save attempt the limit stops.
	 */
	focusFirstProblem: () => void;
}

/** Props for {@link ModelUsageLimitEditor}. */
export interface ModelUsageLimitEditorProps {
	/**
	 * The limit the editor starts from, or null for no limit defined. The editor
	 * keeps what is typed after that; give it a new key to start it again.
	 */
	defaultValue: ModelUsageLimit | null;
	/**
	 * Called with the limit after every edit, or null for no limit defined. A
	 * rule still being typed has no amount; check the limit with
	 * `findModelUsageLimitProblem` before saving it.
	 */
	onChange?: (value: ModelUsageLimit | null) => void;
	/** Where the limit is set, which decides whose use its rules can count */
	source: ModelUsageLimitSource;
	/**
	 * Whether the model has known prices, so Cost can be chosen. A limit across
	 * all models always offers Cost, with a note on models without prices.
	 */
	isCostAvailable?: boolean;
	/** What applies when no limit is defined, in place of the source's usual words */
	notDefinedHint?: string;
	/** Why the viewer cannot change the limit; the editor then only shows it */
	readOnlyReason?: string | null;
	/**
	 * Whether every control is disabled, such as while the host saves the
	 * limit; the editor keeps what is typed
	 */
	disabled?: boolean;
	/** The label above the choice, such as "User's Total Model Limit" */
	label?: string;
	/**
	 * Whether each rule shows why it cannot be saved, with its field marked
	 * invalid. A host leaves it false until the user tries to save a limit
	 * `findModelUsageLimitProblem` stops, so a rule just added is not marked
	 * before anything is typed; from then on the problems follow the edits.
	 * Warnings and notes show either way.
	 */
	shouldShowProblems?: boolean;
	/** Lets the host move focus to the first problem after a save attempt */
	ref?: Ref<ModelUsageLimitEditorHandle>;
	/** Classes for the editor */
	className?: string;
}

/**
 * Edits a model usage limit: No Limit Defined, which says what applies
 * instead; Unlimited; or a list of rules a call must be within, all of them. Each rule has
 * an amount, a measure (tokens, cost in US dollars or compute time) and a
 * window, which for minutes and hours can be longer than one, such as every 10
 * minutes, and, on a team or public use, whose use it counts. Cost amounts are
 * typed in dollars and sent in millionths of a dollar. It warns about rules
 * that can never be reached, and, once the host asks, says what cannot be
 * saved.
 */
export const ModelUsageLimitEditor = ({
	defaultValue,
	onChange,
	source,
	isCostAvailable = true,
	notDefinedHint,
	readOnlyReason = null,
	disabled = false,
	label,
	shouldShowProblems = false,
	ref,
	className,
}: ModelUsageLimitEditorProps) => {
	const { t } = useTranslation("members");
	const noRulesId = useId();
	const fieldsetRef = useRef<HTMLFieldSetElement>(null);
	const addRuleRef = useRef<HTMLButtonElement>(null);
	// counts the host's requests to move focus to the first problem
	const [focusRequest, setFocusRequest] = useState(0);
	const [mode, setMode] = useState<ModelUsageLimitMode>(() => {
		if (defaultValue?.unlimited) {
			return "UNLIMITED";
		}
		// a limit with no rules is no limit defined
		return defaultValue && defaultValue.rules.length > 0
			? "RULES"
			: "NOT_DEFINED";
	});
	const [drafts, setDrafts] = useState<ModelUsageRuleDraft[]>(() =>
		defaultValue && !defaultValue.unlimited
			? defaultValue.rules.map(toRuleDraft)
			: [],
	);
	const title = label ?? t("usageLimit.title");
	const isUnlimitedShown = isUnlimitedOffered(source) || mode === "UNLIMITED";
	const value = toModelUsageLimit(mode, drafts);
	const rules = value && !value.unlimited ? value.rules : [];
	const checks = checkModelUsageLimitRules(value, {
		source,
		isCostAvailable,
	});
	const hasCostRule = rules.some((rule) => rule.metric === "COST");
	const hasTokenRule = rules.some((rule) => rule.metric === "TOKENS");
	const hasEachMemberRule =
		source === "TEAM" &&
		rules.some((rule) => rule.counts === "EACH_PERSON");
	// each rule's problem, shown only once the host asks
	const shownProblems = checks.map((check) =>
		shouldShowProblems ? check.problem : null,
	);
	const isNoRulesProblemShown = shouldShowProblems && drafts.length === 0;

	useImperativeHandle(
		ref,
		() => ({
			focusFirstProblem: () => setFocusRequest((count) => count + 1),
		}),
		[],
	);

	useEffect(() => {
		if (focusRequest === 0) {
			return;
		}
		// runs after the render that draws the problems, so the field is marked
		// and described when it gets focus; with no rules, nothing is marked
		const field = fieldsetRef.current?.querySelector<HTMLElement>(
			'[aria-invalid="true"]',
		);
		(field ?? addRuleRef.current)?.focus();
	}, [focusRequest]);

	const update = (
		nextMode: ModelUsageLimitMode,
		next: ModelUsageRuleDraft[],
	) => {
		setMode(nextMode);
		setDrafts(next);
		onChange?.(toModelUsageLimit(nextMode, next));
	};

	const handleModeChange = (next: string) => {
		if (
			next !== "NOT_DEFINED" &&
			next !== "UNLIMITED" &&
			next !== "RULES"
		) {
			return;
		}
		// choosing Rules starts with one rule to fill in
		const nextDrafts =
			next === "RULES" && drafts.length === 0
				? [makeNewRuleDraft([], source)]
				: drafts;
		update(next, nextDrafts);
	};

	if (readOnlyReason) {
		return (
			<div className={cn("flex flex-col gap-2", className)}>
				<span className="font-medium text-sm">{title}</span>
				<ModelUsageLimitRules
					limit={value}
					source={source}
					className="text-sm"
				/>
				<p className="flex items-start gap-1.5 text-muted-foreground text-xs">
					<Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
					{readOnlyReason}
				</p>
			</div>
		);
	}

	return (
		<fieldset
			ref={fieldsetRef}
			disabled={disabled}
			className={cn("min-w-0", className)}
		>
			<legend className="mb-3 font-medium text-sm leading-none">
				{title}
			</legend>
			<div className="flex flex-col gap-3">
				<ToggleGroup
					type="single"
					variant="outline"
					value={mode}
					onValueChange={handleModeChange}
					disabled={disabled}
					aria-label={t("usageLimit.modes.label")}
					className="w-full flex-wrap"
				>
					<ToggleGroupItem value="NOT_DEFINED" className="flex-1">
						{t("usageLimit.modes.notDefined")}
					</ToggleGroupItem>
					{isUnlimitedShown ? (
						<ToggleGroupItem value="UNLIMITED" className="flex-1">
							{t("usageLimit.modes.unlimited")}
						</ToggleGroupItem>
					) : null}
					<ToggleGroupItem value="RULES" className="flex-1">
						{t("usageLimit.modes.rules")}
					</ToggleGroupItem>
				</ToggleGroup>

				{mode === "NOT_DEFINED" ? (
					<p className="text-muted-foreground text-xs">
						{notDefinedHint ??
							t(`usageLimit.notDefinedHint.${source}`)}
					</p>
				) : null}
				{mode === "UNLIMITED" ? (
					<p className="text-muted-foreground text-xs">
						{isUnlimitedOffered(source)
							? t(`usageLimit.unlimitedHint.${source}`)
							: t(`usageLimit.notDefinedHint.${source}`)}
					</p>
				) : null}

				{mode === "RULES" ? (
					<div className="flex flex-col gap-2">
						{drafts.length > 1 ? (
							<p className="text-muted-foreground text-xs">
								{t("usageLimit.allRulesApply")}
							</p>
						) : null}
						{drafts.length > 0 ? (
							<ul className="flex flex-col gap-2">
								{drafts.map((draft, index) => (
									<Fragment key={draft.id}>
										{index > 0 ? (
											// the sentence above says every rule applies, so the joiner is only seen
											<li
												aria-hidden
												className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase"
											>
												<span className="h-px flex-1 bg-border" />
												{t("usageLimit.ruleJoiner")}
												<span className="h-px flex-1 bg-border" />
											</li>
										) : null}
										<ModelUsageRuleRow
											draft={draft}
											number={index + 1}
											source={source}
											isCostAvailable={isCostAvailable}
											problem={
												shownProblems[index] ?? null
											}
											warning={
												checks[index]?.warning ?? null
											}
											onChange={(next) =>
												update(
													"RULES",
													drafts.map((item) =>
														item.id === next.id
															? next
															: item,
													),
												)
											}
											onRemove={() =>
												update(
													"RULES",
													drafts.filter(
														(item) =>
															item.id !==
															draft.id,
													),
												)
											}
										/>
									</Fragment>
								))}
							</ul>
						) : (
							<p
								id={noRulesId}
								className={cn(
									"text-xs",
									isNoRulesProblemShown
										? "text-destructive"
										: "text-muted-foreground",
								)}
							>
								{t("usageLimit.noRules")}
							</p>
						)}
						<Button
							ref={addRuleRef}
							type="button"
							variant="outline"
							size="sm"
							className="self-start"
							aria-describedby={
								isNoRulesProblemShown ? noRulesId : undefined
							}
							onClick={() =>
								update("RULES", [
									...drafts,
									makeNewRuleDraft(drafts, source),
								])
							}
						>
							<Plus className="size-4" aria-hidden />
							{t("usageLimit.addRule")}
						</Button>
						{hasEachMemberRule ? (
							<p className="text-muted-foreground text-xs">
								{t("usageLimit.eachMemberNote")}
							</p>
						) : null}
						{isAcrossAllModels(source) &&
						hasCostRule &&
						!hasTokenRule ? (
							<p className="text-muted-foreground text-xs">
								{t("usageLimit.costAcrossModelsNote")}
							</p>
						) : null}
						{source === "TEAM_TOTAL" && hasTokenRule ? (
							<p className="text-muted-foreground text-xs">
								{t("usageLimit.teamTotalTokensNote")}
							</p>
						) : null}
						{rules.length > 0 ? (
							<p className="text-muted-foreground text-xs">
								{t("usageLimit.windowsNote")}
							</p>
						) : null}
					</div>
				) : null}
			</div>
		</fieldset>
	);
};
