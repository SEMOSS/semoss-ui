/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */
// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { ChevronDown, ChevronUp, Info, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Form,
	FormField,
	FormFileDropzone,
	H4,
	Input,
	Label,
	Muted,
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
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { EngineFormHeader } from "../shared/engine-form-header";
import type { FormField as FormFieldConfig } from "../shared/import-form.types";
import { computeVisibility } from "../shared/import-form.utils";

// Builds a per-field zod schema from the dynamic field config driving this form.
type FunctionFormFieldConfig = {
	key: string;
	type: string;
	label?: string;
	required?: boolean;
	value?: unknown;
	// the same rule shape computeVisibility reads, for a field that only applies
	// to one answer of another field
	showWhen?: FormFieldConfig["showWhen"];
	rules?: { pattern?: { value: RegExp; message?: string } };
};

const buildFieldSchema = (field: FunctionFormFieldConfig) => {
	switch (field.type) {
		case "checkbox":
			return z.boolean().optional();
		case "parameter-list":
			return z.array(
				z.object({
					parameterName: z.string().optional(),
					parameterType: z.string().optional(),
					parameterDescription: z.string().optional(),
				}),
			);
		case "string-list":
			return z.array(z.string());
		case "file-upload": {
			const file = z.instanceof(File, {
				message: `${field.label ?? "A file"} is required`,
			});
			return requiredNow(field) ? file : file.optional().nullable();
		}
		default: {
			let stringSchema = z.string();
			if (field.rules?.pattern) {
				stringSchema = stringSchema.regex(
					field.rules.pattern.value,
					field.rules.pattern.message ?? "Invalid value",
				);
			}
			return requiredNow(field)
				? stringSchema.min(
						1,
						`${field.label ?? "This field"} is required`,
					)
				: stringSchema.optional();
		}
	}
};

/**
 * Whether the schema itself can hold a field to being required.
 *
 * A field that only shows under a condition cannot be, because the schema is
 * built once and the condition is answered per keystroke. Those are enforced in
 * the refinement below instead, where the rest of the values are in hand.
 */
const requiredNow = (field: FunctionFormFieldConfig) =>
	field.required && !field.showWhen;

/** The value a field starts at, and goes back to when it stops applying. */
const defaultValueFor = (field: FunctionFormFieldConfig) => {
	if (field.type === "parameter-list" || field.type === "string-list") {
		return Array.isArray(field.value) ? field.value : [];
	}
	if (field.type === "file-upload") {
		return field.value instanceof File ? field.value : null;
	}
	if (field.type === "checkbox") {
		return typeof field.value === "boolean" ? field.value : false;
	}
	return field.value || "";
};

const buildFunctionFormSchema = (allFields: FunctionFormFieldConfig[]) =>
	z
		.object(
			allFields.reduce<
				Record<string, ReturnType<typeof buildFieldSchema>>
			>((acc, field) => {
				acc[field.key] = buildFieldSchema(field);
				return acc;
			}, {}),
		)
		.superRefine((values, ctx) => {
			// a conditional field is required only while it is on screen. without
			// this the hidden half of a choice - the SMTP settings when a mail
			// engine is sending through Graph, say - holds the form invalid and
			// there is nothing the user can do about it, because the input that
			// would satisfy it is not rendered
			for (const field of allFields) {
				if (!field.required || !field.showWhen) {
					continue;
				}
				if (!computeVisibility(field as FormFieldConfig, values)) {
					continue;
				}
				const value = values[field.key];
				const empty =
					value === undefined ||
					value === null ||
					value === "" ||
					(Array.isArray(value) && value.length === 0);
				if (empty) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [field.key],
						message: `${field.label ?? "This field"} is required`,
					});
				}
			}
		});

export const FunctionForm = ({
	title,
	description,
	notice,
	icon,
	fields,
	advanced,
	categoryDescription,
}: {
	title: string;
	description: string;
	notice?: string;
	icon?: string;
	fields;
	advanced;
	categoryDescription;
}) => {
	const [openAdvanced, setOpenAdvanced] = useState(false);
	const [resolvedFields, setResolvedFields] = useState(fields);
	const [isValidDatabaseName, setIsValidDatabaseName] =
		useState<boolean>(false);
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});

	const allFormFields = useMemo(
		() => [...fields, ...(advanced ?? [])],
		[fields, advanced],
	);
	const functionFormSchema = useMemo(
		() => buildFunctionFormSchema(allFormFields),
		[allFormFields],
	);

	const form = useForm({
		resolver: zodResolver(functionFormSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: allFormFields.reduce((acc, f) => {
			acc[f.key] = defaultValueFor(f);
			return acc;
		}, {}),
	});

	const watchedFieldRef = useRef({});
	// every value, so a field that only applies to one choice can say so with
	// showWhen. without this the rules are evaluated against nothing and a
	// conditional field never appears
	const watchedValues = form.watch();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		// a field that has stopped applying goes back to its default, so switching
		// a choice does not carry the other branch's values into the engine, and
		// does not leave an error on an input nobody can see
		for (const field of allFormFields) {
			if (
				!field.showWhen ||
				computeVisibility(field as FormFieldConfig, watchedValues)
			) {
				continue;
			}
			const fallback = defaultValueFor(field);
			const current = form.getValues(field.key);
			if (JSON.stringify(current) !== JSON.stringify(fallback)) {
				form.setValue(field.key, fallback, {
					shouldDirty: false,
					shouldValidate: false,
				});
				form.clearErrors(field.key);
			}
		}
	}, [watchedValues, allFormFields]);
	const { monolithStore, configStore } = useRootStore();
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;

	//  Group fields by category
	const grouped = defaultFields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	// The field shape is fully dynamic (driven by the `fields`/`advanced` props),
	// so the zod-inferred type can't narrow per key; treat values loosely here.
	const handleSubmit = async (formData) => {
		const { FILE, ...newFormData } = formData;

		// Structured list fields are kept as arrays in form state for the UI,
		// but the backend reads them as JSON strings via Gson on the SMSS prop.
		(fields as Array<{ key: string; type: string }>).forEach((f) => {
			if (f.type === "parameter-list" || f.type === "string-list") {
				const value = newFormData[f.key];
				if (Array.isArray(value)) {
					newFormData[f.key] =
						value.length === 0 ? "" : JSON.stringify(value);
				}
			}
		});

		const createReactor =
			newFormData.FUNCTION_TYPE === "LOCAL_PYTHON"
				? "CreatePythonFunctionEngine"
				: "CreateFunctionEngine";
		let pixel = `${createReactor}(function=["${
			formData.NAME
		}"],functionDetails=[${JSON.stringify(newFormData)}]);`;
		if (FILE) {
			try {
				const uploadedFiles = await uploadFile(
					[FILE],
					configStore.store.insightID,
				);

				if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
					toast.error("Upload failed or returned invalid response.");
					return;
				}
				pixel = pixel.replace(
					");",
					`,filePaths=["${uploadedFiles[0].fileLocation}"]);`,
				);
			} catch {
				toast.error("Upload failed or returned invalid response.");
				return;
			}
		}

		const response = await monolithStore.runQuery(pixel);
		const pixelOutput = response.pixelReturn[0].output;
		const operationType = response.pixelReturn[0].operationType;

		if (operationType.indexOf("ERROR") > -1) {
			toast.error(pixelOutput as string);
			return;
		}
		toast.success("Successfully added function database to catalog");

		// engine_id is the current key; database_id is the legacy fallback
		const o = pixelOutput as {
			engine_id?: string;
			database_id?: string;
		};
		navigate(`/function/${o.engine_id || o.database_id}`);
	};

	useEffect(() => {
		resolvedFields.forEach((f) => {
			let pixel = f.pixel;
			let optionsPixel = f.optionRule?.pixel;

			fieldsToWatch.forEach((name: string) => {
				const val = form.watch(name);
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
			form.setValue(key, output);
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
			form.setFocus(field.key);
			setIsValidDatabaseName(true);
			return false;
		}
		setIsValidDatabaseName(false);

		return true;
	};

	const renderControllerField = (val) => {
		if (val.type === "file-upload") {
			return (
				<FormFileDropzone
					key={val.key}
					name={val.key}
					label={
						<>
							{val.label}
							{val.required && (
								<span className="text-destructive"> *</span>
							)}
						</>
					}
					description={
						val.options?.extensions
							? `Supports ${val.options.extensions.join(", ")} files`
							: "Drop your file here or click to browse"
					}
					extensions={val.options?.extensions}
					disabled={val.disabled}
					className={
						computeVisibility(val, watchedValues) ? "" : "hidden"
					}
					data-testid={`function-form-input-${val.key}`}
				/>
			);
		}

		return (
			<FormField
				key={val.key}
				name={val.key}
				control={form.control}
				render={({ field, fieldState: { error } }) => {
					switch (val.type) {
						case "text":
							return (
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
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
														debounceTimeoutsRef
															.current[val.key],
													);
												}
												debounceTimeoutsRef.current[
													val.key
												] = setTimeout(async () => {
													const value =
														e.target.value;
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
														form.setError(val.key, {
															message:
																val.rules
																	?.custom
																	?.message ||
																"Database name already exists.",
														});
													} else {
														form.clearErrors(
															val.key,
														);
													}
												}, 300);
											}
										}}
									/>
									{error ? (
										<FieldError>{error.message}</FieldError>
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
										<FieldError>{error.message}</FieldError>
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
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
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
										<FieldError>{error.message}</FieldError>
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
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
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
												? val &&
													Array.isArray(val.options)
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
										<FieldError>{error.message}</FieldError>
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
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
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
										className="flex flex-wrap gap-4"
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
										<FieldError>{error.message}</FieldError>
									)}
								</Field>
							);

						case "checkbox":
							return (
								<div
									className={
										computeVisibility(val, watchedValues)
											? "flex items-center gap-2"
											: "hidden"
									}
								>
									<Checkbox
										id={val.key}
										checked={
											field.value ? field.value : false
										}
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
										<FieldError>{error.message}</FieldError>
									)}
								</div>
							);
						case "tags":
							return (
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
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
										<FieldError>{error.message}</FieldError>
									) : (
										val.helperText && (
											<FieldDescription>
												{val.helperText}
											</FieldDescription>
										)
									)}
								</Field>
							);

						case "parameter-list": {
							const rows: Array<{
								parameterName?: string;
								parameterType?: string;
								parameterDescription?: string;
							}> = Array.isArray(field.value) ? field.value : [];
							const updateRow = (
								idx: number,
								patch: Record<string, string>,
							) => {
								const next = rows.map((r, i) =>
									i === idx ? { ...r, ...patch } : r,
								);
								field.onChange(next);
							};
							return (
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
									<FieldLabel>
										{val.label}
										{val?.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<div
										className="flex flex-col gap-2"
										data-testid={`function-form-input-${val.key}`}
									>
										{rows.length === 0 && (
											<Muted className="text-sm">
												No parameters defined.
											</Muted>
										)}
										{rows.map((row, idx) => (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
												key={idx}
												className="flex flex-col gap-2 rounded-md border border-input p-2 sm:flex-row sm:items-start"
											>
												<Input
													className="flex-1"
													placeholder="Name"
													value={
														row.parameterName ?? ""
													}
													disabled={val.disabled}
													onChange={(e) =>
														updateRow(idx, {
															parameterName:
																e.target.value,
														})
													}
													data-testid={`function-form-input-${val.key}-name-${idx}`}
												/>
												<Select
													value={
														row.parameterType ||
														"string"
													}
													onValueChange={(v) =>
														updateRow(idx, {
															parameterType: v,
														})
													}
													disabled={val.disabled}
												>
													<SelectTrigger
														className="w-full sm:w-32"
														data-testid={`function-form-input-${val.key}-type-${idx}`}
													>
														<SelectValue placeholder="Type" />
													</SelectTrigger>
													<SelectContent>
														{[
															"string",
															"number",
															"integer",
															"boolean",
															"object",
															"array",
														].map((t) => (
															<SelectItem
																key={t}
																value={t}
															>
																{t}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Input
													className="flex-1"
													placeholder="Description"
													value={
														row.parameterDescription ??
														""
													}
													disabled={val.disabled}
													onChange={(e) =>
														updateRow(idx, {
															parameterDescription:
																e.target.value,
														})
													}
													data-testid={`function-form-input-${val.key}-desc-${idx}`}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													disabled={val.disabled}
													onClick={() =>
														field.onChange(
															rows.filter(
																(_, i) =>
																	i !== idx,
															),
														)
													}
													data-testid={`function-form-remove-${val.key}-${idx}`}
												>
													<X className="size-4" />
												</Button>
											</div>
										))}
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="self-start"
											disabled={val.disabled}
											onClick={() =>
												field.onChange([
													...rows,
													{
														parameterName: "",
														parameterType: "string",
														parameterDescription:
															"",
													},
												])
											}
											data-testid={`function-form-add-${val.key}`}
										>
											+ Add parameter
										</Button>
									</div>
									{error ? (
										<FieldError>
											{error.message ?? val.helperText}
										</FieldError>
									) : (
										val.helperText && (
											<FieldDescription>
												{val.helperText}
											</FieldDescription>
										)
									)}
								</Field>
							);
						}
						case "string-list": {
							const items: string[] = Array.isArray(field.value)
								? field.value
								: [];
							return (
								<Field
									className={
										computeVisibility(val, watchedValues)
											? ""
											: "hidden"
									}
								>
									<FieldLabel>
										{val.label}
										{val?.required && (
											<span className="text-destructive">
												*
											</span>
										)}
									</FieldLabel>
									<div
										className="flex flex-col gap-2"
										data-testid={`function-form-input-${val.key}`}
									>
										{items.length === 0 && (
											<Muted className="text-sm">
												No values defined.
											</Muted>
										)}
										{items.map((item, idx) => (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
												key={idx}
												className="flex items-start gap-2"
											>
												<Input
													className="flex-1"
													placeholder={
														val.placeholder ??
														"Parameter name"
													}
													value={item ?? ""}
													disabled={val.disabled}
													onChange={(e) => {
														const next = items.map(
															(s, i) =>
																i === idx
																	? e.target
																			.value
																	: s,
														);
														field.onChange(next);
													}}
													data-testid={`function-form-input-${val.key}-${idx}`}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													disabled={val.disabled}
													onClick={() =>
														field.onChange(
															items.filter(
																(_, i) =>
																	i !== idx,
															),
														)
													}
													data-testid={`function-form-remove-${val.key}-${idx}`}
												>
													<X className="size-4" />
												</Button>
											</div>
										))}
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="self-start"
											disabled={val.disabled}
											onClick={() =>
												field.onChange([...items, ""])
											}
											data-testid={`function-form-add-${val.key}`}
										>
											+ Add
										</Button>
									</div>
									{error ? (
										<FieldError>
											{error.message ?? val.helperText}
										</FieldError>
									) : (
										val.helperText && (
											<FieldDescription>
												{val.helperText}
											</FieldDescription>
										)
									)}
								</Field>
							);
						}
						default:
							return null;
					}
				}}
			/>
		);
	};

	if (form.formState.isSubmitting) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<Form form={form} onSubmit={handleSubmit} data-testid="function-form">
			<EngineFormHeader
				testIdPrefix="function"
				icon={icon}
				title={title}
				description={description}
			/>
			{notice && (
				<Alert className="mt-4" data-testid="function-form-notice">
					<Info />
					<AlertDescription>{notice}</AlertDescription>
				</Alert>
			)}
			<div className="mt-8 mb-8" data-testid="function-form-box">
				<div className="flex flex-col gap-4">
					{Object.keys(grouped).map((category) => (
						<div
							key={category}
							className="mb-4 flex flex-col gap-4"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
								<div className="flex flex-1 flex-col gap-1">
									<H4
										className="font-semibold text-base tracking-tight"
										data-testid="function-importForm-category-title"
									>
										{category}
									</H4>
									<Muted
										className="text-muted-foreground text-sm leading-6"
										data-testid="model-importForm-category-description"
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
								<div className="flex flex-row items-center justify-between gap-2 py-2">
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
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
											<div className="flex flex-1 flex-col gap-1">
												<Muted>
													Add advanced settings here
												</Muted>
											</div>
											<div className="flex flex-2 flex-col gap-2">
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
					className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end"
					data-testid="function-form-actions"
				>
					<Button
						type="submit"
						variant="default"
						data-testid="function-form-submit"
						disabled={
							!form.formState.isValid || isValidDatabaseName
						}
						className="w-full min-w-32 capitalize sm:w-auto"
					>
						Connect
					</Button>
				</div>
			</div>
		</Form>
	);
};
