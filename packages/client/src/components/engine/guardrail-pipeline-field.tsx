import { Plus, X } from "lucide-react";
import {
	Badge,
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Separator,
} from "@semoss/ui/next";
import {
	createGuardrailReactor,
	type GuardrailPhase,
	type GuardrailPipelineFormValue,
} from "./engine-guardrail-settings.constants";
import {
	type GuardrailEngineOption,
	GuardrailReactorEntryField,
} from "./guardrail-reactor-entry-field";

export interface GuardrailPipelineFieldProps {
	value: GuardrailPipelineFormValue;
	onChange: (next: GuardrailPipelineFormValue) => void;
	onRemove: () => void;
	engineOptions: GuardrailEngineOption[];
	enginesLoading: boolean;
	engineNameFallbacks: Record<string, string>;
	disabled?: boolean;
	idPrefix: string;
	testIdPrefix: string;
}

const PHASES: Array<{
	phase: GuardrailPhase;
	label: string;
	description: string;
}> = [
	{
		phase: "input",
		label: "Input phase",
		description: "Run against the request before the model is called.",
	},
	{
		phase: "output",
		label: "Output phase",
		description: "Run against the model response before it is returned.",
	},
];

/**
 * Editor for one pipeline: the engine method it intercepts plus its ordered
 * input-phase and output-phase guardrail lists.
 */
export const GuardrailPipelineField = ({
	value,
	onChange,
	onRemove,
	engineOptions,
	enginesLoading,
	engineNameFallbacks,
	disabled,
	idPrefix,
	testIdPrefix,
}: GuardrailPipelineFieldProps) => {
	const updatePhase = (
		phase: GuardrailPhase,
		entries: GuardrailPipelineFormValue["input"],
	) => onChange({ ...value, [phase]: entries });

	const moveEntry = (phase: GuardrailPhase, index: number, delta: number) => {
		const entries = [...value[phase]];
		const target = index + delta;
		if (target < 0 || target >= entries.length) {
			return;
		}
		const [moved] = entries.splice(index, 1);
		entries.splice(target, 0, moved);
		updatePhase(phase, entries);
	};

	return (
		<div
			className="space-y-4 rounded-md border p-4"
			data-testid={testIdPrefix}
		>
			<div className="flex items-end gap-2">
				<Field className="flex-1">
					<FieldLabel htmlFor={`${idPrefix}-method`}>
						Method
					</FieldLabel>
					<Input
						id={`${idPrefix}-method`}
						placeholder="Method name, or * for all methods"
						value={value.method}
						onChange={(event) =>
							onChange({ ...value, method: event.target.value })
						}
						disabled={disabled}
						data-testid={`${testIdPrefix}-method`}
					/>
					<FieldDescription>
						The engine method these guardrails intercept (e.g. ask).
						Use * to apply to every method.
					</FieldDescription>
				</Field>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Remove pipeline"
					className="mb-auto"
					onClick={onRemove}
					disabled={disabled}
					data-testid={`${testIdPrefix}-remove`}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{PHASES.map(({ phase, label, description }, phaseIndex) => (
				<div key={phase} className="space-y-3">
					{phaseIndex > 0 && <Separator />}
					<div className="flex items-center gap-2">
						<Badge>{label}</Badge>
						<span className="text-muted-foreground text-xs">
							{description}
						</span>
					</div>
					{value[phase].map((entry, index) => (
						<GuardrailReactorEntryField
							key={entry.id}
							value={entry}
							onChange={(next) =>
								updatePhase(
									phase,
									value[phase].map((other) =>
										other.id === entry.id ? next : other,
									),
								)
							}
							onRemove={() =>
								updatePhase(
									phase,
									value[phase].filter(
										(other) => other.id !== entry.id,
									),
								)
							}
							onMoveUp={() => moveEntry(phase, index, -1)}
							onMoveDown={() => moveEntry(phase, index, 1)}
							index={index}
							count={value[phase].length}
							phase={phase}
							engineOptions={engineOptions}
							enginesLoading={enginesLoading}
							engineNameFallbacks={engineNameFallbacks}
							disabled={disabled}
							idPrefix={`${idPrefix}-${phase}-${index}`}
							testIdPrefix={`${testIdPrefix}-${phase}-entry-${index}`}
						/>
					))}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-fit"
						onClick={() =>
							updatePhase(phase, [
								...value[phase],
								createGuardrailReactor(phase),
							])
						}
						disabled={disabled}
						data-testid={`${testIdPrefix}-${phase}-add`}
					>
						<Plus className="h-4 w-4" />
						Add Guardrail
					</Button>
				</div>
			))}
		</div>
	);
};
