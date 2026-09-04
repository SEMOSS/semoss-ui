import { RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import type {
	CatalogMatchState,
	CatalogMatchSuggestion,
} from "@/components/import/model/model-catalog-match";
import { ModelCatalogMatch } from "@/components/import/model/model-catalog-match";
import { useRootStore } from "@/hooks";
import {
	MODEL_PROVIDER_OPTIONS,
	SERVING_PROVIDER_OPTIONS,
} from "@/model-metadata.constants";
import {
	EngineBuiltinToolsField,
	type ModelBuiltinTools,
} from "./engine-builtin-tools-field";
import {
	buildReasoningConfigPayload,
	CAPABILITIES,
	formatDigits,
	formatEffortLabel,
	formatEnumLabel,
	formatModalityLabel,
	formatModelProviderLabel,
	formatServingProviderLabel,
	getDefaultEffortWarning,
	getEffortOptions,
	getMandatoryReasoningWarning,
	getModalityWarning,
	getProviderOptions,
	getReasoningSupportWarning,
	getTokenLimitWarning,
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
	SettingsWarning,
	type StaticModelMetadata,
	TOGGLE_ON_CLASS,
	toModelSettingsValues,
	toReasoningConfig,
} from "./engine-metadata-display";

/**
 * Radix Select rejects empty item values, so the nullable columns need a
 * sentinel for their "Not set" option.
 */
const VALUE_NONE = "__none__";

/**
 * Reader-facing names for the metadata fields ApplyModelCatalogMetadata can
 * change, keyed the way its changedFields list reports them.
 */
const CATALOG_FIELD_LABELS: Record<string, string> = {
	CATALOG_MODEL_KEY: "Catalog entry",
	MODEL_PROVIDER: "Model provider",
	FAMILY: "Model family",
	CAPABILITY: "Capability",
	INPUT_MODALITIES: "Input modalities",
	OUTPUT_MODALITIES: "Output modalities",
	REASONING: "Reasoning",
	REASONING_CONFIG: "Reasoning configuration",
	CONTEXT_WINDOW: "Context window",
	MAX_TOKENS: "Max output tokens",
	ATTACHMENT: "Attachments",
	TOOL_CALL: "Tool calling",
	STRUCTURED_OUTPUT: "Structured output",
	TEMPERATURE: "Temperature",
	KNOWLEDGE_CUTOFF: "Knowledge cutoff",
	RELEASE_DATE: "Release date",
	SUPPORTED_PARAMETERS: "Supported parameters",
	BENCHMARKS: "Benchmarks",
	PRICING: "Pricing",
};

const formatCatalogField = (field: string) =>
	CATALOG_FIELD_LABELS[field] ?? formatEnumLabel(field);

/**
 * The change chips read best in the order the card lays the fields out, not
 * whatever order the backend happened to diff them in. Unknown fields go last.
 */
const CATALOG_FIELD_ORDER = Object.keys(CATALOG_FIELD_LABELS);
const sortCatalogFields = (fields: string[]) => {
	const orderOf = (field: string) => {
		const index = CATALOG_FIELD_ORDER.indexOf(field);
		return index === -1 ? CATALOG_FIELD_ORDER.length : index;
	};
	return [...fields].sort((a, b) => orderOf(a) - orderOf(b));
};

/** The catalog entry name as a small inline code chip. */
const CatalogEntryName = ({ name }: { name: string | null }) => (
	<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-xs">
		{name}
	</span>
);

/** What ApplyModelCatalogMetadata's dry run reported for a pending action. */
type CatalogApplyDryRun =
	| { status: "LOADING" }
	| { status: "ERROR"; message: string }
	| { status: "SUCCESS"; changedFields: string[] };

/**
 * A catalog action waiting on the user's confirmation. "match" applies the
 * entry named by catalogKey, "reset" reapplies the entry the engine already
 * resolves to, and "clear" removes a hand-picked association without touching
 * any metadata - which is why it is the one kind with no dry run.
 */
interface CatalogApplyAction {
	kind: "match" | "reset" | "clear";
	catalogKey: string | null;
	dryRun: CatalogApplyDryRun | null;
}

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
 * Select for one of the nullable provider columns. Both are free to be unset,
 * so "Not set" is always offered alongside the curated list.
 */
const ProviderField = ({
	label,
	description,
	value,
	options,
	format,
	onChange,
	testId,
}: {
	label: string;
	description: string;
	value: string;
	options: string[];
	format: (value: string) => string;
	onChange: (value: string) => void;
	testId: string;
}) => (
	<Field>
		<FieldLabel>{label}</FieldLabel>
		<Select
			value={value !== "" ? value : VALUE_NONE}
			onValueChange={(next) => onChange(next === VALUE_NONE ? "" : next)}
		>
			<SelectTrigger className="w-full" data-testid={testId}>
				<SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={VALUE_NONE}>Not set</SelectItem>
				{options.map((option) => (
					<SelectItem key={option} value={option}>
						{format(option)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
		<FieldDescription>{description}</FieldDescription>
	</Field>
);

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
	const [discardRevision, setDiscardRevision] = useState(0);
	const [catalogApply, setCatalogApply] = useState<CatalogApplyAction | null>(
		null,
	);
	const [isApplyingCatalog, setIsApplyingCatalog] = useState(false);
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
	const storedCatalogKey =
		typeof getModelMetadata.data?.catalogModelKey === "string"
			? getModelMetadata.data.catalogModelKey.trim()
			: "";

	// Curated catalog entry for this model, used only to advise on settings the
	// model is not known to support. It is optional data - a sparse entry or a
	// failed call just mean no advice, and a model the catalog has never heard
	// of comes back as an empty map. The advisory checks read the entry the
	// engine was matched to by hand when there is one; only otherwise does the
	// raw model id speak for itself.
	const staticLookupId = storedCatalogKey || modelId;
	const getStaticModelMetadata = usePixel<StaticModelMetadata>(
		isEditable && staticLookupId
			? `GetStaticModelMetadata(modelId=${JSON.stringify(staticLookupId)});`
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

	// How the provider model id relates to the catalog: resolved on its own,
	// resolvable to ranked suggestions, or unknown. Fetched alongside the
	// settings so the card can offer the entry browser in every state.
	const getCatalogMatch = usePixel<{
		exactMatch?: string;
		matches?: CatalogMatchSuggestion[];
		allKeys?: string[];
	}>(
		isEditable && modelId
			? `MatchStaticModelMetadata(modelId=${JSON.stringify(modelId)});`
			: "",
	);
	const catalogMatch = useMemo<CatalogMatchState | null>(() => {
		if (!isEditable || !modelId) {
			return null;
		}
		if (getCatalogMatch.status === "ERROR") {
			return {
				modelId,
				status: "ERROR",
				exactMatch: null,
				suggestions: [],
				allKeys: [],
			};
		}
		if (getCatalogMatch.status !== "SUCCESS") {
			return {
				modelId,
				status: "LOADING",
				exactMatch: null,
				suggestions: [],
				allKeys: [],
			};
		}

		const exactMatch = getCatalogMatch.data?.exactMatch?.trim() || null;
		return {
			modelId,
			status: exactMatch ? "MATCHED" : "UNMATCHED",
			exactMatch,
			suggestions: Array.isArray(getCatalogMatch.data?.matches)
				? getCatalogMatch.data.matches
				: [],
			allKeys: Array.isArray(getCatalogMatch.data?.allKeys)
				? getCatalogMatch.data.allKeys
				: [],
		};
	}, [isEditable, modelId, getCatalogMatch.status, getCatalogMatch.data]);

	// Reset needs an entry to fall back on: one matched by hand, or a model id
	// the catalog resolves on its own.
	const canResetToCatalog =
		!!storedCatalogKey || catalogMatch?.status === "MATCHED";

	// Provider-hosted tools this engine's model can use, resolved from the
	// built-in tools catalog by its serving and model providers. Optional
	// data - no catalog entry or a failed call just leaves the free-text
	// editor in place.
	const getModelBuiltinTools = usePixel<ModelBuiltinTools>(
		isEditable ? `GetModelBuiltinTools(engine=["${engineId}"]);` : "",
	);
	const builtinToolsCatalog =
		getModelBuiltinTools.status === "SUCCESS"
			? (getModelBuiltinTools.data?.tools ?? {})
			: {};
	const hasBuiltinToolsCatalog = Object.keys(builtinToolsCatalog).length > 0;

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
	 * Whether the built-in tools selection differs from the persisted value.
	 */
	const isBuiltinToolsDirty = () =>
		JSON.stringify(form.builtinToolsConfig) !==
		JSON.stringify(initialForm.builtinToolsConfig);

	/**
	 * Drop any unsaved edits and go back to the persisted values. The
	 * revision bump remounts the built-in tools editor, which holds raw JSON
	 * drafts that would otherwise survive the reset.
	 */
	const handleDiscard = () => {
		setForm(initialForm);
		setDiscardRevision((revision) => revision + 1);
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
				MODEL_PROVIDER:
					form.modelProvider !== "" ? form.modelProvider : null,
				SERVING_PROVIDER:
					form.servingProvider !== "" ? form.servingProvider : null,
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
				// Only sent when edited: the update merges, and rewriting an
				// untouched selection could downgrade a stored configuration
				// to a bare name list while the tool catalog is still
				// loading.
				...(isBuiltinToolsDirty()
					? { BUILTIN_TOOLS: form.builtinToolsConfig ?? {} }
					: {}),
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
			// The provider pair is what the built-in tools catalog is keyed on,
			// so a saved provider change makes the offered tools stale.
			getModelBuiltinTools.refresh();
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

	const buildApplyPixel = (catalogKey: string | null, dryRun: boolean) =>
		`ApplyModelCatalogMetadata(engine=["${engineId}"]${
			catalogKey ? `, catalogKey=[${JSON.stringify(catalogKey)}]` : ""
		}${dryRun ? ", dryRun=[true]" : ""});`;

	/**
	 * Run a pixel and unwrap its first return, surfacing pixel-level failures
	 * as thrown Errors so every caller handles them in one place.
	 */
	const runCatalogPixel = async (pixel: string, fallbackMessage: string) => {
		const response = await configStore.runPixel(pixel);
		const result = response.pixelReturn?.[0];

		if (
			response.errors.length > 0 ||
			String(result?.operationType || "").includes("ERROR")
		) {
			throw new Error(
				response.errors.join("") ||
					String(result?.output || fallbackMessage),
			);
		}

		return result?.output;
	};

	/**
	 * Open the confirmation dialog for a catalog apply, running the dry run
	 * that tells the user which settings the apply would overwrite.
	 */
	const openCatalogApply = async (
		kind: "match" | "reset",
		catalogKey: string | null,
	) => {
		setCatalogApply({ kind, catalogKey, dryRun: { status: "LOADING" } });

		let dryRun: CatalogApplyDryRun;
		try {
			const output = (await runCatalogPixel(
				buildApplyPixel(catalogKey, true),
				"Unable to check the catalog entry.",
			)) as { changedFields?: unknown };
			dryRun = {
				status: "SUCCESS",
				changedFields: Array.isArray(output?.changedFields)
					? output.changedFields.map(String)
					: [],
			};
		} catch (error) {
			dryRun = {
				status: "ERROR",
				message:
					error instanceof Error
						? error.message
						: "Unable to check the catalog entry.",
			};
		}

		// the dialog may have been cancelled, or reopened for another entry,
		// while the dry run was in flight
		setCatalogApply((previous) =>
			previous &&
			previous.kind === kind &&
			previous.catalogKey === catalogKey &&
			previous.dryRun?.status === "LOADING"
				? { ...previous, dryRun }
				: previous,
		);
	};

	/**
	 * Persist the pending catalog action and pull the settings back in sync.
	 * Clearing only removes the hand-picked association - the metadata it
	 * filled in stays put, so the form's unsaved edits survive it too.
	 */
	const confirmCatalogApply = async () => {
		if (!catalogApply) {
			return;
		}
		const isClear = catalogApply.kind === "clear";

		try {
			setIsApplyingCatalog(true);
			await runCatalogPixel(
				isClear
					? `UpdateModelMetadata(engine=["${engineId}"], map=[${JSON.stringify(
							{ CATALOG_MODEL_KEY: "" },
						)}]);`
					: buildApplyPixel(catalogApply.catalogKey, false),
				isClear
					? "Unable to clear the catalog entry."
					: "Unable to apply the catalog metadata.",
			);

			if (!isClear) {
				// drop any unsaved edits so the refetch is allowed to resync
				// the form
				setForm(initialForm);
				setDiscardRevision((revision) => revision + 1);
			}
			setCatalogApply(null);
			toast.success(
				isClear
					? "Catalog entry match removed"
					: catalogApply.kind === "reset"
						? "Model settings reset to the catalog defaults"
						: "Catalog entry applied to the model settings",
			);

			getModelMetadata.refresh();
			if (!isClear) {
				// the model provider may have changed, and it is one of the
				// keys the built-in tools catalog is looked up on
				getModelBuiltinTools.refresh();
			}
			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Error updating the catalog entry",
			);
		} finally {
			setIsApplyingCatalog(false);
		}
	};

	const handleCatalogPick = (catalogKey: string | null) => {
		if (catalogKey === null) {
			if (storedCatalogKey) {
				setCatalogApply({
					kind: "clear",
					catalogKey: null,
					dryRun: null,
				});
			}
			return;
		}
		if (catalogKey === storedCatalogKey) {
			return;
		}
		openCatalogApply("match", catalogKey);
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

	const catalogDryRun = catalogApply?.dryRun ?? null;
	// what a reset would look up: the hand-picked entry, else the model id's
	// own match
	const resetEntry =
		storedCatalogKey ||
		(catalogMatch?.status === "MATCHED" ? catalogMatch.exactMatch : null) ||
		modelId;

	return (
		<>
			<Card>
				<CardHeader className="border-b">
					<CardTitle>Model Settings</CardTitle>
					<CardDescription>
						Identity, providers, capability, modalities, and token
						limits for this model.
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
								{isSaving ? (
									<Spinner className="size-4" />
								) : (
									"Save"
								)}
							</Button>
						</CardAction>
					)}
				</CardHeader>
				<CardContent>
					{isEditable ? (
						<FieldGroup>
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
									Assigned by the connected provider and
									cannot be edited.
								</FieldDescription>
								<div className="mt-2 flex flex-col gap-2">
									<ModelCatalogMatch
										state={catalogMatch}
										pickedKey={storedCatalogKey || null}
										onPick={handleCatalogPick}
										messages={{
											picked: (
												<>
													Matched to catalog entry{" "}
													<span className="font-mono text-foreground">
														{storedCatalogKey}
													</span>
													. The settings below are
													checked against it, and
													resetting to defaults
													reapplies its metadata.
												</>
											),
											matched: (
												<>
													Recognized as{" "}
													<span className="font-mono text-foreground">
														{
															catalogMatch?.exactMatch
														}
													</span>{" "}
													in the model catalog. The
													settings below are checked
													against its metadata.
												</>
											),
											unmatched: (
												<>
													<span className="font-mono text-foreground">
														{modelId}
													</span>{" "}
													is not in the model catalog,
													so these settings cannot be
													checked against it. Pick the
													entry it corresponds to and
													the catalog metadata will
													replace the settings below,
													or leave this alone and
													manage the settings
													yourself.
												</>
											),
											error: "Could not reach the model catalog. The settings below cannot be checked against it.",
										}}
									/>
									{canResetToCatalog && (
										<div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="gap-1.5"
												disabled={isApplyingCatalog}
												onClick={() =>
													openCatalogApply(
														"reset",
														null,
													)
												}
												data-testid="engine-model-settings--reset-to-catalog"
											>
												<RotateCcw className="size-3.5" />
												Reset to catalog defaults
											</Button>
										</div>
									)}
								</div>
							</Field>

							<div className="grid gap-7 sm:grid-cols-2 sm:gap-4">
								<ProviderField
									label="Model provider"
									description="Organization that created the model."
									value={form.modelProvider}
									options={getProviderOptions(
										MODEL_PROVIDER_OPTIONS,
										form.modelProvider,
									)}
									format={formatModelProviderLabel}
									onChange={(value) =>
										updateForm("modelProvider", value)
									}
									testId="engine-model-settings--model-provider"
								/>
								<ProviderField
									label="Serving provider"
									description="Platform serving the model."
									value={form.servingProvider}
									options={getProviderOptions(
										SERVING_PROVIDER_OPTIONS,
										form.servingProvider,
									)}
									format={formatServingProviderLabel}
									onChange={(value) =>
										updateForm("servingProvider", value)
									}
									testId="engine-model-settings--serving-provider"
								/>
							</div>

							<Field>
								<FieldLabel>Capability</FieldLabel>
								<Select
									value={
										form.capability !== ""
											? form.capability
											: VALUE_NONE
									}
									onValueChange={(value) =>
										updateForm(
											"capability",
											value === VALUE_NONE ? "" : value,
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
										<SelectItem value={VALUE_NONE}>
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
																	value={
																		effort
																	}
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
														Effort levels the
														provider accepts for
														this model.
														{isReasoningEnabled &&
															" At least one has to stay selected while reasoning is on."}
													</FieldDescription>
												</Field>
											)}

											{defaultEffortOptions.length >
												0 && (
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
														onValueChange={(
															value,
														) =>
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
																		key={
																			effort
																		}
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
														Effort used when a
														request does not ask for
														one.
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
									<FieldLabel
										htmlFor={maxOutputTokensFieldId}
									>
										Max output tokens
									</FieldLabel>
									<Input
										id={maxOutputTokensFieldId}
										type="text"
										inputMode="numeric"
										placeholder="e.g. 64,000"
										value={formatDigits(
											form.maxOutputTokens,
										)}
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
								{/*
								 * A stored selection stays editable even when the
								 * catalog has nothing to offer, so it can still
								 * be switched off.
								 */}
								{hasBuiltinToolsCatalog ||
								Object.keys(form.builtinToolsConfig ?? {})
									.length > 0 ? (
									<EngineBuiltinToolsField
										key={`builtin-tools-${discardRevision}`}
										tools={builtinToolsCatalog}
										value={form.builtinToolsConfig}
										onChange={(next) =>
											// Read mode renders names, so keep
											// them in step with the selection
											// keys.
											setForm((prev) => ({
												...prev,
												builtinToolsConfig: next,
												builtinTools: Object.keys(next),
											}))
										}
										testId="engine-model-settings--builtin-tools"
									/>
								) : (
									<p
										className="text-muted-foreground text-sm"
										data-testid="engine-model-settings--builtin-tools-empty"
									>
										{getModelBuiltinTools.status ===
										"SUCCESS"
											? "No provider-hosted tools are available for this model."
											: "Checking for provider-hosted tools..."}
									</p>
								)}
								<FieldDescription>
									Provider-hosted tools this model can call
									natively. Selections and their settings are
									saved with the model.
								</FieldDescription>
							</Field>
						</FieldGroup>
					) : (
						<div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
							<ModelMetadataFields
								modelId={modelId}
								values={form}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={catalogApply !== null}
				onOpenChange={(open) => {
					if (!open && !isApplyingCatalog) {
						setCatalogApply(null);
					}
				}}
			>
				<DialogContent data-testid="engine-model-settings--catalog-apply-dialog">
					<DialogHeader>
						<DialogTitle>
							{catalogApply?.kind === "reset"
								? "Reset to catalog defaults"
								: catalogApply?.kind === "clear"
									? "Remove catalog match"
									: "Apply catalog entry"}
						</DialogTitle>
						<DialogDescription>
							{catalogApply?.kind === "reset" ? (
								<>
									The metadata the model catalog holds for{" "}
									<CatalogEntryName name={resetEntry} /> will
									overwrite these model settings and be saved
									immediately.
								</>
							) : catalogApply?.kind === "clear" ? (
								<>
									The match to{" "}
									<CatalogEntryName
										name={storedCatalogKey || null}
									/>{" "}
									will be removed. The settings keep their
									current values, but they will no longer be
									checked against this entry, and resetting to
									defaults will use whatever the model ID
									resolves to on its own.
								</>
							) : (
								<>
									This model will be matched to{" "}
									<CatalogEntryName
										name={catalogApply?.catalogKey ?? null}
									/>
									, and the catalog metadata for that entry
									will overwrite these model settings and be
									saved immediately.
								</>
							)}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-3 text-sm">
						{catalogDryRun?.status === "LOADING" && (
							<div className="flex items-center gap-2 text-muted-foreground">
								<Spinner className="size-4" />
								Checking what would change...
							</div>
						)}
						{catalogDryRun?.status === "ERROR" && (
							<p
								className="text-destructive"
								data-testid="engine-model-settings--catalog-apply-error"
							>
								{catalogDryRun.message}
							</p>
						)}
						{catalogDryRun?.status === "SUCCESS" &&
							(catalogDryRun.changedFields.length > 0 ? (
								<div
									className="flex flex-col gap-2"
									data-testid="engine-model-settings--catalog-apply-changes"
								>
									<p className="text-muted-foreground">
										Settings that will change:
									</p>
									<div className="flex flex-wrap gap-1.5">
										{sortCatalogFields(
											catalogDryRun.changedFields,
										).map((field) => (
											<Badge
												key={field}
												variant="secondary"
												className="font-normal"
											>
												{formatCatalogField(field)}
											</Badge>
										))}
									</div>
								</div>
							) : (
								<p
									className="text-muted-foreground"
									data-testid="engine-model-settings--catalog-apply-no-changes"
								>
									Everything already matches the catalog
									entry, so nothing will change.
								</p>
							))}
						{/* clearing leaves the metadata - and any unsaved edits
						 * to it - untouched, so there is nothing to warn about */}
						{isDirty && catalogApply?.kind !== "clear" && (
							<SettingsWarning
								message="Your unsaved edits to these settings will be discarded."
								testId="engine-model-settings--catalog-apply-dirty-warning"
							/>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCatalogApply(null)}
							disabled={isApplyingCatalog}
							data-testid="engine-model-settings--catalog-apply-cancel"
						>
							Cancel
						</Button>
						<Button
							onClick={confirmCatalogApply}
							disabled={
								isApplyingCatalog ||
								(catalogApply?.kind !== "clear" &&
									(catalogDryRun?.status !== "SUCCESS" ||
										catalogDryRun.changedFields.length ===
											0))
							}
							data-testid="engine-model-settings--catalog-apply-confirm"
						>
							{isApplyingCatalog ? (
								<Spinner className="size-4" />
							) : catalogApply?.kind === "reset" ? (
								"Reset settings"
							) : catalogApply?.kind === "clear" ? (
								"Remove match"
							) : (
								"Apply entry"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
