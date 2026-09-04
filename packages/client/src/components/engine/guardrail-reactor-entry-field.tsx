import { AlertTriangle, Info, MoveDown, MoveUp, X } from "lucide-react";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	FormInput,
	FormRadioGroup,
	FormSwitch,
	Label,
	Muted,
	RadioGroupItem,
	Separator,
} from "@semoss/ui/next";
import type {
	GuardrailConfigIssue,
	GuardrailEngineDetails,
	GuardrailFailureAction,
	GuardrailPhase,
	GuardrailReactorFormValue,
	InterceptableMethodArgument,
} from "./engine-guardrail-settings.constants";
import { GuardrailDirectParametersField } from "./guardrail-direct-parameters-field";
import { GuardrailEngineField } from "./guardrail-engine-field";
import { useGuardrailEngineParameters } from "./guardrail-engine-parameters";
import { GuardrailInputMappingField } from "./guardrail-input-mapping-field";

export interface GuardrailReactorEntryFieldProps {
	/** The check being edited. */
	value: GuardrailReactorFormValue;

	/** Replaces the check. */
	onChange: (next: GuardrailReactorFormValue) => void;

	/** Removes the check from its phase. */
	onRemove: () => void;

	/** Moves the check one place earlier in its phase. */
	onMoveUp: () => void;

	/** Moves the check one place later in its phase. */
	onMoveDown: () => void;

	/** Position within the phase. */
	index: number;

	/** Number of checks in the phase. */
	count: number;

	/** Phase this check runs in. */
	phase: GuardrailPhase;

	/** Backend resolved details for engine ids the config references, used to
	 * flag engines that no longer resolve. */
	engineDetails: Record<string, GuardrailEngineDetails>;

	/** Display names for engine ids, keyed by id. */
	engineNames: Record<string, string>;

	/** Records the display name of a newly picked guardrail engine. */
	onEngineResolved: (engineId: string, engineName: string) => void;

	/** Arguments the rule's method exposes in this phase. */
	argumentOptions: InterceptableMethodArgument[];

	/** Problems that belong to this check. */
	issues: GuardrailConfigIssue[];

	/** Whether the fields accept edits. */
	disabled?: boolean;

	/** Prefix for this check's element ids. */
	idPrefix: string;

	/** Prefix for this check's test ids. */
	testIdPrefix: string;

	/** React Hook Form path for this check. */
	namePrefix: string;
}

const FAILURE_ACTION_OPTIONS: Array<{
	value: GuardrailFailureAction;
	label: string;
	description: string;
}> = [
	{
		value: "block",
		label: "Block",
		description: "Stop the engine call and return an error.",
	},
	{
		value: "mask",
		label: "Mask and continue",
		description:
			"Replace the guarded input with the guardrail's returned text.",
	},
	{
		value: "respond",
		label: "Return guardrail message",
		description: "Skip the model and return the guardrail's message.",
	},
];

const FAILURE_ACTION_BADGES: Record<GuardrailFailureAction, string> = {
	block: "Blocks",
	mask: "Masks",
	respond: "Answers",
};

/** The mapping row that summarizes what a check reads. */
const primaryMapping = (value: GuardrailReactorFormValue) =>
	value.inputMapping[0];

/**
 * Editor for one guardrail check inside a rule's phase: the guardrail engine,
 * what happens when it flags the content, and how its parameters are fed.
 */
export const GuardrailReactorEntryField = ({
	value,
	onChange,
	onRemove,
	onMoveUp,
	onMoveDown,
	index,
	count,
	phase,
	engineDetails,
	engineNames,
	onEngineResolved,
	argumentOptions,
	issues,
	disabled,
	idPrefix,
	testIdPrefix,
	namePrefix,
}: GuardrailReactorEntryFieldProps) => {
	const update = (partial: Partial<GuardrailReactorFormValue>) =>
		onChange({ ...value, ...partial });
	const parameters = useGuardrailEngineParameters(value.guardrailEngineId);
	const details = engineDetails[value.guardrailEngineId];
	const selectedEngineName = value.guardrailEngineId
		? engineNames[value.guardrailEngineId] ||
			details?.name ||
			value.guardrailEngineId
		: "No guardrail engine selected";
	const engineIsGone = !!value.guardrailEngineId && details?.exists === false;
	const engineIsHidden =
		!!value.guardrailEngineId &&
		details?.exists !== false &&
		details?.userCanView === false;
	const errors = issues.filter((issue) => issue.severity === "error");
	const warnings = issues.filter((issue) => issue.severity === "warning");
	const mapping = primaryMapping(value);

	return (
		<AccordionItem
			value={value.id}
			className="overflow-hidden rounded-lg border bg-card last:border-b"
			data-testid={testIdPrefix}
		>
			<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3">
				<AccordionTrigger className="min-w-0 py-3 hover:no-underline">
					<span className="flex min-w-0 flex-wrap items-center gap-2">
						<Badge variant="outline">{index + 1}</Badge>
						<span className="truncate font-medium text-sm">
							{selectedEngineName}
						</span>
						<Badge variant="secondary">
							{FAILURE_ACTION_BADGES[value.failureAction]}
						</Badge>
						{mapping?.key && mapping.args && (
							<span className="truncate font-mono text-muted-foreground text-xs">
								{mapping.key.trim()} &lt;- {mapping.args.trim()}
							</span>
						)}
						{errors.length > 0 && (
							<span
								role="img"
								className="size-2 shrink-0 rounded-full bg-destructive"
								aria-label="Has a problem that blocks saving"
								data-testid={`${testIdPrefix}-error-dot`}
							/>
						)}
					</span>
				</AccordionTrigger>
				<div className="flex items-center">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Move guardrail up"
						onClick={onMoveUp}
						disabled={disabled || index === 0}
						data-testid={`${testIdPrefix}-move-up`}
					>
						<MoveUp className="size-4" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Move guardrail down"
						onClick={onMoveDown}
						disabled={disabled || index === count - 1}
						data-testid={`${testIdPrefix}-move-down`}
					>
						<MoveDown className="size-4" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Remove guardrail"
						onClick={onRemove}
						disabled={disabled}
						data-testid={`${testIdPrefix}-remove`}
					>
						<X className="size-4" aria-hidden />
					</Button>
				</div>
			</div>

			<AccordionContent className="px-4 pb-4">
				{(errors.length > 0 || warnings.length > 0) && (
					<ul className="mb-4 space-y-1">
						{errors.map((issue) => (
							<li
								key={issue.message}
								className="flex items-start gap-2 text-destructive text-xs"
							>
								<AlertTriangle
									className="mt-0.5 size-3.5 shrink-0"
									aria-hidden
								/>
								{issue.message}
							</li>
						))}
						{warnings.map((issue) => (
							<li
								key={issue.message}
								className="flex items-start gap-2 text-muted-foreground text-xs"
							>
								<Info
									className="mt-0.5 size-3.5 shrink-0"
									aria-hidden
								/>
								{issue.message}
							</li>
						))}
					</ul>
				)}

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="space-y-4">
						<GuardrailEngineField
							name={`${namePrefix}.guardrailEngineId`}
							engineName={
								value.guardrailEngineId
									? selectedEngineName
									: ""
							}
							onEngineResolved={onEngineResolved}
							disabled={disabled}
							testIdPrefix={testIdPrefix}
						/>

						{engineIsGone && (
							<p
								className="flex items-start gap-2 text-destructive text-xs"
								data-testid={`${testIdPrefix}-engine-missing`}
							>
								<AlertTriangle
									className="mt-0.5 size-3.5 shrink-0"
									aria-hidden
								/>
								<span>
									This guardrail engine no longer exists.{" "}
									<span className="font-mono">
										{value.guardrailEngineId}
									</span>{" "}
									is not in the catalog, so this check cannot
									run until another engine is chosen.
								</span>
							</p>
						)}

						{engineIsHidden && (
							<p
								className="flex items-start gap-2 text-destructive text-xs"
								data-testid={`${testIdPrefix}-engine-hidden`}
							>
								<AlertTriangle
									className="mt-0.5 size-3.5 shrink-0"
									aria-hidden
								/>
								<span>
									You cannot access this guardrail engine, so
									saving is rejected until another engine is
									chosen.
								</span>
							</p>
						)}

						<Separator />

						{phase === "input" ? (
							<FormRadioGroup
								name={`${namePrefix}.failureAction`}
								label="If flagged"
								description="Choose exactly one outcome for flagged input."
								className="gap-3"
								disabled={disabled}
							>
								<div className="grid gap-3">
									{FAILURE_ACTION_OPTIONS.map((option) => {
										const optionId = `${idPrefix}-failure-${option.value}`;
										return (
											<Label
												key={option.value}
												htmlFor={optionId}
												className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
											>
												<RadioGroupItem
													id={optionId}
													value={option.value}
													className="mt-0.5"
												/>
												<span className="space-y-1">
													<span className="block font-medium text-sm">
														{option.label}
													</span>
													<span className="block font-normal text-muted-foreground text-xs">
														{option.description}
													</span>
												</span>
											</Label>
										);
									})}
								</div>
							</FormRadioGroup>
						) : (
							<div className="rounded-md border bg-muted/30 p-3">
								<h4 className="font-medium text-sm">
									If flagged, block the response
								</h4>
								<Muted>
									A response check runs after the model and
									stops a flagged response from reaching the
									caller. Blocking is the only outcome
									available after the model has answered.
								</Muted>
							</div>
						)}

						{value.failureAction === "block" && (
							<div className="space-y-3">
								<FormSwitch
									name={`${namePrefix}.closeRoomOnBlock`}
									label="Close room after block"
									description="Close the room after this guardrail blocks the call."
									disabled={disabled}
									className="rounded-md border p-3"
									data-testid={`${testIdPrefix}-close-room`}
								/>
								<FormInput
									name={`${namePrefix}.blockErrorMessage`}
									label="Custom block message"
									placeholder="The request was blocked by a guardrail."
									description="Optional message returned when this guardrail blocks the call."
									disabled={disabled}
								/>
							</div>
						)}
					</div>

					<div className="space-y-6">
						<GuardrailInputMappingField
							value={value.inputMapping}
							onChange={(inputMapping) =>
								update({ inputMapping })
							}
							parameterOptions={parameters.options}
							parametersStatus={parameters.status}
							argumentOptions={argumentOptions}
							disabled={disabled}
							testIdPrefix={testIdPrefix}
							namePrefix={`${namePrefix}.inputMapping`}
						/>
						<GuardrailDirectParametersField
							value={value.directParameters}
							onChange={(directParameters) =>
								update({ directParameters })
							}
							parameterOptions={parameters.options}
							parametersStatus={parameters.status}
							mappedParameterNames={value.inputMapping.map(
								(row) => row.key,
							)}
							disabled={disabled}
							idPrefix={idPrefix}
							namePrefix={`${namePrefix}.directParameters`}
						/>
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
};
