import { FoldVertical, Plus, UnfoldVertical } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Accordion,
	Badge,
	Button,
	Muted,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useFieldArray,
	useFormContext,
} from "@semoss/ui/next";
import {
	createGuardrailReactor,
	type GuardrailConfigFormValue,
	type GuardrailConfigIssue,
	type GuardrailEngineDetails,
	type GuardrailPhase,
	type GuardrailPipelineFormValue,
	type GuardrailReactorFormValue,
	guardrailArgumentOptions,
	type InterceptableMethod,
} from "./engine-guardrail-settings.constants";
import { GuardrailMethodField } from "./guardrail-method-field";
import { GuardrailReactorEntryField } from "./guardrail-reactor-entry-field";

/** A check the rule editor should open. */
export interface GuardrailRevealTarget {
	entryId: string;
}

export interface GuardrailPipelineFieldProps {
	/** The rule being edited. */
	value: GuardrailPipelineFormValue;

	/** Phase whose checks are shown, held by the caller so switching rules
	 * keeps the reader on the same side of the call. */
	activePhase: GuardrailPhase;

	/** Shows a different phase's checks. */
	onPhaseChange: (phase: GuardrailPhase) => void;

	/** Backend resolved details for engine ids the config references. */
	engineDetails: Record<string, GuardrailEngineDetails>;

	/** Display names for engine ids, keyed by id. */
	engineNames: Record<string, string>;

	/** Records the display name of a newly picked guardrail engine. */
	onEngineResolved: (engineId: string, engineName: string) => void;

	/** Methods the engine reports as interceptable. */
	methods: InterceptableMethod[];

	/** Methods other rules already cover, so this rule cannot claim them. */
	takenMethods: string[];

	/** Argument name carrying the intercepted method's return value. */
	resultArgumentName: string;

	/** Problems that belong to this rule. */
	issues: GuardrailConfigIssue[];

	/** Check to expand, set when a problem was selected from the summary. A
	 * fresh object per selection reopens a check the user collapsed again. */
	revealTarget?: GuardrailRevealTarget | null;

	/** Whether the fields accept edits. */
	disabled?: boolean;

	/** Prefix for this rule's element ids. */
	idPrefix: string;

	/** Prefix for this rule's test ids. */
	testIdPrefix: string;

	/** React Hook Form path for this rule. */
	namePrefix: `pipelines.${number}`;
}

/** Checks expanded by default, above which the list opens collapsed. */
const AUTO_EXPAND_LIMIT = 2;

const PHASES: Array<{
	phase: GuardrailPhase;
	label: string;
	description: string;
	addLabel: string;
	emptyMessage: string;
}> = [
	{
		phase: "input",
		label: "Request",
		description: "Runs in order before the engine call.",
		addLabel: "Add Request Check",
		emptyMessage:
			"Nothing screens the request before it reaches the engine.",
	},
	{
		phase: "output",
		label: "Response",
		description: "Runs in order before the response is returned.",
		addLabel: "Add Response Check",
		emptyMessage:
			"Nothing screens the response before it reaches the caller.",
	},
];

/**
 * Focused editor for one rule: the call it covers, then its request and
 * response checks in the order they run.
 */
export const GuardrailPipelineField = ({
	value,
	activePhase,
	onPhaseChange,
	engineDetails,
	engineNames,
	onEngineResolved,
	methods,
	takenMethods,
	resultArgumentName,
	issues,
	revealTarget,
	disabled,
	idPrefix,
	testIdPrefix,
	namePrefix,
}: GuardrailPipelineFieldProps) => {
	const { control } = useFormContext<GuardrailConfigFormValue>();
	const inputEntries = useFieldArray({
		control,
		name: `${namePrefix}.input`,
		keyName: "fieldArrayId",
	});
	const outputEntries = useFieldArray({
		control,
		name: `${namePrefix}.output`,
		keyName: "fieldArrayId",
	});
	const [expandedEntries, setExpandedEntries] = useState<
		Record<GuardrailPhase, string[]>
	>(() => {
		const total = value.input.length + value.output.length;
		return total > AUTO_EXPAND_LIMIT
			? { input: [], output: [] }
			: {
					input: value.input.map((entry) => entry.id),
					output: value.output.map((entry) => entry.id),
				};
	});

	// a problem selected from the summary has to open the check it belongs to,
	// including switching to the phase that check runs in
	useEffect(() => {
		const entryId = revealTarget?.entryId;
		if (!entryId) {
			return;
		}
		const phase: GuardrailPhase | null = value.input.some(
			(entry) => entry.id === entryId,
		)
			? "input"
			: value.output.some((entry) => entry.id === entryId)
				? "output"
				: null;
		if (!phase) {
			return;
		}
		onPhaseChange(phase);
		setExpandedEntries((current) =>
			current[phase].includes(entryId)
				? current
				: { ...current, [phase]: [...current[phase], entryId] },
		);
	}, [revealTarget, value.input, value.output, onPhaseChange]);

	const addEntry = (phase: GuardrailPhase) => {
		const entry = createGuardrailReactor(phase);
		if (phase === "input") {
			inputEntries.append(entry);
		} else {
			outputEntries.append(entry);
		}
		setExpandedEntries((current) => ({
			...current,
			[phase]: [...current[phase], entry.id],
		}));
	};

	const updateEntry = (
		phase: GuardrailPhase,
		index: number,
		entry: GuardrailReactorFormValue,
	) => {
		if (phase === "input") {
			inputEntries.update(index, entry);
		} else {
			outputEntries.update(index, entry);
		}
	};

	const removeEntry = (
		phase: GuardrailPhase,
		index: number,
		entryId: string,
	) => {
		if (phase === "input") {
			inputEntries.remove(index);
		} else {
			outputEntries.remove(index);
		}
		setExpandedEntries((current) => ({
			...current,
			[phase]: current[phase].filter((id) => id !== entryId),
		}));
	};

	const moveEntry = (phase: GuardrailPhase, index: number, delta: number) => {
		const target = index + delta;
		if (target < 0 || target >= value[phase].length) {
			return;
		}
		if (phase === "input") {
			inputEntries.move(index, target);
		} else {
			outputEntries.move(index, target);
		}
	};

	const hasExpandedEntry = (phase: GuardrailPhase) =>
		value[phase].some((entry) => expandedEntries[phase].includes(entry.id));

	const toggleAllEntries = (phase: GuardrailPhase) => {
		setExpandedEntries((current) => ({
			...current,
			[phase]: hasExpandedEntry(phase)
				? []
				: value[phase].map((entry) => entry.id),
		}));
	};

	const phaseErrorCount = (phase: GuardrailPhase) =>
		issues.filter(
			(issue) => issue.severity === "error" && issue.phase === phase,
		).length;

	return (
		<div className="space-y-4" data-testid={testIdPrefix}>
			<GuardrailMethodField
				name={`${namePrefix}.method`}
				methods={methods}
				takenMethods={takenMethods}
				disabled={disabled}
				testIdPrefix={testIdPrefix}
				className="max-w-xl"
			/>

			<Tabs
				value={activePhase}
				onValueChange={(next) => onPhaseChange(next as GuardrailPhase)}
				className="gap-3"
			>
				<TabsList>
					{PHASES.map(({ phase, label }) => (
						<TabsTrigger key={phase} value={phase}>
							{label}
							<Badge
								variant={
									phaseErrorCount(phase) > 0
										? "destructive"
										: "secondary"
								}
							>
								{value[phase].length}
							</Badge>
						</TabsTrigger>
					))}
				</TabsList>

				{PHASES.map(
					({ phase, description, addLabel, emptyMessage }) => {
						const entries = value[phase];
						const argumentOptions = guardrailArgumentOptions({
							method: value.method,
							phase,
							methods,
							resultArgumentName,
						});

						return (
							<TabsContent
								key={phase}
								value={phase}
								// a small floor stops the panel collapsing when a
								// rule with no checks in this phase is selected,
								// without leaving dead space below the list
								className="min-h-32 space-y-3"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Muted>{description}</Muted>
									{entries.length > 0 && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												toggleAllEntries(phase)
											}
											data-testid={`${testIdPrefix}-${phase}-toggle-all`}
										>
											{hasExpandedEntry(phase) ? (
												<>
													<FoldVertical
														className="size-4"
														aria-hidden
													/>
													Collapse all
												</>
											) : (
												<>
													<UnfoldVertical
														className="size-4"
														aria-hidden
													/>
													Expand all
												</>
											)}
										</Button>
									)}
								</div>

								{entries.length === 0 ? (
									<p className="rounded-md border border-dashed px-3 py-4 text-center text-muted-foreground text-xs">
										{emptyMessage}
									</p>
								) : (
									<Accordion
										type="multiple"
										value={expandedEntries[phase]}
										onValueChange={(next) =>
											setExpandedEntries((current) => ({
												...current,
												[phase]: next,
											}))
										}
										className="space-y-3"
									>
										{entries.map((entry, index) => (
											<GuardrailReactorEntryField
												// Controllers are registered to the ordered slot, so
												// keeping the slot mounted prevents stale registrations.
												// biome-ignore lint/suspicious/noArrayIndexKey: The index identifies the form slot, not the guardrail entity.
												key={`${phase}-${index}`}
												value={entry}
												onChange={(next) =>
													updateEntry(
														phase,
														index,
														next,
													)
												}
												onRemove={() =>
													removeEntry(
														phase,
														index,
														entry.id,
													)
												}
												onMoveUp={() =>
													moveEntry(phase, index, -1)
												}
												onMoveDown={() =>
													moveEntry(phase, index, 1)
												}
												index={index}
												count={entries.length}
												phase={phase}
												engineDetails={engineDetails}
												engineNames={engineNames}
												onEngineResolved={
													onEngineResolved
												}
												argumentOptions={
													argumentOptions
												}
												issues={issues.filter(
													(issue) =>
														issue.phase === phase &&
														issue.entryId ===
															entry.id,
												)}
												disabled={disabled}
												idPrefix={`${idPrefix}-${phase}-${index}`}
												testIdPrefix={`${testIdPrefix}-${phase}-entry-${index}`}
												namePrefix={`${namePrefix}.${phase}.${index}`}
											/>
										))}
									</Accordion>
								)}

								{/* the new check is appended, so the control that
								    adds it sits after the list */}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => addEntry(phase)}
									disabled={disabled}
									data-testid={`${testIdPrefix}-${phase}-add`}
								>
									<Plus className="size-4" aria-hidden />
									{addLabel}
								</Button>
							</TabsContent>
						);
					},
				)}
			</Tabs>
		</div>
	);
};
