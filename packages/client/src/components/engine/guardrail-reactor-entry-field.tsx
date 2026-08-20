import { ArrowDown, ArrowUp, ChevronsUpDown, X } from "lucide-react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import {
	DEFAULT_MASK_TARGET_PARAM,
	GUARDRAIL_REACTOR_OPTIONS,
	type GuardrailPhase,
	type GuardrailReactorFormValue,
} from "./engine-guardrail-settings.constants";
import { GuardrailDirectParametersField } from "./guardrail-direct-parameters-field";
import { GuardrailInputMappingField } from "./guardrail-input-mapping-field";

export interface GuardrailEngineOption {
	engine_id: string;
	engine_name: string;
}

export interface GuardrailReactorEntryFieldProps {
	value: GuardrailReactorFormValue;
	onChange: (next: GuardrailReactorFormValue) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	index: number;
	count: number;
	phase: GuardrailPhase;
	engineOptions: GuardrailEngineOption[];
	enginesLoading: boolean;
	/** Names for engine ids referenced by the config but missing from the
	 * user's engine list, resolved by the backend. */
	engineNameFallbacks: Record<string, string>;
	disabled?: boolean;
	idPrefix: string;
	testIdPrefix: string;
}

/**
 * Editor for one guardrail reactor entry inside a pipeline phase: the
 * guardrail engine, how it intercepts, what happens on failure, and the
 * advanced parameter wiring.
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
	engineOptions,
	enginesLoading,
	engineNameFallbacks,
	disabled,
	idPrefix,
	testIdPrefix,
}: GuardrailReactorEntryFieldProps) => {
	const update = (partial: Partial<GuardrailReactorFormValue>) =>
		onChange({ ...value, ...partial });

	const reactorOptions = GUARDRAIL_REACTOR_OPTIONS[phase];
	const selectedEngineIsMissing =
		!!value.guardrailEngineId &&
		!engineOptions.some(
			(engine) => engine.engine_id === value.guardrailEngineId,
		);

	return (
		<div
			className="space-y-3 rounded-md border p-3"
			data-testid={testIdPrefix}
		>
			<div className="flex items-center gap-2">
				<Badge variant="outline">#{index + 1}</Badge>
				<div className="flex-1">
					<Select
						value={value.guardrailEngineId}
						onValueChange={(guardrailEngineId) =>
							update({ guardrailEngineId })
						}
						disabled={disabled || enginesLoading}
					>
						<SelectTrigger
							id={`${idPrefix}-engine`}
							className="w-full"
							data-testid={`${testIdPrefix}-engine`}
						>
							<SelectValue
								placeholder={
									enginesLoading
										? "Loading guardrail engines..."
										: "Select a guardrail engine"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{selectedEngineIsMissing && (
								<SelectItem value={value.guardrailEngineId}>
									{engineNameFallbacks[
										value.guardrailEngineId
									] || value.guardrailEngineId}
								</SelectItem>
							)}
							{engineOptions.map((engine) => (
								<SelectItem
									key={engine.engine_id}
									value={engine.engine_id}
								>
									{engine.engine_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Move guardrail up"
					onClick={onMoveUp}
					disabled={disabled || index === 0}
					data-testid={`${testIdPrefix}-move-up`}
				>
					<ArrowUp className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Move guardrail down"
					onClick={onMoveDown}
					disabled={disabled || index === count - 1}
					data-testid={`${testIdPrefix}-move-down`}
				>
					<ArrowDown className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Remove guardrail"
					onClick={onRemove}
					disabled={disabled}
					data-testid={`${testIdPrefix}-remove`}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<Field>
				<FieldLabel htmlFor={`${idPrefix}-reactor-class`}>
					Interception
				</FieldLabel>
				<Select
					value={value.reactorClass}
					onValueChange={(reactorClass) => update({ reactorClass })}
					disabled={disabled || reactorOptions.length === 1}
				>
					<SelectTrigger
						id={`${idPrefix}-reactor-class`}
						className="w-full"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{reactorOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{phase === "output" && (
					<FieldDescription>
						Output guardrails always check both the request and the
						response.
					</FieldDescription>
				)}
			</Field>

			<div className="flex items-center gap-2">
				<Switch
					id={`${idPrefix}-block`}
					checked={value.blockOnGuardrailFailure}
					onCheckedChange={(blockOnGuardrailFailure) =>
						update({ blockOnGuardrailFailure })
					}
					disabled={disabled}
					data-testid={`${testIdPrefix}-block`}
				/>
				<FieldLabel htmlFor={`${idPrefix}-block`}>
					Block the request when the guardrail fails
				</FieldLabel>
			</div>

			<div className="flex items-center gap-2">
				<Switch
					id={`${idPrefix}-mask`}
					checked={value.maskOnGuardrailFailure}
					onCheckedChange={(maskOnGuardrailFailure) =>
						update({ maskOnGuardrailFailure })
					}
					disabled={disabled}
					data-testid={`${testIdPrefix}-mask`}
				/>
				<FieldLabel htmlFor={`${idPrefix}-mask`}>
					Mask flagged content instead of blocking
				</FieldLabel>
			</div>

			{value.maskOnGuardrailFailure && (
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-mask-target`}>
						Mask Target Parameter
					</FieldLabel>
					<Input
						id={`${idPrefix}-mask-target`}
						placeholder={DEFAULT_MASK_TARGET_PARAM}
						value={value.maskTargetParam}
						onChange={(event) =>
							update({ maskTargetParam: event.target.value })
						}
						disabled={disabled}
					/>
					<FieldDescription>
						The guardrail parameter whose masked value replaces the
						original argument. It must be mapped to exactly one
						argument below.
					</FieldDescription>
				</Field>
			)}

			<Collapsible>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-fit px-2"
						disabled={disabled}
						data-testid={`${testIdPrefix}-advanced`}
					>
						<ChevronsUpDown className="h-4 w-4" />
						Advanced
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-4 pt-2">
					<GuardrailInputMappingField
						value={value.inputMapping}
						onChange={(inputMapping) => update({ inputMapping })}
						disabled={disabled}
						idPrefix={idPrefix}
						maskTargetParam={
							value.maskOnGuardrailFailure
								? value.maskTargetParam.trim() ||
									DEFAULT_MASK_TARGET_PARAM
								: null
						}
					/>
					<GuardrailDirectParametersField
						value={value.directParameters}
						onChange={(directParameters) =>
							update({ directParameters })
						}
						disabled={disabled}
						idPrefix={idPrefix}
					/>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
