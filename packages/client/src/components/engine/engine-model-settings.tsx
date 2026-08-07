import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Role } from "@semoss/shared";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	cn,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Switch,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import { CatalogTagInput } from "@/components/catalog";
import { useRootStore } from "@/hooks";
import {
	buildReasoningConfigPayload,
	CAPABILITIES,
	formatDigits,
	formatEffortLabel,
	formatEnumLabel,
	formatModalityLabel,
	getDefaultEffortWarning,
	getEffortOptions,
	getMandatoryReasoningWarning,
	getModalityWarning,
	getReasoningSupportWarning,
	getTokenLimitWarning,
	hasCatalogEntry,
	isReasoningMandatory,
	MODALITIES,
	type ModelMetadata,
	ModelMetadataFields,
	type ModelSettingsValues,
	normalizeCatalogModalities,
	normalizeCatalogTokenLimit,
	normalizeEfforts,
	normalizeStringArray,
	pickNearestEffort,
	type StaticModelMetadata,
	toModelSettingsValues,
	toReasoningConfig,
} from "./engine-metadata-display";

/** Radix Select rejects empty item values, so "unset" needs a sentinel. */
const CAPABILITY_NONE = "__none__";

/**
 * The outline toggle marks its selected state with a faint muted fill, which
 * reads as "greyed out" next to the white unselected buttons - the opposite of
 * what it means. Selected items get a primary outline and label instead, so on
 * and off are unmistakable without filling the button.
 */
const TOGGLE_ON_CLASS =
	"data-[state=on]:border-primary data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary data-[state=on]:hover:bg-primary/10 data-[state=on]:hover:text-primary";

const parseOptionalPositiveInteger = (label: string, value: string) => {
	if (value === "") {
		return null;
	}

	if (!/^\d+$/.test(value) || Number(value) <= 0) {
		throw new Error(`${label} must be a positive whole number.`);
	}

	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		throw new Error(`${label} is too large.`);
	}

	return parsed;
};

/**
 * Advisory note under a field. Purely informational - nothing is disabled and
 * saving is never blocked, since the catalog is hand-curated and a deployment
 * can legitimately differ from it.
 */
const SettingsWarning = ({
	message,
	testId,
	tone = "advisory",
}: {
	message: string;
	testId: string;
	/** "danger" is for a documented hard requirement, not a hunch. */
	tone?: "advisory" | "danger";
}) => {
	if (message === "") {
		return null;
	}

	return (
		<p
			className={cn(
				"flex items-start gap-1.5 text-xs",
				tone === "danger"
					? "font-medium text-destructive"
					: "text-amber-600 dark:text-amber-400",
			)}
			data-testid={testId}
		>
			<TriangleAlert className="mt-px size-3.5 shrink-0" />
			<span>{message}</span>
		</p>
	);
};

interface EngineModelSettingsProps {
	/** Id of the model engine */
	engineId: string;

	/** User's permission for the engine */
	permission: Role;

	/** Called after a successful save so the parent can refresh engine data */
	onUpdated?: () => void;
}

/**
 * Editable card for the model-specific settings (identity, capability,
 * modalities, and token limits) backed by Get/UpdateModelMetadata.
 */
export const EngineModelSettings = ({
	engineId,
	permission,
	onUpdated,
}: EngineModelSettingsProps) => {
	const { configStore } = useRootStore();

	const fieldId = useId();
	const modelIdFieldId = `${fieldId}-model-id`;
	const contextWindowFieldId = `${fieldId}-context-window`;
	const maxOutputTokensFieldId = `${fieldId}-max-output-tokens`;
	const reasoningFieldId = `${fieldId}-reasoning`;

	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState<ModelSettingsValues>(
		toModelSettingsValues(undefined),
	);
	const [initialForm, setInitialForm] = useState<ModelSettingsValues>(
		toModelSettingsValues(undefined),
	);

	const getModelMetadata = usePixel<ModelMetadata>(
		engineId ? `GetModelMetadata(engine=["${engineId}"]);` : "",
	);

	const isEditable = permission === "OWNER" || permission === "EDIT";
	const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

	// Read through a ref so the resync effect below can check for unsaved work
	// without re-running on every keystroke.
	const isDirtyRef = useRef(isDirty);
	isDirtyRef.current = isDirty;

	useEffect(() => {
		if (getModelMetadata.status !== "SUCCESS") {
			return;
		}

		// The fields are always editable now, so a refetch must not overwrite
		// in-progress edits.
		if (isDirtyRef.current) {
			return;
		}

		const nextForm = toModelSettingsValues(getModelMetadata.data);
		setForm(nextForm);
		setInitialForm(nextForm);
	}, [getModelMetadata.status, getModelMetadata.data]);
	const modelId =
		typeof getModelMetadata.data?.modelId === "string"
			? getModelMetadata.data.modelId.trim()
			: "";

	// Curated catalog entry for this model, used only to advise on settings the
	// model is not known to support. It is optional data - a sparse entry or a
	// failed call just mean no advice, and a model the catalog has never heard
	// of comes back as an empty map.
	const getStaticModelMetadata = usePixel<StaticModelMetadata>(
		isEditable && modelId
			? `GetStaticModelMetadata(modelId=${JSON.stringify(modelId)});`
			: "",
	);
	const catalogModalities = useMemo(
		() => ({
			input: normalizeCatalogModalities(
				getStaticModelMetadata.data?.input_modalities,
			),
			output: normalizeCatalogModalities(
				getStaticModelMetadata.data?.output_modalities,
			),
		}),
		[getStaticModelMetadata.data],
	);
	const inputModalityWarning = getModalityWarning(
		"input",
		form.inputModalities,
		catalogModalities.input,
	);
	const outputModalityWarning = getModalityWarning(
		"output",
		form.outputModalities,
		catalogModalities.output,
	);
	const contextWindowWarning = getTokenLimitWarning(
		"context window",
		form.contextWindow,
		normalizeCatalogTokenLimit(getStaticModelMetadata.data?.context_length),
	);
	const maxOutputTokensWarning = getTokenLimitWarning(
		"max output",
		form.maxOutputTokens,
		// 0 and 1 are the catalog's "not a text completion model" placeholder,
		// so anything under 2 is not a ceiling worth comparing against.
		normalizeCatalogTokenLimit(
			getStaticModelMetadata.data?.max_output_tokens,
			2,
		),
	);

	// Only claimed once the lookup actually came back empty. A pending or failed
	// call says nothing, so it stays quiet rather than crying wolf.
	const isMissingFromCatalog =
		getStaticModelMetadata.status === "SUCCESS" &&
		!hasCatalogEntry(getStaticModelMetadata.data);

	// The stored config drives the effort fields. It is kept whole so unedited
	// provider keys survive the save.
	const reasoningConfig = useMemo(
		() => toReasoningConfig(getModelMetadata.data?.reasoningConfig),
		[getModelMetadata.data],
	);
	const isReasoningEnabled = form.reasoning === "true";
	// Options come from the stored config rather than the live form: deselecting
	// an effort must not remove its button, or it could never be put back. The
	// default-effort list also carries the stored default, so a default outside
	// the supported list still renders instead of showing an empty select.
	const storedEfforts = useMemo(
		() =>
			getEffortOptions(
				normalizeEfforts(reasoningConfig?.supported_efforts),
			),
		[reasoningConfig],
	);
	// The default has to be one of the efforts that is actually selected. The
	// current value is carried along so a stored default that was never in the
	// supported list still renders (and still warns) instead of leaving the
	// select blank.
	const defaultEffortOptions = useMemo(
		() =>
			getEffortOptions(form.reasoningSupportedEfforts, [
				form.reasoningDefaultEffort,
			]),
		[form.reasoningSupportedEfforts, form.reasoningDefaultEffort],
	);

	/**
	 * Apply an effort selection, keeping the default effort valid. Reasoning
	 * needs an effort to ask for, so the last selected one cannot be cleared
	 * while it is switched on.
	 */
	const updateSupportedEfforts = (efforts: string[]) => {
		if (isReasoningEnabled && efforts.length === 0) {
			return;
		}

		setForm((prev) => ({
			...prev,
			reasoningSupportedEfforts: efforts,
			reasoningDefaultEffort: pickNearestEffort(
				prev.reasoningDefaultEffort,
				efforts,
			),
		}));
	};
	const reasoningSupportWarning = getReasoningSupportWarning(
		isReasoningEnabled,
		getModelMetadata.data?.reasoning,
		getStaticModelMetadata.data?.reasoning,
	);
	// Read straight off the stored config - mandatory is not editable here, it
	// only exists to warn against switching reasoning off.
	const mandatoryReasoningWarning = getMandatoryReasoningWarning(
		isReasoningEnabled,
		isReasoningMandatory(reasoningConfig),
	);
	const defaultEffortWarning = getDefaultEffortWarning(
		form.reasoningDefaultEffort,
		form.reasoningSupportedEfforts,
	);

	/**
	 * Update a single form key.
	 */
	const updateForm = <K extends keyof ModelSettingsValues>(
		key: K,
		value: ModelSettingsValues[K],
	) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	/**
	 * Drop any unsaved edits and go back to the persisted values.
	 */
	const handleDiscard = () => {
		setForm(initialForm);
	};

	/**
	 * Persist the edited model metadata and refresh the fetched values.
	 */
	const handleSave = async () => {
		try {
			setIsSaving(true);

			const reasoningConfigPayload = buildReasoningConfigPayload(
				reasoningConfig,
				form,
			);

			const payload = {
				CAPABILITY: form.capability !== "" ? form.capability : null,
				INPUT_MODALITIES: normalizeStringArray(form.inputModalities),
				OUTPUT_MODALITIES: normalizeStringArray(form.outputModalities),
				REASONING:
					form.reasoning !== "" ? form.reasoning === "true" : null,
				// Omitted entirely when the model has no stored config: the
				// update merges, so leaving the key out leaves the column as it
				// was rather than inventing a config the form never showed.
				...(reasoningConfigPayload !== null
					? { REASONING_CONFIG: reasoningConfigPayload }
					: {}),
				CONTEXT_WINDOW: parseOptionalPositiveInteger(
					"Context window",
					form.contextWindow,
				),
				MAX_TOKENS: parseOptionalPositiveInteger(
					"Max output tokens",
					form.maxOutputTokens,
				),
				BUILTIN_TOOLS: normalizeStringArray(form.builtinTools),
			};

			const response = await configStore.runPixel(
				`UpdateModelMetadata(engine=["${engineId}"], map=[${JSON.stringify(payload)}]);`,
			);
			const result = response.pixelReturn?.[0];

			if (
				response.errors.length > 0 ||
				String(result?.operationType || "").includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") ||
						String(
							result?.output ||
								"Unable to update model settings.",
						),
				);
			}

			setInitialForm(form);
			toast.success("Successfully updated model settings");

			getModelMetadata.refresh();
			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Error updating model settings",
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (getModelMetadata.status === "ERROR") {
		return (
			<p className="text-destructive text-sm">
				Unable to load model settings.
			</p>
		);
	}

	if (getModelMetadata.status !== "SUCCESS") {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Model Settings</CardTitle>
				<CardDescription>
					Identity, capability, modalities, and token limits for this
					model.
				</CardDescription>
				{/*
				 * CardAction drops into the header's reserved second column and
				 * spans both text rows, so showing it cannot change the card's
				 * height or width.
				 */}
				{isEditable && isDirty && (
					<CardAction className="flex gap-2 self-center">
						<Button
							variant="outline"
							size="sm"
							onClick={handleDiscard}
							disabled={isSaving}
							data-testid="engine-model-settings--cancel-btn"
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							data-testid="engine-model-settings--save-btn"
						>
							{isSaving ? <Spinner className="size-4" /> : "Save"}
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent>
				{isEditable ? (
					<FieldGroup>
						{isMissingFromCatalog && (
							<p
								className="-mb-2 text-muted-foreground text-xs"
								data-testid="engine-model-settings--catalog-missing"
							>
								This model is not in the model catalog, so none
								of these values could be checked against it.
								Worth confirming them against the provider.
							</p>
						)}

						<Field>
							<FieldLabel htmlFor={modelIdFieldId}>
								Model ID
							</FieldLabel>
							<Input
								id={modelIdFieldId}
								value={modelId}
								disabled
								className="font-mono"
							/>
							<FieldDescription>
								Assigned by the connected provider and cannot be
								edited.
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel>Capability</FieldLabel>
							<Select
								value={
									form.capability !== ""
										? form.capability
										: CAPABILITY_NONE
								}
								onValueChange={(value) =>
									updateForm(
										"capability",
										value === CAPABILITY_NONE ? "" : value,
									)
								}
							>
								<SelectTrigger
									className="w-full"
									data-testid="engine-model-settings--capability"
								>
									<SelectValue placeholder="Select a capability" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={CAPABILITY_NONE}>
										Not set
									</SelectItem>
									{CAPABILITIES.map((capability) => (
										<SelectItem
											key={capability}
											value={capability}
										>
											{formatEnumLabel(capability)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldDescription>
								The primary task this model is used for.
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel>Input modalities</FieldLabel>
							<ToggleGroup
								type="multiple"
								variant="outline"
								size="sm"
								spacing={2}
								className="flex-wrap"
								value={form.inputModalities}
								onValueChange={(value) =>
									updateForm("inputModalities", value)
								}
								data-testid="engine-model-settings--input-modalities"
							>
								{MODALITIES.map((modality) => (
									<ToggleGroupItem
										key={modality}
										value={modality}
										className={TOGGLE_ON_CLASS}
									>
										{formatModalityLabel(modality)}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<FieldDescription>
								Content types the model accepts as input.
							</FieldDescription>
							<SettingsWarning
								message={inputModalityWarning}
								testId="engine-model-settings--input-modalities-warning"
							/>
						</Field>

						<Field>
							<FieldLabel>Output modalities</FieldLabel>
							<ToggleGroup
								type="multiple"
								variant="outline"
								size="sm"
								spacing={2}
								className="flex-wrap"
								value={form.outputModalities}
								onValueChange={(value) =>
									updateForm("outputModalities", value)
								}
								data-testid="engine-model-settings--output-modalities"
							>
								{MODALITIES.map((modality) => (
									<ToggleGroupItem
										key={modality}
										value={modality}
										className={TOGGLE_ON_CLASS}
									>
										{formatModalityLabel(modality)}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<FieldDescription>
								Content types the model can produce.
							</FieldDescription>
							<SettingsWarning
								message={outputModalityWarning}
								testId="engine-model-settings--output-modalities-warning"
							/>
						</Field>

						<Field>
							<div className="flex items-center justify-between gap-4">
								<FieldLabel htmlFor={reasoningFieldId}>
									Reasoning
								</FieldLabel>
								<Switch
									id={reasoningFieldId}
									checked={isReasoningEnabled}
									onCheckedChange={(checked) =>
										updateForm(
											"reasoning",
											checked ? "true" : "false",
										)
									}
									data-testid="engine-model-settings--reasoning"
								/>
							</div>
							<FieldDescription>
								Whether the model thinks before answering.
							</FieldDescription>
							<SettingsWarning
								message={mandatoryReasoningWarning}
								tone="danger"
								testId="engine-model-settings--reasoning-mandatory-warning"
							/>
							<SettingsWarning
								message={reasoningSupportWarning}
								testId="engine-model-settings--reasoning-warning"
							/>

							{/*
							 * The effort fields only exist for models whose
							 * stored config named efforts - there is nothing
							 * useful to guess at for the rest - and only while
							 * reasoning is on, since nothing asks for an effort
							 * otherwise. The values are left untouched when
							 * hidden, so switching reasoning back on restores
							 * them.
							 */}
							{isReasoningEnabled &&
								(storedEfforts.length > 0 ||
									defaultEffortOptions.length > 0) && (
									<div className="mt-2 flex flex-col gap-5 border-l pl-4">
										{storedEfforts.length > 0 && (
											<Field>
												<FieldLabel>
													Supported efforts
												</FieldLabel>
												<ToggleGroup
													type="multiple"
													variant="outline"
													size="sm"
													spacing={2}
													className="flex-wrap"
													value={
														form.reasoningSupportedEfforts
													}
													onValueChange={
														updateSupportedEfforts
													}
													data-testid="engine-model-settings--reasoning-supported-efforts"
												>
													{storedEfforts.map(
														(effort) => (
															<ToggleGroupItem
																key={effort}
																value={effort}
																className={
																	TOGGLE_ON_CLASS
																}
															>
																{formatEffortLabel(
																	effort,
																)}
															</ToggleGroupItem>
														),
													)}
												</ToggleGroup>
												<FieldDescription>
													Effort levels the provider
													accepts for this model.
													{isReasoningEnabled &&
														" At least one has to stay selected while reasoning is on."}
												</FieldDescription>
											</Field>
										)}

										{defaultEffortOptions.length > 0 && (
											<Field>
												<FieldLabel>
													Default effort
												</FieldLabel>
												{/*
												 * No "not set" option on purpose:
												 * the default has to be one of the
												 * selected efforts. An empty value
												 * only ever comes from a stored
												 * config that never named one.
												 */}
												<Select
													value={
														form.reasoningDefaultEffort
													}
													onValueChange={(value) =>
														updateForm(
															"reasoningDefaultEffort",
															value,
														)
													}
												>
													<SelectTrigger
														className="w-full"
														data-testid="engine-model-settings--reasoning-default-effort"
													>
														<SelectValue placeholder="Select an effort" />
													</SelectTrigger>
													<SelectContent>
														{defaultEffortOptions.map(
															(effort) => (
																<SelectItem
																	key={effort}
																	value={
																		effort
																	}
																>
																	{formatEffortLabel(
																		effort,
																	)}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<FieldDescription>
													Effort used when a request
													does not ask for one.
												</FieldDescription>
												<SettingsWarning
													message={
														defaultEffortWarning
													}
													testId="engine-model-settings--reasoning-default-effort-warning"
												/>
											</Field>
										)}
									</div>
								)}
						</Field>

						<div className="grid gap-7 sm:grid-cols-2 sm:gap-4">
							<Field>
								<FieldLabel htmlFor={contextWindowFieldId}>
									Context window
								</FieldLabel>
								<Input
									id={contextWindowFieldId}
									type="text"
									inputMode="numeric"
									placeholder="e.g. 200,000"
									value={formatDigits(form.contextWindow)}
									onChange={(event) =>
										updateForm(
											"contextWindow",
											event.target.value.replace(
												/[^\d]/g,
												"",
											),
										)
									}
								/>
								<FieldDescription>
									Total tokens the model can process in a
									single request.
								</FieldDescription>
								<SettingsWarning
									message={contextWindowWarning}
									testId="engine-model-settings--context-window-warning"
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={maxOutputTokensFieldId}>
									Max output tokens
								</FieldLabel>
								<Input
									id={maxOutputTokensFieldId}
									type="text"
									inputMode="numeric"
									placeholder="e.g. 64,000"
									value={formatDigits(form.maxOutputTokens)}
									onChange={(event) =>
										updateForm(
											"maxOutputTokens",
											event.target.value.replace(
												/[^\d]/g,
												"",
											),
										)
									}
								/>
								<FieldDescription>
									Upper bound on tokens generated per
									response.
								</FieldDescription>
								<SettingsWarning
									message={maxOutputTokensWarning}
									testId="engine-model-settings--max-output-tokens-warning"
								/>
							</Field>
						</div>

						<Field>
							<FieldLabel>Built-in tools</FieldLabel>
							<CatalogTagInput
								value={form.builtinTools}
								onChange={(value) =>
									updateForm("builtinTools", value)
								}
								placeholder="Press enter to add a tool"
								testId="engine-model-settings--builtin-tools"
							/>
							<FieldDescription>
								Provider-hosted tools the model can call
								natively.
							</FieldDescription>
						</Field>
					</FieldGroup>
				) : (
					<div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
						<ModelMetadataFields modelId={modelId} values={form} />
					</div>
				)}
			</CardContent>
		</Card>
	);
};
