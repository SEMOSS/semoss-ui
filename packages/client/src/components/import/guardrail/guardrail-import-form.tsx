/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */
// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
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
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

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

export const GuardrailForm = ({
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
	const [initScriptCallback, setInitScriptCallback] = useState(null);
	const [updateFieldName, setUpdateFieldName] = useState("");
	const [isDynamicInputChangedByUser, setIsDynamicInputChangedByUser] =
		useState(false);

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		setFocus,
		formState,
		getValues,
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
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;
	const [loading, setLoading] = useState(false);
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	//  Group fields by category
	const grouped = defaultFields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	const dynamicFieldsToWatch = useMemo(() => {
		const f2w = [];
		for (const f of fields) {
			if (f.updateValueFieldsToWatch?.length) {
				f.updateValueFieldsToWatch.forEach((f) => {
					f2w.push(f);
				});
			}
		}
		return f2w;
	}, []);

	const fieldsToWatch = useMemo(() => {
		const f2w = [];
		for (const f of fields) {
			if (f.pixel) {
				const pixelParams = f.pixel.match(/<([^>]+)>/g);
				if (pixelParams) {
					pixelParams.forEach((p) => {
						const strippedVal = p.replace(/[<>]/g, "");
						f2w.push(strippedVal);
					});
				}
			}
			if (f.options?.pixel) {
				const pixelParams = f.options.pixel.match(/<([^>]+)>/g);
				if (pixelParams) {
					pixelParams.forEach((p) => {
						const strippedVal = p.replace(/[<>]/g, "");
						f2w.push(strippedVal);
					});
				}
			}
		}
		return f2w;
	}, []);
	/**
	 * Anytime watched input fields defined in constants changes trigger this
	 * Checks to see that update callback has been loaded
	 * Creates params object with all watched input field names and current values
	 * Passes params object to update callback from import.constants.ts
	 * Removes whitespace from new init script string
	 * Updates init script field value
	 */
	useEffect(() => {
		if (!initScriptCallback) return;
		if (isDynamicInputChangedByUser) return;

		const mappedValuesObject = dynamicFieldsToWatch.reduce(
			(acc, fieldName) => {
				acc[fieldName] = getValues(fieldName);
				return acc;
			},
			{},
		);

		const newInitScript = initScriptCallback(mappedValuesObject);
		const newInitScriptSpacesTrimmed = newInitScript.replace(/\s+/g, " ");
		setValue(updateFieldName, newInitScriptSpacesTrimmed);

		// additionally run this after update callback is initially loaded to populate script field
	}, [
		...dynamicFieldsToWatch.map((field) => watch(field)),
		initScriptCallback,
	]);

	/**
	 * On init load of default values iterate and look for updateCallback
	 * If it is present set it in useState var along with field name to be updated
	 * May be combinable with another useEffect
	 */
	useEffect(() => {
		defaultFields.forEach((val, _i) => {
			if (val.updateCallback) {
				setUpdateFieldName(val.fieldName);
				setInitScriptCallback(
					() =>
						(...args) =>
							val.updateCallback(...args),
				);
			}
		});
	}, [defaultFields]);

	const setNewWatchedFieldReferences = () => {
		fieldsToWatch.forEach((fieldName) => {
			const val = watch(fieldName);

			watchedFieldRef.current[fieldName] = val;
		});
	};

	const onFormSubmit = async (formData) => {
		setLoading(true);
		const pixel = `CreateGuardrailEngine(guardrail=["${
			formData.MODEL_NAME
		}"],guardrailDetails=[${JSON.stringify(formData)}])`;

		monolithStore.runQuery(pixel).then(async (response) => {
			const pixelOutput = response.pixelReturn[0].output,
				operationType = response.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(pixelOutput as string);
				setLoading(false);
				return;
			}
			toast.success("Successfully added new guardrail to catalog");
			{
				// engine_id is the current key; database_id is the legacy fallback
				const o = pixelOutput as {
					engine_id?: string;
					database_id?: string;
				};
				navigate(`/engine/guardrail/${o.engine_id || o.database_id}`);
			}
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

	/**
	 * Anytime a watched field changes trigger this
	 * to call the reactor that dependsOn that field
	 */
	useEffect(() => {
		// console.warn('WATCHED FIELD CHANGED');
		const destructuredFieldRefs = Object.entries(watchedFieldRef.current);

		if (!destructuredFieldRefs.length) {
			setNewWatchedFieldReferences();
			return;
		} else {
			// 1. Loop through default fields
			defaultFields.forEach((f) => {
				checkFieldParamsAndExecutePixel(f);
			});

			// 2. Loop through advanced fields
			advancedFields.forEach((f) => {
				checkFieldParamsAndExecutePixel(f);
			});

			// 3. Set Reference of fields for next useEffect so we only call pixels that are affected
			setNewWatchedFieldReferences();
		}
	}, [...fieldsToWatch.map((field) => watch(field))]);

	const checkFieldParamsAndExecutePixel = (f) => {
		let pixel = f.pixel;
		let optionsPixel = f.options.pixel;

		if (pixel) {
			if (hasParameterizedValue(pixel)) {
				let pixelParamChanged = false;
				fieldsToWatch.forEach((fieldName) => {
					const val = watch(fieldName);
					if (
						watchedFieldRef.current[fieldName] !== undefined &&
						val
					) {
						// A watched value changed from what it was before
						if (val !== watchedFieldRef.current[fieldName]) {
							pixelParamChanged = true;
						}
						pixel = pixel.replaceAll(`<${fieldName}>`, val);
					}
				});

				// Execute pixel if dependency changed and there aren't any params in string
				if (!hasParameterizedValue(pixel) && pixelParamChanged) {
					executeWatchedFieldPixel(f.fieldName, pixel, "value");
				}
			}
		}

		if (optionsPixel) {
			if (hasParameterizedValue(optionsPixel)) {
				let pixelParamChanged = false;
				fieldsToWatch.forEach((fieldName) => {
					const val = watch(fieldName);
					if (
						watchedFieldRef.current[fieldName] !== undefined &&
						val
					) {
						// A watched value changed from what it was before
						if (val !== watchedFieldRef.current[fieldName]) {
							pixelParamChanged = true;
						}
						optionsPixel = optionsPixel.replaceAll(
							`<${fieldName}>`,
							val,
						);
					}
				});

				// Execute pixel if dependency changed and there aren't any params in string
				if (!hasParameterizedValue(optionsPixel) && pixelParamChanged) {
					executeWatchedFieldPixel(
						f.fieldName,
						optionsPixel,
						"options",
					);
				}
			}
		}
	};

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
								options: (
									output as Array<Record<string, unknown>>
								).map((opt) => ({
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
		if (!field.rules?.custom_rules?.value) return true;
		const pixelToExecute = field.rules.custom_rules.value.replace(
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

		if ((output as { exists?: boolean }).exists) {
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

	/**
	 * This runs on input changes to check if the user has changed a dynamically updated field manually
	 * It sets a flag that will stop dynamic update from running if the user has manually changed it
	 * Allows the user to manually change the field back to re-enable dynamic updates
	 */

	// biome-ignore lint/correctness/noUnusedVariables: TODO - fix this
	const checkForDynamicFieldChange = () => {
		// check to see if this form has a dynamically updated field
		if (updateFieldName && initScriptCallback && dynamicFieldsToWatch) {
			// setTimeout sets this to occur after field values are updated
			setTimeout(() => {
				// get values from all dynamic fields
				const mappedValuesObject = dynamicFieldsToWatch.reduce(
					(acc, fieldName) => {
						acc[fieldName] = getValues(fieldName);
						return acc;
					},
					{},
				);

				// check if current value of initScript field matches what updateCallback would return
				// if they do not match the user changed the initScript manually
				const initScriptValueFromCallback = initScriptCallback(
					mappedValuesObject,
				).replace(/\s+/g, " ");
				const initScriptValueFromTextField = getValues(updateFieldName);

				// if they do match the user has not changed the initScript or they manually changed it back
				// this allows them to re-enable the dynamic updateScript behavior if they revert the field value manually
				const isMatched =
					initScriptValueFromCallback ===
					initScriptValueFromTextField;
				setIsDynamicInputChangedByUser(!isMatched);
			}, 0);
		}
	};

	// Helper functions for file upload (matching database-form.tsx)
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
			}}
			render={({ field, fieldState: { error } }) => {
				switch (val.component) {
					case "text":
						return (
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</FieldLabel>
								<Input
									{...field}
									id={val.key}
									disabled={val.disabled}
									data-testid={`guardrail-form-input-${val.key}`}
									onChange={(e) => {
										field.onChange(e);
										if (val.rules?.custom_rules) {
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
												if (value === "") {
													setError(val.key, {});
													return;
												}
												if (
													!val.rules.pattern.value.test(
														value,
													)
												) {
													setError(val.key, {
														message:
															val.rules.pattern
																.message ||
															"Invalid characters in input.",
													});
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
															val.rules
																?.custom_rules
																?.message ||
															"Invalid value.",
													});
												} else {
													clearErrors(val.key);
												}
											}, 300);
										}
									}}
								/>
								{error && (
									<FieldDescription className="text-destructive">
										{getHelperText(error, val)}
									</FieldDescription>
								)}
								{!error && val.helperText && (
									<FieldDescription>
										{val.helperText}
									</FieldDescription>
								)}
							</Field>
						);

					case "password":
						return (
							<Field
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</FieldLabel>
								<Input
									{...field}
									id={val.key}
									type="password"
									disabled={val.disabled}
									data-testid={`guardrail-form-input-${val.key}`}
								/>
								{error && (
									<FieldDescription className="text-destructive">
										{getHelperText(error, val)}
									</FieldDescription>
								)}
								{!error && val.helperText && (
									<FieldDescription>
										{val.helperText}
									</FieldDescription>
								)}
							</Field>
						);

					case "number":
						return (
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</FieldLabel>
								<Input
									{...field}
									id={val.key}
									type="number"
									disabled={val.disabled}
									data-testid={`guardrail-form-input-${val.key}`}
								/>
								{error && (
									<FieldDescription className="text-destructive">
										{getHelperText(error, val)}
									</FieldDescription>
								)}
								{!error && val.helperText && (
									<FieldDescription>
										{val.helperText}
									</FieldDescription>
								)}
							</Field>
						);

					case "select":
						return (
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</FieldLabel>
								<Select
									value={field.value}
									onValueChange={(value) => {
										field.onChange(value);
										checkForDisplayRulesSet(field, value);
									}}
									disabled={val.disabled}
								>
									<SelectTrigger
										id={val.key}
										className="w-full"
										data-testid={`guardrail-form-input-${val.key}`}
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
												data-testid={`guardrail-form-option-${val.key}-${opt.value}`}
											>
												{opt.display}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{error && (
									<FieldDescription className="text-destructive">
										{getHelperText(error, val)}
									</FieldDescription>
								)}
								{!error && val.helperText && (
									<FieldDescription>
										{val.helperText}
									</FieldDescription>
								)}
							</Field>
						);

					case "radio":
						return (
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<FieldLabel>{val.label}</FieldLabel>
								<RadioGroup
									value={field.value || ""}
									onValueChange={field.onChange}
									className="flex flex-wrap gap-4"
									data-testid={`guardrail-form-input-${val.key}`}
								>
									{val.options.options.map((opt) => (
										<div
											key={opt.value}
											className="flex items-center gap-2"
										>
											<RadioGroupItem
												value={opt.value}
												id={`${val.key}-${opt.value}`}
												data-testid={`guardrail-form-radio-${val.key}-${opt.value}`}
											/>
											<Label
												htmlFor={`${val.key}-${opt.value}`}
												className="cursor-pointer font-normal"
											>
												{opt.display}
											</Label>
										</div>
									))}
								</RadioGroup>
								{error && (
									<FieldDescription className="text-destructive">
										{getHelperText(error, val)}
									</FieldDescription>
								)}
							</Field>
						);

					case "file-upload":
						return (
							<div
								className="flex flex-col gap-2"
								data-testid={`guardrail-form-field-${val.key}`}
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
										data-testid={`guardrail-form-input-${val.key}`}
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
																className="size-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
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
										data-testid={`guardrail-form-error-${val.key}`}
									>
										{getHelperText(error, val)}
									</P>
								)}
							</div>
						);

					case "checkbox":
						return (
							<div
								className={
									val.hidden
										? "hidden"
										: "flex flex-row items-center gap-2"
								}
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<Checkbox
									id={val.key}
									checked={field.value || false}
									onCheckedChange={field.onChange}
									disabled={val.disabled}
									data-testid={`guardrail-form-input-${val.key}`}
								/>
								<Label
									htmlFor={val.key}
									className="cursor-pointer font-normal"
								>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</Label>
								{error && (
									<P
										className="text-destructive text-sm"
										data-testid={`guardrail-form-error-${val.key}`}
									>
										{error.message}
									</P>
								)}
							</div>
						);

					case "tags":
						return (
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`guardrail-form-field-${val.key}`}
							>
								<FieldLabel htmlFor={val.key}>
									{val.label}
									{val.required && (
										<span className="text-destructive">
											{" "}
											*
										</span>
									)}
								</FieldLabel>
								<Input
									id={val.key}
									placeholder='Press "Enter" to add tag'
									disabled={val.disabled}
									data-testid={`guardrail-form-input-${val.key}`}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											const value =
												e.currentTarget.value.trim();
											if (value) {
												const currentTags =
													field.value || [];
												field.onChange([
													...currentTags,
													value,
												]);
												e.currentTarget.value = "";
											}
										}
									}}
								/>
								{field.value && field.value?.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{(() => {
											const tagCounts = new Map<
												string,
												number
											>();
											return field.value.map(
												(tag, index) => {
													const nextCount =
														(tagCounts.get(tag) ??
															0) + 1;
													tagCounts.set(
														tag,
														nextCount,
													);
													return (
														<span
															key={`${tag}-${nextCount}`}
															className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
														>
															{tag}
															<button
																type="button"
																onClick={() => {
																	const newTags =
																		field.value.filter(
																			(
																				_,
																				i,
																			) =>
																				i !==
																				index,
																		);
																	field.onChange(
																		newTags,
																	);
																}}
																className="text-muted-foreground hover:text-foreground"
															>
																×
															</button>
														</span>
													);
												},
											);
										})()}
									</div>
								)}
								{error && (
									<FieldDescription className="text-destructive">
										{getHelperText(error, val)}
									</FieldDescription>
								)}
								{!error && val.helperText && (
									<FieldDescription>
										{val.helperText}
									</FieldDescription>
								)}
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
		if (error.type === "checkField" && val.rules?.custom_rules?.message) {
			return val.rules.custom_rules.message;
		}
		return error.message;
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<P>Loading...</P>
				</div>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit(onFormSubmit)}
			data-testid="guardrail-form"
			className="my-4"
		>
			<div className="mb-6">
				<H4 data-testid="guardrail-form-title">{title}</H4>
				<Muted
					className="mt-1 text-base"
					data-testid="guardrail-form-description"
				>
					{description}
				</Muted>
			</div>

			<div className="mt-4 mb-8" data-testid="guardrail-form-box">
				<div className="flex flex-col gap-4">
					{Object.keys(grouped).map((category) => (
						<div
							key={category}
							className="mb-4 flex flex-col gap-4"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
								<div className="flex flex-1 flex-col gap-1">
									<H4 data-testId="guardrail-importForm-category-title">
										{category}
									</H4>
									<Muted
										data-testId="model-importForm-category-description"
										className="text-base"
									>
										{categoryDescriptions[category] ??
											"No description available."}
									</Muted>
								</div>
								<div className="flex flex-2 flex-col gap-2">
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
								<div className="flex w-full items-center justify-between py-4">
									<H4 data-testid="guardrail-form-advanced-header">
										ADVANCED SETTINGS
									</H4>
									<CollapsibleTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											data-testid="guardrail-form-advanced-toggle"
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
									{advancedFields?.map((val) => (
										<div
											key={val.key}
											data-testid={`guardrail-form-field-${val.key}`}
										>
											{renderControllerField(val)}
										</div>
									))}
								</CollapsibleContent>
							</Collapsible>
						</div>
					) : null}
				</div>

				<div
					className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"
					data-testid="guardrail-form-actions"
				>
					<Button
						type="submit"
						data-testid="guardrail-form-submit"
						disabled={!formState.isValid || isValidDatabaseName}
						className="w-full min-w-32 capitalize sm:w-auto"
					>
						Connect
					</Button>
				</div>
			</div>
		</form>
	);
};
