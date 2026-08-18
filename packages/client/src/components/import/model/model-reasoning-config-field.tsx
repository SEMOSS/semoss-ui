import { useId } from "react";
import {
	Field,
	FieldDescription,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import {
	formatEffortLabel,
	getDefaultEffortWarning,
	getEffortOptions,
	getMandatoryReasoningWarning,
	isReasoningMandatory,
	normalizeEfforts,
	pickNearestEffort,
	type ReasoningConfig,
	SettingsWarning,
	TOGGLE_ON_CLASS,
} from "@/components/engine/engine-metadata-display";

/** The stored default effort, normalized the way the settings card reads it. */
const getDefaultEffort = (config: ReasoningConfig) =>
	typeof config.default_effort === "string"
		? config.default_effort.trim().toLowerCase()
		: "";

/**
 * Whether the catalog entry says anything worth putting on screen. A config of
 * nothing but nulls - which is most of them - has no efforts to pick from and
 * no requirement to warn about, so it stays a hidden field rather than
 * rendering an editor with nothing in it.
 */
export const hasConfigurableReasoning = (
	config: ReasoningConfig | null,
): config is ReasoningConfig =>
	config !== null &&
	(normalizeEfforts(config.supported_efforts).length > 0 ||
		getDefaultEffort(config) !== "" ||
		isReasoningMandatory(config));

interface ModelReasoningConfigFieldProps {
	/**
	 * The model catalog's config for this model. It is the source of the
	 * offered efforts, so deselecting one cannot remove its button.
	 */
	catalogConfig: ReasoningConfig | null;

	/** The edited config; null until something has been changed. */
	value: ReasoningConfig | null;

	/** Called with the whole config on every edit. */
	onChange: (next: ReasoningConfig) => void;

	/** Whether reasoning is on, held on the sibling REASONING field. */
	reasoning: boolean;

	onReasoningChange: (reasoning: boolean) => void;

	/** Field-level helper text from the field definition, when it has any. */
	helperText?: string;

	helperTextTestId?: string;

	/** Test id prefix for the switch and the two effort controls. */
	testId: string;
}

/**
 * Reasoning editor for the import form: the on/off switch plus the effort
 * fields from the model catalog's reasoning config. Deliberately the same
 * shape as the Model Settings card, so what is set at import is what the
 * settings tab shows afterwards.
 *
 * Provider keys the form does not surface (default_enabled,
 * supports_max_tokens) ride along untouched on every edit.
 */
export const ModelReasoningConfigField = ({
	catalogConfig,
	value,
	onChange,
	reasoning,
	onReasoningChange,
	helperText,
	helperTextTestId,
	testId,
}: ModelReasoningConfigFieldProps) => {
	const switchId = useId();

	const config = value ?? catalogConfig ?? {};
	const supportedEfforts = normalizeEfforts(config.supported_efforts);
	const defaultEffort = getDefaultEffort(config);

	const effortOptions = getEffortOptions(
		normalizeEfforts(catalogConfig?.supported_efforts),
		supportedEfforts,
	);
	const defaultEffortOptions = getEffortOptions(supportedEfforts, [
		defaultEffort,
	]);

	/**
	 * Apply an effort selection, keeping the default effort valid. Reasoning
	 * needs an effort to ask for, so the last selected one cannot be cleared
	 * while it is switched on.
	 */
	const updateSupportedEfforts = (efforts: string[]) => {
		if (reasoning && efforts.length === 0) {
			return;
		}

		const nextDefault = pickNearestEffort(defaultEffort, efforts);
		onChange({
			...config,
			supported_efforts: efforts,
			default_effort: nextDefault !== "" ? nextDefault : null,
		});
	};

	return (
		<Field>
			<div className="flex items-center justify-between gap-4">
				<FieldLabel htmlFor={switchId}>Reasoning</FieldLabel>
				<Switch
					id={switchId}
					checked={reasoning}
					onCheckedChange={onReasoningChange}
					data-testid={testId}
				/>
			</div>
			<FieldDescription data-testid={helperTextTestId}>
				{helperText || "Whether the model thinks before answering."}
			</FieldDescription>
			<SettingsWarning
				message={getMandatoryReasoningWarning(
					reasoning,
					isReasoningMandatory(config),
				)}
				tone="danger"
				testId={`${testId}-mandatory-warning`}
			/>

			{/*
			 * Only while reasoning is on - nothing asks for an effort otherwise.
			 * The values are left untouched when hidden, so switching reasoning
			 * back on restores them.
			 */}
			{reasoning &&
				(effortOptions.length > 0 ||
					defaultEffortOptions.length > 0) && (
					<div className="mt-2 flex flex-col gap-5 border-l pl-4">
						{effortOptions.length > 0 && (
							<Field>
								<FieldLabel>Supported efforts</FieldLabel>
								<ToggleGroup
									type="multiple"
									variant="outline"
									size="sm"
									spacing={2}
									className="flex-wrap"
									value={supportedEfforts}
									onValueChange={updateSupportedEfforts}
									data-testid={`${testId}-supported-efforts`}
								>
									{effortOptions.map((effort) => (
										<ToggleGroupItem
											key={effort}
											value={effort}
											className={TOGGLE_ON_CLASS}
										>
											{formatEffortLabel(effort)}
										</ToggleGroupItem>
									))}
								</ToggleGroup>
								<FieldDescription>
									Effort levels the provider accepts for this
									model. At least one has to stay selected
									while reasoning is on.
								</FieldDescription>
							</Field>
						)}

						{defaultEffortOptions.length > 0 && (
							<Field>
								<FieldLabel>Default effort</FieldLabel>
								{/*
								 * No "not set" option on purpose: the default has
								 * to be one of the selected efforts. An empty
								 * value only ever comes from a catalog entry that
								 * never named one.
								 */}
								<Select
									value={defaultEffort}
									onValueChange={(effort) =>
										onChange({
											...config,
											default_effort: effort,
										})
									}
								>
									<SelectTrigger
										className="w-full"
										data-testid={`${testId}-default-effort`}
									>
										<SelectValue placeholder="Select an effort" />
									</SelectTrigger>
									<SelectContent>
										{defaultEffortOptions.map((effort) => (
											<SelectItem
												key={effort}
												value={effort}
											>
												{formatEffortLabel(effort)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FieldDescription>
									Effort used when a request does not ask for
									one.
								</FieldDescription>
								<SettingsWarning
									message={getDefaultEffortWarning(
										defaultEffort,
										supportedEfforts,
									)}
									testId={`${testId}-default-effort-warning`}
								/>
							</Field>
						)}
					</div>
				)}
		</Field>
	);
};
