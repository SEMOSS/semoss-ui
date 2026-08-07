import { useEffect, useId, useRef, useState } from "react";
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
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import { CatalogTagInput } from "@/components/catalog";
import { useRootStore } from "@/hooks";
import {
	CAPABILITIES,
	formatDigits,
	formatEnumLabel,
	formatModalityLabel,
	MODALITIES,
	type ModelMetadata,
	ModelMetadataFields,
	type ModelSettingsValues,
	normalizeStringArray,
	toModelSettingsValues,
} from "./engine-metadata-display";

/** Radix Select rejects empty item values, so "unset" needs a sentinel. */
const CAPABILITY_NONE = "__none__";

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

			const payload = {
				CAPABILITY: form.capability !== "" ? form.capability : null,
				INPUT_MODALITIES: normalizeStringArray(form.inputModalities),
				OUTPUT_MODALITIES: normalizeStringArray(form.outputModalities),
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
									>
										{formatModalityLabel(modality)}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<FieldDescription>
								Content types the model accepts as input.
							</FieldDescription>
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
									>
										{formatModalityLabel(modality)}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
							<FieldDescription>
								Content types the model can produce.
							</FieldDescription>
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
