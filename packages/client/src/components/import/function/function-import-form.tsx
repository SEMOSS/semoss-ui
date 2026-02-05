import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FileDropzone } from "@semoss/ui";
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
		let pixel = `CreateRestFunctionEngine(function=["${
			formData.NAME
		}"],functionDetails=[${JSON.stringify(newFormData)}]);`;
		if (FILE !== "") {
			try {
				const uploadedFiles = await uploadFile(
					[FILE.name],
					configStore.store.insightID,
				);

				if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
					toast.error("Upload failed or returned invalid response.");
					setLoading(false);
					return;
				}
				pixel = pixel.replace(
					");",
					`,filePaths=["${FILE.name}"]` + ");",
				);
			} catch {
				toast.error("Upload failed or returned invalid response.");
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
							<div className="flex flex-col gap-2">
								<P data-testid="function-zip-upload-title">
									{val.label}
								</P>
								<FileDropzone
									multiple={false}
									value={field.value as File | File[]}
									disabled={val.disabled}
									extensions={val.options?.extensions || []}
									onChange={(newValues) => {
										const files = newValues as
											| File
											| File[];
										field.onChange(files);
									}}
									data-testid={`function-form-input-${val.key}`}
								/>
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

					default:
						return null;
				}
			}}
		/>
	);

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
