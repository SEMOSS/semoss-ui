/** biome-ignore-all lint/a11y/useKeyWithClickEvents: legacy click handlers */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: legacy click handlers */

import { ChevronDown, ChevronUp, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Controller,
	Field,
	FieldDescription,
	FieldLabel,
	H4,
	Input,
	Muted,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Switch,
	Textarea,
	toast,
	useForm,
	useWatch,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import {
	EngineBuiltinToolsField,
	type ModelBuiltinTools,
} from "@/components/engine/engine-builtin-tools-field";
import type {
	BuiltinToolSelection,
	ReasoningConfig,
} from "@/components/engine/engine-metadata-display";
import { useRootStore, useStepper } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId } from "@/utility";
import type { CatalogMatchState } from "./model-catalog-match";
import { ModelCatalogMatch } from "./model-catalog-match";
import type { CategoryTexts, FieldDefinition } from "./model-import.constants";
import { ModelReasoningConfigField } from "./model-reasoning-config-field";
import {
	RouterConfigField,
	routerConfigToJson,
	validateRouterConfig,
} from "./router-config-field";

interface ModelImportFormProps {
	/**
	 * Fields to be rendered in the form
	 */
	fields: FieldDefinition[];
	/**
	 * advanced Fields to be rendered in the form (collapsible section)
	 */
	advanced: FieldDefinition[];
	/**
	 * callback invoked when form is submitted with values
	 */
	onComplete?: (data: Record<string, unknown>) => void;

	selectedProvider: string;

	importableModelsCategory: CategoryTexts;

	/**
	 * Only supplied when the Model ID is the user's to type. Reports the ID as it
	 * settles so the page can look it up in the model catalog.
	 */
	onModelIdChange?: (modelId: string) => void;

	/** What the catalog lookup came back with, or null when there is no lookup. */
	catalogMatch?: CatalogMatchState | null;

	/** The catalog entry the user picked by hand, null when they have not. */
	pickedCatalogKey?: string | null;

	onPickCatalogKey?: (catalogKey: string | null) => void;
}

/** How long to let the Model ID settle before looking it up. */
const MODEL_ID_LOOKUP_DEBOUNCE_MS = 400;

/** Join labels into "Image", "Image or PDF", "Image, Audio or PDF". */
const formatOptionList = (labels: string[]) =>
	labels.length < 2
		? labels.join("")
		: `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;

/**
 * Advisory copy for selected options the model catalog does not list.
 *
 * Returns "" when there is nothing to say. Nothing here blocks the import - the
 * catalog is hand-curated, so a deployment can legitimately offer what it omits,
 * and the model settings tab warns on the same mismatch rather than disabling it.
 */
export const getUnlistedOptionWarning = (
	field: FieldDefinition,
	selectedValues: string[],
) => {
	const unlisted = (field.warningOptions || []).filter((option) =>
		selectedValues.includes(option),
	);

	if (unlisted.length === 0) {
		return "";
	}

	const pronoun = unlisted.length > 1 ? "them" : "it";
	const labels = unlisted.map(
		(option) => field.optionLabels?.[option] || option,
	);

	return `The model catalog does not list ${formatOptionList(labels)} among ${field.label} for this model. You can still keep ${pronoun} selected, but the provider may reject requests that use ${pronoun}.`;
};

const getModelFieldTestId = (
	fieldKey: string,
	target: "field" | "input" | "error" | "option" | "label" | "warning",
	optionValue?: string,
) => {
	const base = `model-import-form-${target}-${fieldKey}`;

	return formatToDataTestId(optionValue ? `${base}-${optionValue}` : base);
};

const getDefaultFieldValue = (field: FieldDefinition) =>
	field.default ??
	field.value ??
	(field.type === "boolean"
		? false
		: field.type === "multiselect"
			? []
			: field.type === "builtin-tools" ||
					field.type === "reasoning-config"
				? null
				: "");

const hasSelectedMultiselectValue = (value: unknown) =>
	Array.isArray(value) && value.length > 0;

export const ModelImportForm = (props: ModelImportFormProps) => {
	const {
		fields,
		advanced,
		onComplete,
		selectedProvider,
		importableModelsCategory,
		onModelIdChange,
		catalogMatch,
		pickedCatalogKey = null,
		onPickCatalogKey,
	} = props;

	const { monolithStore, configStore } = useRootStore();
	const navigate = useNavigate();
	const { isLoading, setIsLoading } = useStepper();

	const [advancedOpen, setAdvancedOpen] = useState(false);
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});
	const [isValidDatabaseName, setIsValidDatabaseName] =
		useState<boolean>(false);

	// prepare default values from fields + advanced
	const {
		control,
		handleSubmit,
		reset,
		setError,
		clearErrors,
		setFocus,
		setValue,
		trigger,
		formState: { isValid },
	} = useForm({
		mode: "onChange",
		defaultValues: [...fields, ...advanced].reduce<Record<string, unknown>>(
			(acc, f) => {
				acc[f.key] = getDefaultFieldValue(f);
				return acc;
			},
			{},
		),
	});

	const _lastField = useRef({
		lastFocussedField: "",
		lastFocussedValue: "",
		lastValidatedValue: "",
		runValidate: false,
	});

	//  Group fields by category
	const grouped = fields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	// Reset defaults when fields change. The field list is rebuilt whenever the page
	// resolves new catalog metadata, which happens while the form is being filled in,
	// so anything the user has already edited is carried across the reset - otherwise
	// looking up a model ID would clear their API key.
	useEffect(() => {
		const defaults: Record<string, unknown> = {};
		[...fields, ...advanced].forEach((f) => {
			defaults[f.key] = getDefaultFieldValue(f);
		});

		reset(defaults, { keepDirtyValues: true, keepErrors: true });
	}, [fields, advanced, reset]);

	// The provider pair drives which built-in tools the catalog can offer.
	// Both selects are user-editable, so the live form values are what count.
	// REASONING rides along because the reasoning editor owns that switch even
	// though the value belongs to its own hidden field.
	const [
		watchedServingProvider,
		watchedModelProvider,
		watchedModelId,
		watchedReasoning,
	] = useWatch({
		control,
		name: ["SERVING_PROVIDER", "MODEL_PROVIDER", "MODEL", "REASONING"],
	});

	// Let a typed model id settle before asking the catalog about it.
	const [settledModelId, setSettledModelId] = useState("");
	useEffect(() => {
		const modelId =
			typeof watchedModelId === "string" ? watchedModelId.trim() : "";
		const timeout = setTimeout(
			() => setSettledModelId(modelId),
			MODEL_ID_LOOKUP_DEBOUNCE_MS,
		);
		return () => clearTimeout(timeout);
	}, [watchedModelId]);

	const hasBuiltinToolsField = [...fields, ...advanced].some(
		(f) => f.type === "builtin-tools",
	);

	// Provider-hosted tools for the picked providers, fetched while the engine
	// does not exist yet. An "OTHER" model provider is withheld so the backend
	// infers the maker from the model id instead. Optional data - no match
	// just leaves the free-text editor in place.
	const builtinToolsPixel = useMemo(() => {
		if (!hasBuiltinToolsField) {
			return "";
		}
		const args: string[] = [];
		const servingProvider =
			typeof watchedServingProvider === "string"
				? watchedServingProvider.trim()
				: "";
		const modelProvider =
			typeof watchedModelProvider === "string"
				? watchedModelProvider.trim()
				: "";
		if (servingProvider !== "") {
			args.push(`servingProvider=[${JSON.stringify(servingProvider)}]`);
		}
		if (modelProvider !== "" && modelProvider !== "OTHER") {
			args.push(`modelProvider=[${JSON.stringify(modelProvider)}]`);
		}
		if (settledModelId !== "") {
			args.push(`modelId=[${JSON.stringify(settledModelId)}]`);
		}
		return args.length > 0
			? `GetModelBuiltinTools(${args.join(", ")});`
			: "";
	}, [
		hasBuiltinToolsField,
		watchedServingProvider,
		watchedModelProvider,
		settledModelId,
	]);

	const getModelBuiltinTools = usePixel<ModelBuiltinTools>(builtinToolsPixel);
	const builtinToolsCatalog =
		getModelBuiltinTools.status === "SUCCESS"
			? (getModelBuiltinTools.data?.tools ?? {})
			: {};
	const hasBuiltinToolsCatalog = Object.keys(builtinToolsCatalog).length > 0;

	const getHelperText = (error, val) => {
		if (!error) return val.helperText || "";
		if (typeof error === "string") return error;
		if (error?.message) return error.message;
		if (error.type === "checkField" && val.rules?.custom?.message) {
			return val.rules.custom.message;
		}
		return "";
	};

	const onSubmit = async (data: Record<string, unknown>) => {
		const { FILE, ...newFormData } = data;

		// The backend writes the router config onto a single SMSS line, so it must
		// be valid JSON and cannot contain raw newlines - validate and minify here.
		// The router-config editor holds a structured object; a plain string is
		// still accepted for safety.
		if (typeof newFormData.ROUTER_CONFIG_JSON === "string") {
			try {
				newFormData.ROUTER_CONFIG_JSON = JSON.stringify(
					JSON.parse(newFormData.ROUTER_CONFIG_JSON),
				);
			} catch {
				toast.error("Routing Configuration must be valid JSON.");
				return;
			}
		} else if (
			newFormData.ROUTER_CONFIG_JSON !== undefined &&
			newFormData.ROUTER_CONFIG_JSON !== null
		) {
			const validation = validateRouterConfig(
				newFormData.ROUTER_CONFIG_JSON,
			);
			if (validation !== true) {
				toast.error(validation);
				return;
			}
			newFormData.ROUTER_CONFIG_JSON = routerConfigToJson(
				newFormData.ROUTER_CONFIG_JSON,
			);
		}

		if (
			newFormData.REASONING_CONFIG &&
			typeof newFormData.REASONING_CONFIG === "object"
		) {
			newFormData.REASONING_CONFIG = JSON.stringify(
				newFormData.REASONING_CONFIG,
			);
		}

		setIsLoading(true);
		let pixel = `CreateModelEngine(model=["${
			newFormData.NAME
		}"],modelDetails=[${JSON.stringify(newFormData)}])`;

		if (FILE !== "" && FILE !== undefined) {
			try {
				const uploadedFiles = await uploadFile(
					FILE as File[],
					configStore.store.insightID,
				);

				if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
					toast.error("Upload failed or returned invalid response.");
					setIsLoading(false);
					return;
				}
				pixel = pixel.replace(
					")",
					`,filePaths=["${uploadedFiles[0].fileLocation}"])`,
				);
			} catch {
				toast.error("Upload failed or returned invalid response.");
				setIsLoading(false);
				return;
			}
		}

		// debugger;
		monolithStore.runQuery(pixel).then(async (response) => {
			const output = response.pixelReturn[0].output,
				operationType = response.pixelReturn[0].operationType;

			setIsLoading(false);

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));
				return;
			}

			// engine_id is the current key; database_id is the legacy fallback
			const engineId = output.engine_id || output.database_id;
			const description =
				typeof newFormData.DESCRIPTION === "string"
					? newFormData.DESCRIPTION.trim()
					: "";

			if (engineId && description) {
				try {
					const metadataResponse = await configStore.runPixel(
						`SetEngineMetadata(engine=[${JSON.stringify(engineId)}], meta=[${JSON.stringify(
							{ description },
						)}]);`,
					);
					const metadataResult = metadataResponse.pixelReturn?.[0];
					if (
						metadataResponse.errors.length > 0 ||
						String(metadataResult?.operationType || "").includes(
							"ERROR",
						)
					) {
						throw new Error("Unable to save model description");
					}
				} catch {
					toast.warning(
						"Model added, but its description could not be saved.",
					);
				}
			}

			toast.success("Successfully added LLM to catalog");
			navigate(`/model/${engineId}`);
		});

		if (onComplete) onComplete(data);
	};

	// Helper functions for file upload
	const onFileUpload = (
		files: File | File[],
		fieldOnChange: (value: File[]) => void,
		currentValue: File | File[],
	) => {
		const fileArray = Array.isArray(files) ? files : [files];

		// Get current files from field value
		const currentFiles = Array.isArray(currentValue)
			? currentValue
			: currentValue
				? [currentValue]
				: [];
		const existingFileNames = currentFiles.map((f: File) => f.name);
		const newFiles = fileArray.filter(
			(f) => !existingFileNames.includes(f.name),
		);
		const combined = [...currentFiles, ...newFiles];

		// Update form value with validation
		fieldOnChange(combined);
	};

	const removeFile = (
		index: number,
		fieldOnChange: (value: File[]) => void,
		currentValue: File | File[],
	) => {
		const currentFiles = Array.isArray(currentValue)
			? currentValue
			: currentValue
				? [currentValue]
				: [];
		const updated = currentFiles.filter((_, i) => i !== index);

		// Update form value with validation
		fieldOnChange(updated);
	};

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		fieldOnChange: (value: File[]) => void,
		currentValue: File | File[],
	) => {
		const files = e.target.files;
		if (files && files?.length > 0) {
			const fileArray = Array.from(files);
			onFileUpload(fileArray, fieldOnChange, currentValue);
		}
		// Reset input value to allow re-selecting the same file
		e.target.value = "";
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		fieldOnChange: (value: File[]) => void,
		currentValue: File | File[],
	) => {
		e.preventDefault();
		e.stopPropagation();
		const files = e.dataTransfer.files;
		if (files && files?.length > 0) {
			const fileArray = Array.from(files);
			onFileUpload(fileArray, fieldOnChange, currentValue);
		}
	};

	const renderField = (f: FieldDefinition) => {
		const defaultVal = getDefaultFieldValue(f);
		const fieldWrapperTestId = getModelFieldTestId(f.key, "field");
		const fieldInputTestId = getModelFieldTestId(f.key, "input");
		const fieldErrorTestId = getModelFieldTestId(f.key, "error");

		if (f.type === "hidden") {
			return (
				<Controller
					key={f.key}
					name={f.key}
					control={control}
					defaultValue={defaultVal}
					rules={{ required: f.required }}
					render={({ field }) => (
						<input
							type="hidden"
							name={field.name}
							value={String(field.value ?? "")}
							data-testid={fieldInputTestId}
							onChange={(e) =>
								field.onChange(
									(e.target as HTMLInputElement).value,
								)
							}
							ref={field.ref}
						/>
					)}
				/>
			);
		}

		const validateFormField = async (
			field,
			userInput,
		): Promise<boolean> => {
			const pixelToExecute = field.rules.custom_rules.value.replace(
				"[VALUE]",
				userInput,
			);

			const response = await monolithStore.runQuery(pixelToExecute);
			const output = response.pixelReturn[0].output,
				operationType = response.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));
				return;
			}

			//if the name already exists then the engine name is not valid
			if (output.exists) {
				setFocus(field.fieldName);
				setIsValidDatabaseName(true);
				return false;
			}
			setIsValidDatabaseName(false);

			return true;
		};

		return (
			<Controller
				key={f.key}
				name={f.key}
				control={control}
				defaultValue={defaultVal}
				rules={{
					required:
						f.type === "multiselect" && f.required
							? `Select at least one ${f.label.toLowerCase()}.`
							: f.required,
					...(f.type === "multiselect" && f.required
						? {
								validate: (value: unknown) =>
									hasSelectedMultiselectValue(value) ||
									`Select at least one ${f.label.toLowerCase()}.`,
							}
						: {}),
					...(f.type === "router-config"
						? {
								validate: (value: unknown) =>
									validateRouterConfig(value),
							}
						: {}),
				}}
				render={({
					field: { ref, ...field },
					fieldState: { error },
					formState: { errors },
				}) => {
					switch (f.type) {
						case "text": {
							const isReadOnlyInitScript =
								f.key === "INIT_MODEL_ENGINE" && !!f.disabled;
							// the catalog lookup only applies to an ID the user types;
							// a card that pins its own model ID is already known
							const isMatchableModelId =
								f.key === "MODEL" &&
								!f.disabled &&
								!!onModelIdChange;
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<Input
										id={f.key}
										value={field.value ?? ""}
										onChange={(v) => {
											field.onChange(v);
											if (isMatchableModelId) {
												const lookupKey = `${f.key}__catalog`;
												if (
													debounceTimeoutsRef.current[
														lookupKey
													]
												) {
													clearTimeout(
														debounceTimeoutsRef
															.current[lookupKey],
													);
												}
												const typed = v.target.value;
												debounceTimeoutsRef.current[
													lookupKey
												] = setTimeout(() => {
													onModelIdChange(typed);
												}, MODEL_ID_LOOKUP_DEBOUNCE_MS);
											}
											if (f.rules?.custom_rules) {
												if (
													debounceTimeoutsRef.current[
														f.key
													]
												) {
													clearTimeout(
														debounceTimeoutsRef
															.current[f.key],
													);
												}
												debounceTimeoutsRef.current[
													f.key
												] = setTimeout(async () => {
													const value =
														v.target.value;
													if (value === "") {
														setError(f.key, {});
														return;
													}
													if (
														!f.rules.pattern.value.test(
															value,
														)
													) {
														setError(f.key, {
															message:
																f.rules.pattern
																	.message ||
																"Invalid characters in input.",
														});
														return;
													}
													const isValid =
														await validateFormField(
															f,
															value,
														);
													if (!isValid) {
														setError(f.key, {
															message:
																f.rules
																	?.custom_rules
																	?.message ||
																"Invalid value.",
														});
													} else {
														clearErrors(f.key);
													}
												}, 300);
											}
										}}
										disabled={
											isReadOnlyInitScript
												? false
												: f.disabled
										}
										readOnly={isReadOnlyInitScript}
										className={
											isReadOnlyInitScript
												? "cursor-not-allowed overflow-x-auto whitespace-nowrap font-mono disabled:opacity-50"
												: undefined
										}
										autoComplete="off"
										data-testid={fieldInputTestId}
									/>
									<FieldDescription
										className={
											errors?.[f.key]
												? "text-destructive"
												: ""
										}
										data-testid={fieldErrorTestId}
									>
										{getHelperText(errors?.[f.key], f)}
									</FieldDescription>
									{isMatchableModelId && (
										<ModelCatalogMatch
											state={catalogMatch ?? null}
											pickedKey={pickedCatalogKey}
											onPick={(catalogKey) =>
												onPickCatalogKey?.(catalogKey)
											}
										/>
									)}
								</Field>
							);
						}
						case "file-upload":
							return (
								<div
									className="flex flex-col gap-2"
									data-testid={fieldWrapperTestId}
								>
									<P>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												{" "}
												*
											</span>
										)}
									</P>
									<div
										className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
										onClick={() =>
											fileInputRefs.current[
												f.key
											]?.click()
										}
										onDragOver={handleDragOver}
										onDrop={(e) =>
											handleDrop(
												e,
												field.onChange,
												field.value,
											)
										}
									>
										<input
											ref={(el) => {
												fileInputRefs.current[f.key] =
													el;
											}}
											type="file"
											accept={
												(
													f.options as {
														extensions?: string[];
													}
												)?.extensions?.join(",") || "*"
											}
											multiple={false}
											className="hidden"
											onChange={(e) =>
												handleFileChange(
													e,
													field.onChange,
													field.value,
												)
											}
											disabled={f.disabled}
											data-testid={fieldInputTestId}
										/>
										<div className="text-center">
											<P className="font-medium text-foreground">
												Drop your file here or click to
												browse
											</P>
											<P className="text-muted-foreground text-sm">
												{(
													f.options as {
														extensions?: string[];
													}
												)?.extensions
													? `Supports ${(f.options as { extensions?: string[] }).extensions.join(", ")} files`
													: "All file types supported"}
											</P>
										</div>
									</div>

									{/* File List */}
									{field.value &&
										Array.isArray(field.value) &&
										field.value.length > 0 && (
											<div className="mt-2 flex flex-col gap-2">
												<P className="font-medium text-foreground text-sm">
													{field.value.length} file(s)
													selected:
												</P>
												<div className="flex max-h-[200px] flex-col gap-1 overflow-auto rounded-md border border-border bg-muted/30 p-2">
													{field.value.map(
														(file, index) => (
															<div
																key={`${file.name}-${index}`}
																className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 transition-colors hover:bg-accent"
																data-testid={`uploaded-file-item-${index}`}
															>
																<div className="flex min-w-0 flex-1 items-center gap-2">
																	<div className="min-w-0 flex-1">
																		<P className="truncate text-foreground text-sm">
																			{
																				file.name
																			}
																		</P>
																		<P className="text-muted-foreground text-xs">
																			{(
																				file.size /
																				1024
																			).toFixed(
																				2,
																			)}{" "}
																			KB
																		</P>
																	</div>
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={(
																		e,
																	) => {
																		e.stopPropagation();
																		removeFile(
																			index,
																			field.onChange,
																			field.value,
																		);
																	}}
																	className="size-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
																	data-testid={`remove-file-btn-${index}`}
																>
																	<X className="size-4" />
																</Button>
															</div>
														),
													)}
												</div>
											</div>
										)}

									{error && (
										<P
											className="text-destructive text-sm"
											data-testid={fieldErrorTestId}
										>
											{error.message ||
												(f.rules?.pattern?.message ??
													f.helperText)}
										</P>
									)}
								</div>
							);
						case "url":
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<Input
										id={f.key}
										type="url"
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										disabled={f.disabled}
										autoComplete="off"
										data-testid={fieldInputTestId}
									/>
								</Field>
							);
						case "password":
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<Input
										id={f.key}
										type="password"
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										disabled={f.disabled}
										autoComplete="new-password"
										data-testid={fieldInputTestId}
									/>
									{f.helperText && (
										<FieldDescription
											data-testid={fieldErrorTestId}
										>
											{f.helperText}
										</FieldDescription>
									)}
								</Field>
							);
						case "number":
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<Input
										id={f.key}
										type="text"
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										disabled={f.disabled}
										autoComplete="off"
										data-testid={fieldInputTestId}
										onFocus={() => {
											_lastField.current = {
												..._lastField.current,
												lastFocussedField: field.name,
												lastFocussedValue: String(
													field.value ?? "",
												),
												lastValidatedValue: field.value,
											};
										}}
										onBlur={() => {
											if (f.rules?.custom_rules) {
												_lastField.current.runValidate = true;
												trigger(field.name);
											}
										}}
									/>
									{f.helperText && !error && (
										<FieldDescription
											data-testid={fieldErrorTestId}
										>
											{f.helperText}
										</FieldDescription>
									)}
								</Field>
							);
						case "textarea":
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<Textarea
										id={f.key}
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										rows={4}
										disabled={f.disabled}
										autoComplete="off"
										data-testid={fieldInputTestId}
									/>
								</Field>
							);
						case "builtin-tools": {
							const selection =
								field.value &&
								typeof field.value === "object" &&
								!Array.isArray(field.value)
									? (field.value as Record<
											string,
											BuiltinToolSelection
										>)
									: null;
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
									</FieldLabel>
									{hasBuiltinToolsCatalog ? (
										<EngineBuiltinToolsField
											tools={builtinToolsCatalog}
											value={selection}
											onChange={(next) =>
												field.onChange(next)
											}
											testId={fieldInputTestId}
										/>
									) : (
										<p
											className="text-muted-foreground text-sm"
											data-testid={fieldInputTestId}
										>
											No provider-hosted tools are
											available for this provider and
											model.
										</p>
									)}
									{f.helperText && (
										<FieldDescription
											data-testid={fieldErrorTestId}
										>
											{f.helperText}
										</FieldDescription>
									)}
								</Field>
							);
						}
						case "router-config":
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<RouterConfigField
										value={field.value}
										onChange={(next) =>
											field.onChange(next)
										}
										disabled={f.disabled}
										testId={fieldInputTestId}
									/>
									{(error || f.helperText) && (
										<FieldDescription
											data-testid={fieldErrorTestId}
										>
											{getHelperText(error, f)}
										</FieldDescription>
									)}
								</Field>
							);
						case "reasoning-config": {
							const asConfig = (raw: unknown) =>
								raw &&
								typeof raw === "object" &&
								!Array.isArray(raw)
									? (raw as ReasoningConfig)
									: null;
							return (
								<div data-testid={fieldWrapperTestId}>
									<ModelReasoningConfigField
										catalogConfig={asConfig(f.default)}
										value={asConfig(field.value)}
										onChange={(next) =>
											field.onChange(next)
										}
										reasoning={watchedReasoning === true}
										// The switch belongs to this editor but
										// the value is REASONING's own column.
										onReasoningChange={(checked) =>
											setValue("REASONING", checked, {
												shouldDirty: true,
											})
										}
										helperText={f.helperText}
										helperTextTestId={fieldErrorTestId}
										testId={fieldInputTestId}
									/>
								</div>
							);
						}
						case "select":
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel htmlFor={f.key}>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<Select
										value={field.value ?? ""}
										onValueChange={(value) =>
											field.onChange(value)
										}
										disabled={f.disabled}
									>
										<SelectTrigger
											id={f.key}
											className="w-full"
											data-testid={fieldInputTestId}
										>
											<SelectValue
												placeholder={`Select ${f.label}`}
											/>
										</SelectTrigger>
										<SelectContent>
											{(f.options || []).map((opt) => (
												<SelectItem
													key={opt}
													value={opt}
													data-testid={getModelFieldTestId(
														f.key,
														"option",
														opt,
													)}
												>
													{f.optionLabels?.[opt] ||
														opt}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							);
						case "multiselect": {
							const selectedValues = Array.isArray(field.value)
								? field.value.map(String)
								: [];
							const optionWarning = getUnlistedOptionWarning(
								f,
								selectedValues,
							);
							return (
								<Field data-testid={fieldWrapperTestId}>
									<FieldLabel>
										{f.label}
										{f.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
										{(f.options || []).map((opt) => {
											const optionId = `${f.key}-${opt}`;
											const optionDisabled = !!f.disabled;
											return (
												<div
													key={opt}
													className="flex items-center gap-2 text-sm"
												>
													<Checkbox
														id={optionId}
														checked={selectedValues.includes(
															opt,
														)}
														onCheckedChange={(
															checked,
														) => {
															const nextValues =
																checked
																	? [
																			...selectedValues,
																			opt,
																		]
																	: selectedValues.filter(
																			(
																				value,
																			) =>
																				value !==
																				opt,
																		);
															field.onChange(
																nextValues,
															);
														}}
														disabled={
															optionDisabled
														}
														data-testid={getModelFieldTestId(
															f.key,
															"option",
															opt,
														)}
													/>
													<label
														htmlFor={optionId}
														className={
															optionDisabled
																? "cursor-not-allowed text-muted-foreground"
																: "cursor-pointer"
														}
													>
														{opt}
													</label>
												</div>
											);
										})}
									</div>
									{optionWarning !== "" && (
										<p
											className="flex items-start gap-1.5 text-amber-600 text-xs dark:text-amber-400"
											data-testid={getModelFieldTestId(
												f.key,
												"warning",
											)}
										>
											<TriangleAlert className="mt-px size-3.5 shrink-0" />
											<span>{optionWarning}</span>
										</p>
									)}
									{error && (
										<P
											className="text-destructive text-sm"
											data-testid={fieldErrorTestId}
										>
											{error.message}
										</P>
									)}
									{f.helperText && !error && (
										<FieldDescription>
											{f.helperText}
										</FieldDescription>
									)}
								</Field>
							);
						}
						case "boolean":
							return (
								<div
									key={f.key}
									className="flex flex-row items-center gap-2"
									data-testid={fieldWrapperTestId}
								>
									<Switch
										checked={!!field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked);
										}}
										required={f.required}
										disabled={f.disabled}
										data-testid={fieldInputTestId}
									/>
									<P
										data-testid={getModelFieldTestId(
											f.key,
											"label",
										)}
									>
										{f.label}
									</P>
								</div>
							);
						default:
							return null;
					}
				}}
			/>
		);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="my-4"
			autoComplete="off"
		>
			{Object.keys(grouped).map((category) => (
				<div key={category} className="mb-4 flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
						{/* Left: Category title + description */}
						<div className="flex flex-1 flex-col gap-1">
							<H4
								className="font-semibold text-base tracking-tight"
								data-testid={`model-importForm-category-title`}
							>
								{category}
							</H4>
							<Muted
								className="text-muted-foreground text-sm leading-6"
								data-testid={`model-importForm-category-description`}
							>
								{importableModelsCategory[selectedProvider]?.[
									category
								] ?? "No description available."}
							</Muted>
						</div>

						{/* Right: Fields under this category */}
						<div className="flex flex-[2] flex-col gap-2">
							{grouped[category].map((f) => renderField(f))}
						</div>
					</div>
					<Separator />
				</div>
			))}
			{advanced.length > 0 && (
				<div className="mt-4">
					<Collapsible
						open={advancedOpen}
						onOpenChange={setAdvancedOpen}
					>
						<div className="flex flex-row items-center justify-between gap-2">
							<H4 data-testid="model-advanced-settings-title">
								Advanced Settings
							</H4>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									data-testid="model-advanced-settings-toggle"
								>
									{advancedOpen ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									)}
								</Button>
							</CollapsibleTrigger>
						</div>
						<CollapsibleContent>
							<div className="mb-4 flex flex-col gap-4">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
									{/* Left: Category title + description */}
									<div className="flex flex-1 flex-col gap-1">
										<Muted data-testid="model-advanced-settings-description">
											Add advanced settings here
										</Muted>
									</div>

									{/* Right: Fields under this category */}
									<div className="flex flex-[2] flex-col gap-2">
										{advanced.map((f) => renderField(f))}
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>
			)}
			<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button
					data-testid="model-importForm-connect-button"
					variant="default"
					className="flex w-full items-center justify-center gap-2 px-4 py-2 sm:w-[147px]"
					type="submit"
					disabled={isLoading || !isValid || isValidDatabaseName}
				>
					Connect
				</Button>
			</div>
		</form>
	);
};
