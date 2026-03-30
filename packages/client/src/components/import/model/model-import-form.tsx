/** biome-ignore-all lint/a11y/useKeyWithClickEvents: legacy click handlers */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: legacy click handlers */
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
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
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore, useStepper } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import type { CategoryTexts, FieldDefinition } from "./model-import.constants";

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
}

export const ModelImportForm = (props: ModelImportFormProps) => {
	const {
		fields,
		advanced,
		onComplete,
		selectedProvider,
		importableModelsCategory,
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
		trigger,
		formState: { isValid },
	} = useForm({
		mode: "onChange",
		defaultValues: [...fields, ...advanced].reduce<Record<string, unknown>>(
			(acc, f) => {
				acc[f.key] =
					f.default ?? f.value ?? (f.type === "boolean" ? false : "");
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

	// reset defaults when fields change
	useEffect(() => {
		const defaults: Record<string, unknown> = {};
		[...fields, ...advanced].forEach((f) => {
			defaults[f.key] =
				f.default ?? f.value ?? (f.type === "boolean" ? false : "");
		});
		reset(defaults);
	}, [fields, advanced, reset]);

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

			toast.success("Successfully added LLM to catalog");
			// engine_id is the current key; database_id is the legacy fallback
			navigate(`/engine/model/${output.engine_id || output.database_id}`);
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
		const defaultVal =
			f.default ?? f.value ?? (f.type === "boolean" ? false : "");

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
							data-testId={`model-ImportForm-${f.key}-hidden-input`}
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
					required: f.required,
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
							return (
								<Field>
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
										data-testId={formatToDataTestId(
											`importForm-${f.label}-textField`,
										)}
									/>
									<FieldDescription
										className={
											errors?.[f.key]
												? "text-destructive"
												: ""
										}
									>
										{getHelperText(errors?.[f.key], f)}
									</FieldDescription>
								</Field>
							);
						}
						case "file-upload":
							return (
								<div
									className="flex flex-col gap-2"
									data-testid={`function-form-field-${f.key}`}
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
											data-testid={`function-form-input-${f.key}`}
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
											data-testid={`function-form-error-${f.key}`}
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
								<Field>
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
										data-testId={formatToDataTestId(
											`model-importForm-${f.label}-url`,
										)}
									/>
								</Field>
							);
						case "password":
							return (
								<Field>
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
										data-testId={formatToDataTestId(
											`model-importForm-${f.label}-password`,
										)}
									/>
									{f.helperText && (
										<FieldDescription>
											{f.helperText}
										</FieldDescription>
									)}
								</Field>
							);
						case "number":
							return (
								<Field>
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
										data-testId={formatToDataTestId(
											`model-importForm-${f.label}`,
										)}
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
										<FieldDescription>
											{f.helperText}
										</FieldDescription>
									)}
								</Field>
							);
						case "textarea":
							return (
								<Field>
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
										data-testId={formatToDataTestId(
											`model-importForm-${f.label}-textarea`,
										)}
									/>
								</Field>
							);
						case "select":
							return (
								<Field>
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
											data-testId={formatToDataTestId(
												`model-importForm-${f.label}-select`,
											)}
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
												>
													{opt}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							);
						case "boolean":
							return (
								<div
									key={f.key}
									className="flex flex-row items-center gap-2"
								>
									<Switch
										checked={!!field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked);
										}}
										required={f.required}
										disabled={f.disabled}
									/>
									<P
										data-testId={formatToDataTestId(
											`model-importForm-${f.label}-text`,
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
							<H4 data-testId={`model-importForm-category-title`}>
								{category}
							</H4>
							<Muted
								data-testId={`model-importForm-category-description`}
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
							<H4 data-testId="model-advanced-settings-title">
								Advanced Settings
							</H4>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									data-testId="model-advanced-settings-toggle"
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
										<Muted data-testId="model-advanced-settings-description">
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
					data-testId="model-importForm-connect-button"
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
