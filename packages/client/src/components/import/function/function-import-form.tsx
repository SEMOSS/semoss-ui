/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	H4,
	Input,
	Label,
	Muted,
	P,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { TextArea } from "@semoss/ui";

export interface ParsedResult {
	headers: string[];
	dataTypes: Record<string, string>;
	cleanHeaders: string[];
	positions: Record<string, { left: number; top: number }>;
	relation: {
		relName: string;
		fromTable: string;
		toTable: string;
		toCol: string;
	}[];
	nodeProp: Record<string, string[]>;
}

export const FunctionForm = ({
	title,
	description,
	fields,
	advanced,
	categoryDescription,
}) => {
	const [openAdvanced, setOpenAdvanced] = useState(false);
	const [resolvedFields, setResolvedFields] = useState(fields);
	const [isValidDatabaseName, setIsValidDatabaseName] =
		useState<boolean>(false);
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		setFocus,
		formState,
		setError,
		clearErrors,
	} = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: [...fields].reduce((acc, f) => {
			acc[f.key] = f.value || "";
			return acc;
		}, {}),
	});

	const watchedFieldRef = useRef({});
	const { monolithStore, configStore } = useRootStore();
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;
	const [loading, setLoading] = useState(false);

	//  Group fields by category
	const grouped = defaultFields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	const onFormSubmit = async (formData) => {
		const { FILE, ...newFormData } = formData;

		setLoading(true);
		let pixel = "";
		if (title === "PYTHON") {
			const requiredParams =
				formData.FUNCTION_REQUIRED_PARAMETERS !== ""
					? JSON.stringify([
							formData.FUNCTION_REQUIRED_PARAMETERS,
						]).replace(/"/g, '\\"')
					: "[]";
			const functionParams = JSON.stringify([
				{
					parameterName: formData.FUNCTION_PARAMETERS,
					parameterType: "String",
					parameterDescription:
						formData.FUNCTION_REQUIRED_PARAMETERS_DESCRIPTION || "",
				},
			]).replace(/"/g, '\\"');
			const fileName = formData.PYTHON_FILE_NAME
				? formData.PYTHON_FILE_NAME
				: "main.py";
			const content = formData.CONTENT
				? formData.CONTENT
				: "Test Function Content";

			pixel = `
CreatePythonFunctionEngine(
    function=["${formData.NAME}"],
    content=["${content}"],
    functionDetails=[{
        "FUNCTION_NAME":"${formData.NAME}",
        "FUNCTION_DESCRIPTION":"${formData.FUNCTION_DESCRIPTION || ""}",
        "FUNCTION_TYPE":"LOCAL_PYTHON",
        "FUNCTION_REQUIRED_PARAMETERS":"${requiredParams}",
        "FUNCTION_PARAMETERS":"${functionParams}",
        "PYTHON_FILE_NAME":"${fileName}"
    }]
);
		`;
		} else {
			pixel = `CreateRestFunctionEngine(function=["${
				formData.NAME
			}"],functionDetails=[${JSON.stringify(newFormData)}]);`;
		}
		if (FILE !== "" && title !== "PYTHON") {
			try {
				const uploadedFiles = await uploadFile(
					[FILE],
					configStore.store.insightID,
				);

				if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
					toast.error("Upload failed or returned invalid response.");
					setLoading(false);
					return;
				}
				pixel = pixel.replace(
					");",
					`,filePaths=["${uploadedFiles[0].fileLocation}"]` + ");",
				);
			} catch {
				toast.error("Upload failed or returned invalid response.");
				setLoading(false);
				return;
			}
		}
		monolithStore.runQuery(pixel).then(async (response) => {
			const pixelOutput = response.pixelReturn[0].output,
				operationType = response.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(pixelOutput as string);
				setLoading(false);
				return;
			}
			toast.success("Successfully added function database to catalog");

			navigate(
				`/engine/function/${(pixelOutput as { database_id: string }).database_id}`,
			);
			setLoading(false);
		});
	};

	useEffect(() => {
		resolvedFields.forEach((f) => {
			let pixel = f.pixel;
			let optionsPixel = f.optionRule?.pixel;

			fieldsToWatch.forEach((name: keyof typeof watch) => {
				const val = watch(name);
				if (watchedFieldRef.current[name] !== null && val) {
					pixel = pixel?.replaceAll(`<${name}>`, val);
					optionsPixel = optionsPixel?.replaceAll(`<${name}>`, val);
				}
			});

			if (pixel && !hasParameterizedValue(pixel)) {
				executeWatchedFieldPixel(f.key, pixel, "value");
			}

			if (optionsPixel && !hasParameterizedValue(optionsPixel)) {
				executeWatchedFieldPixel(f.key, optionsPixel, "options");
			}
		});
	}, []);

	const fieldsToWatch = useMemo(() => {
		const f2w = fields.reduce((acc, f) => {
			if (f.pixel) {
				const matches = f.pixel.match(/<([^>]+)>/g);
				if (matches) {
					acc.push(...matches.map((m) => m.replace(/[<>]/g, "")));
				}
			}
			if (f.options?.pixel) {
				const matches = f.options.pixel.match(/<([^>]+)>/g);
				if (matches) {
					acc.push(...matches.map((m) => m.replace(/[<>]/g, "")));
				}
			}
			return acc;
		}, []);
		return Array.from(new Set(f2w));
	}, [fields]);

	const hasParameterizedValue = (str) => /<([^>]+)>/.test(str);

	const executeWatchedFieldPixel = async (key, pixelStr, type) => {
		const response = await monolithStore.runQuery(pixelStr);
		const output = response.pixelReturn[0].output;
		const operationType = response.pixelReturn[0].operationType;

		if (operationType.includes("ERROR")) {
			toast.error(output as string);
			return;
		}

		if (type === "value") {
			setValue(key, output);
			return;
		}

		if (type === "options") {
			setResolvedFields((prev) =>
				prev.map((f) =>
					f.key === key
						? {
								...f,
								options: (output as unknown[]).map((opt) => ({
									display: opt[f.optionRule.optionDisplay],
									value: opt[f.optionRule.optionValue],
								})),
							}
						: f,
				),
			);
		}
	};

	const validateFormField = async (field, userInput) => {
		if (!field.rules?.custom?.value) return true;
		const pixelToExecute = field.rules.custom.value.replace(
			"[VALUE]",
			userInput.trim(),
		);

		const response = await monolithStore.runQuery(pixelToExecute);
		const output = response.pixelReturn[0].output;
		const operationType = response.pixelReturn[0].operationType;

		if (operationType.includes("ERROR")) {
			toast.error(output as string);
			return false;
		}

		if ((output as { exists: boolean }).exists) {
			setFocus(field.key);
			setIsValidDatabaseName(true);
			return false;
		}
		setIsValidDatabaseName(false);

		return true;
	};

	const checkForDisplayRulesSet = (field, value) => {
		const selectedDefaultField = resolvedFields.find(
			(f) => f.key === field.name,
		);
		if (selectedDefaultField?.displayRules?.hideOtherFields) {
			selectedDefaultField.displayRules.hideOtherFields.forEach((fth) => {
				const optionValue = fth.value;
				setResolvedFields((prev) =>
					prev.map((f) =>
						f.key === fth.key
							? { ...f, hidden: optionValue.includes(value) }
							: f,
					),
				);
			});
		}
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

	const renderControllerField = (val) => (
		<Controller
			key={val.key}
			name={val.key}
			control={control}
			rules={{
				required: val?.required,
				pattern: val.rules?.pattern,
			}}
			render={({ field, fieldState: { error }, formState }) => {
				switch (val.type) {
					case "text":
						return (
							<Field className={val.hidden ? "hidden" : ""}>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
								<Input
									{...field}
									id={val.key}
									disabled={val.disabled}
									data-testid={`function-form-input-${val.key}`}
									onChange={(e) => {
										field.onChange(e);
										if (val.rules?.custom) {
											if (
												debounceTimeoutsRef.current[
													val.key
												]
											) {
												clearTimeout(
													debounceTimeoutsRef.current[
														val.key
													],
												);
											}
											debounceTimeoutsRef.current[
												val.key
											] = setTimeout(async () => {
												const value = e.target.value;
												if (
													!val.rules.pattern.value.test(
														value,
													)
												) {
													return;
												}
												const isValid =
													await validateFormField(
														val,
														value,
													);
												if (!isValid) {
													setError(val.key, {
														message:
															val.rules?.custom
																?.message ||
															"Database name already exists.",
													});
												} else {
													clearErrors(val.key);
												}
											}, 300);
										}
									}}
								/>
								{error ? (
									<FieldDescription className="text-destructive">
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</FieldDescription>
								) : (
									val.helperText && (
										<FieldDescription>
											{val.helperText}
										</FieldDescription>
									)
								)}
							</Field>
						);

					case "password":
						return (
							<Field>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
								<Input
									{...field}
									id={val.key}
									type="password"
									disabled={val.disabled}
									data-testid={`function-form-input-${val.key}`}
									autoComplete="new-password"
								/>
								{error ? (
									<FieldDescription className="text-destructive">
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</FieldDescription>
								) : (
									val.helperText && (
										<FieldDescription>
											{val.helperText}
										</FieldDescription>
									)
								)}
							</Field>
						);

					case "number":
						return (
							<Field className={val.hidden ? "hidden" : ""}>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
								<Input
									{...field}
									id={val.key}
									type="number"
									disabled={val.disabled}
									data-testid={`function-form-input-${val.key}`}
								/>
								{error ? (
									<FieldDescription className="text-destructive">
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</FieldDescription>
								) : (
									val.helperText && (
										<FieldDescription>
											{val.helperText}
										</FieldDescription>
									)
								)}
							</Field>
						);

					case "select":
						return (
							<Field className={val.hidden ? "hidden" : ""}>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
								<Select
									value={field.value || ""}
									onValueChange={(value) => {
										field.onChange(value);
										checkForDisplayRulesSet(field, value);
									}}
									disabled={val.disabled}
								>
									<SelectTrigger
										id={val.key}
										className="w-full"
										data-testid={`function-form-input-${val.key}`}
									>
										<SelectValue
											placeholder={`Select ${val.label}`}
										/>
									</SelectTrigger>
									<SelectContent>
										{(Array.isArray(val?.options)
											? val && Array.isArray(val.options)
												? val.options
												: []
											: []
										).map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
												data-testid={`function-form-option-${val.key}-${opt.value}`}
											>
												{opt.display}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{error ? (
									<FieldDescription className="text-destructive">
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</FieldDescription>
								) : (
									val.helperText && (
										<FieldDescription>
											{val.helperText}
										</FieldDescription>
									)
								)}
							</Field>
						);

					case "radio":
						return (
							<Field className={val.hidden ? "hidden" : ""}>
								<FieldLabel>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
								<RadioGroup
									value={field.value || ""}
									onValueChange={(value) =>
										field.onChange(value)
									}
									className="flex flex-row gap-4"
									data-testid={`function-form-input-${val.key}`}
								>
									{val.options.options.map((opt) => (
										<div
											key={opt.value}
											className="flex items-center gap-2"
										>
											<RadioGroupItem
												value={opt.value}
												id={`${val.key}-${opt.value}`}
												data-testid={`function-form-radio-${val.key}-${opt.value}`}
											/>
											<Label
												htmlFor={`${val.key}-${opt.value}`}
												className="cursor-pointer"
											>
												{opt.display}
											</Label>
										</div>
									))}
								</RadioGroup>
								{error && (
									<FieldDescription className="text-destructive">
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</FieldDescription>
								)}
							</Field>
						);

					case "file-upload":
						return (
							<div
								className="flex flex-col gap-2"
								data-testid={`function-form-field-${val.key}`}
							>
								<P>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</P>
								<div
									className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
									onClick={() =>
										fileInputRefs.current[val.key]?.click()
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
											fileInputRefs.current[val.key] = el;
										}}
										type="file"
										accept={
											val.options?.extensions?.join(
												",",
											) || "*"
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
										disabled={val.disabled}
										data-testid={`function-form-input-${val.key}`}
									/>
									<div className="text-center">
										<P className="font-medium text-foreground">
											Drop your file here or click to
											browse
										</P>
										<P className="text-muted-foreground text-sm">
											{val.options?.extensions
												? `Supports ${val.options.extensions.join(", ")} files`
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
												{field.value.map((file, index) => (
													<div
														key={`${file.name}-${index}`}
														className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 transition-colors hover:bg-accent"
														data-testid={`uploaded-file-item-${index}`}
													>
														<div className="flex min-w-0 flex-1 items-center gap-2">
															<div className="min-w-0 flex-1">
																<P className="truncate text-foreground text-sm">
																	{file.name}
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
															onClick={(e) => {
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
												))}
											</div>
										</div>
									)}

								{error && (
									<P
										className="text-destructive text-sm"
										data-testid={`function-form-error-${val.key}`}
									>
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</P>
								)}
							</div>
						);
					case "checkbox":
						return (
							<div
								className={`flex items-center gap-2 ${val.hidden ? "hidden" : ""}`}
							>
								<Checkbox
									id={val.key}
									checked={field.value ? field.value : false}
									onCheckedChange={(value) =>
										field.onChange(value)
									}
									disabled={val.disabled}
									data-testid={`function-form-input-${val.key}`}
								/>
								<Label
									htmlFor={val.key}
									className="cursor-pointer"
								>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</Label>
								{error && (
									<P
										className="text-destructive text-sm"
										data-testid={`function-form-error-${val.key}`}
									>
										{error.message}
									</P>
								)}
							</div>
						);
					case "tags":
						return (
							<Field className={val.hidden ? "hidden" : ""}>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
								<Textarea
									{...field}
									id={val.key}
									placeholder='Press "Enter" to add tag'
									disabled={val.disabled}
									value={
										Array.isArray(field.value)
											? field.value.join(", ")
											: field.value || ""
									}
									onChange={(e) => {
										const tags = e.target.value
											.split(",")
											.map((tag) => tag.trim())
											.filter((tag) => tag !== "");
										field.onChange(tags);
									}}
									data-testid={`function-form-input-${val.key}`}
								/>
								{error ? (
									<FieldDescription className="text-destructive">
										{error.message ||
											(val.rules?.pattern?.message ??
												val.helperText)}
									</FieldDescription>
								) : (
									val.helperText && (
										<FieldDescription>
											{val.helperText}
										</FieldDescription>
									)
								)}
							</Field>
						);
						case "textarea":
						return (
							<Field className={val.hidden ? "hidden" : ""}>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val?.required && (
										<span className="text-destructive">
											*
										</span>
									)}
								</FieldLabel>
							<TextArea
                                {...field}
                                fullWidth
                                size="small"
                                multiline
                                minRows={4}
                                maxRows={10}
                                label={val.label}
                                disabled={val.disabled}
                                required={val?.required}
                                error={!!error}
                                helperText={getHelperText(error, val)}
                                inputProps={{ "data-testid": `function-form-input-${val.key}` }}
                            />
							</Field>
						);

					default:
						return null;
				}
			}}
		/>
	);
	const getHelperText = (error, val) => {
		if (!error) return val.helperText || "";
		if (error.type === "checkField" && val.rules?.custom?.message) {
			return val.rules.custom.message;
		}
		return error.message;
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} data-testid="function-form">
			<H4 data-testid="function-form-title">{title}</H4>
			<Muted className="mt-1" data-testid="function-form-description">
				{description}
			</Muted>
			<div className="mt-8 mb-8" data-testid="function-form-box">
				<div className="flex flex-col gap-4">
					{Object.keys(grouped).map((category) => (
						<div
							key={category}
							className="mb-4 flex flex-col gap-4"
						>
							<div className="flex items-start gap-4">
								<div className="flex flex-1 flex-col gap-1">
									<H4 data-testId="function-importForm-category-title">
										{category}
									</H4>
									<Muted data-testId="model-importForm-category-description">
										{categoryDescriptions[category] ??
											"No description available."}
									</Muted>
								</div>
								<div className="flex flex-[2] flex-col gap-2">
									{grouped[category].map((f) =>
										renderControllerField(f),
									)}
								</div>
							</div>
							<Separator />
						</div>
					))}
					{advancedFields?.length ? (
						<div className="mt-4">
							<Collapsible
								open={openAdvanced}
								onOpenChange={setOpenAdvanced}
							>
								<div className="flex flex-row items-center justify-between py-2">
									<H4 data-testid="function-form-advanced-header">
										ADVANCED SETTINGS
									</H4>
									<CollapsibleTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											data-testid="function-form-advanced-toggle"
										>
											{openAdvanced ? (
												<ChevronUp className="size-4" />
											) : (
												<ChevronDown className="size-4" />
											)}
										</Button>
									</CollapsibleTrigger>
								</div>
								<CollapsibleContent>
									<div className="mb-4 flex flex-col gap-4">
										<div className="flex items-start gap-4">
											<div className="flex flex-1 flex-col gap-1">
												<Muted>
													Add advanced settings here
												</Muted>
											</div>
											<div className="flex flex-[2] flex-col gap-2">
												{advancedFields.map((val) => (
													<div
														key={val.key}
														data-testid={`function-form-field-${val.key}`}
													>
														{renderControllerField(
															val,
														)}
													</div>
												))}
											</div>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					) : null}
				</div>

				<div
					className="mt-8 flex justify-end gap-2"
					data-testid="function-form-actions"
				>
					<Button
						type="submit"
						variant="default"
						data-testid="function-form-submit"
						disabled={!formState.isValid || isValidDatabaseName}
						className="min-w-[128px] capitalize"
					>
						Connect
					</Button>
				</div>
			</div>
		</form>
	);
};
