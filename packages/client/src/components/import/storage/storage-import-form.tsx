import { ChevronDown, ChevronUp } from "lucide-react";
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

export const StorageForm = ({
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
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;
	const [loading, setLoading] = useState(false);
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});

	const grouped = defaultFields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	const onFormSubmit = async (formData) => {
		setLoading(true);
		const pixel = `CreateStorageEngine(storage=["${formData.NAME}"],storageDetails=[${JSON.stringify(formData)}])`;

		monolithStore.runQuery(pixel).then(async (response) => {
			const pixelOutput = response.pixelReturn[0].output,
				operationType = response.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(pixelOutput as string);
				setLoading(false);
				return;
			}
			toast.success(`Successfully added new storage to catalog`);
			navigate(`/engine/storage/${pixelOutput.database_id}`);
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
								options: (Array.isArray(output) ? output : []).map((opt) => ({
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

		if (output.exists) {
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
			render={({ field, fieldState: { error } }) => {
				switch (val.component) {
					case "text":
						return (
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`storage-form-field-${val.key}`}
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
									autoComplete="off"
									data-testid={`storage-form-input-${val.key}`}
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
								data-testid={`storage-form-field-${val.key}`}
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
									autoComplete="new-password"
									data-testid={`storage-form-input-${val.key}`}
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
								data-testid={`storage-form-field-${val.key}`}
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
									autoComplete="off"
									data-testid={`storage-form-input-${val.key}`}
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
								data-testid={`storage-form-field-${val.key}`}
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
										data-testid={`storage-form-input-${val.key}`}
									>
										<SelectValue
											placeholder={`Select ${val.label}`}
										/>
									</SelectTrigger>
									<SelectContent>
										{(Array.isArray(val?.options)
											? val.options
											: []
										).map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
												data-testid={`storage-form-option-${val.key}-${opt.value}`}
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
								data-testid={`storage-form-field-${val.key}`}
							>
								<FieldLabel>{val.label}</FieldLabel>
								<RadioGroup
									value={field.value || ""}
									onValueChange={field.onChange}
									className="flex flex-row gap-4"
									data-testid={`storage-form-input-${val.key}`}
								>
									{val.options.options.map((opt) => (
										<div
											key={opt.value}
											className="flex items-center gap-2"
										>
											<RadioGroupItem
												value={opt.value}
												id={`${val.key}-${opt.value}`}
												data-testid={`storage-form-radio-${val.key}-${opt.value}`}
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
								data-testid={`storage-form-field-${val.key}`}
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
								<div className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent">
									<input
										type="file"
										accept={
											val.options?.extensions?.join(
												",",
											) || "*"
										}
										multiple={false}
										className="hidden"
										onChange={(e) => {
											const files = e.target.files;
											if (files && files.length > 0) {
												field.onChange(files[0]);
											}
										}}
										disabled={val.disabled}
										data-testid={`storage-form-input-${val.key}`}
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
								{error && (
									<P
										className="text-destructive text-sm"
										data-testid={`storage-form-error-${val.key}`}
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
								data-testid={`storage-form-field-${val.key}`}
							>
								<Checkbox
									id={val.key}
									checked={field.value || false}
									onCheckedChange={field.onChange}
									disabled={val.disabled}
									data-testid={`storage-form-input-${val.key}`}
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
										data-testid={`storage-form-error-${val.key}`}
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
								data-testid={`storage-form-field-${val.key}`}
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
									data-testid={`storage-form-input-${val.key}`}
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
								{field.value && field.value.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{field.value.map((tag, index) => (
											<span
												key={index}
												className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
											>
												{tag}
												<button
													type="button"
													onClick={() => {
														const newTags =
															field.value.filter(
																(_, i) =>
																	i !== index,
															);
														field.onChange(newTags);
													}}
													className="text-muted-foreground hover:text-foreground"
												>
													×
												</button>
											</span>
										))}
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
		if (error.type === "checkField" && val.rules?.custom?.message) {
			return val.rules.custom.message;
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
			data-testid="storage-form"
			className="my-4"
			autoComplete="off"
		>
			<div className="mb-6">
				<H4 data-testid="storage-form-title">{title}</H4>
				<Muted
					className="mt-1 text-base"
					data-testid="storage-form-description"
				>
					{description}
				</Muted>
			</div>

			{Object.keys(grouped).map((category) => (
				<div key={category} className="mb-4 flex flex-col gap-4">
					<div className="flex items-start gap-4">
						<div className="flex flex-1 flex-col gap-1">
							<H4 data-testid="storage-importForm-category-title">
								{category}
							</H4>
							<Muted
								data-testid="storage-importForm-category-description"
								className="text-base"
							>
								{categoryDescriptions[category] ??
									"No description available."}
							</Muted>
						</div>
						<div className="flex flex-[2] flex-col gap-2 py-2">
							{grouped[category].map((f) =>
								renderControllerField(f),
							)}
						</div>
					</div>
					<Separator />
				</div>
			))}

			{advancedFields?.length > 0 && (
				<div className="mt-4">
					<Collapsible
						open={openAdvanced}
						onOpenChange={setOpenAdvanced}
					>
						<div className="flex flex-row items-center justify-between">
							<H4 data-testid="storage-form-advanced-header">
								Advanced Settings
							</H4>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									data-testid="storage-form-advanced-toggle"
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
										<Muted className="text-base">
											Configure advanced storage settings
										</Muted>
									</div>
									<div className="flex flex-[2] flex-col gap-2">
										{advancedFields.map((f) =>
											renderControllerField(f),
										)}
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>
			)}

			<div className="mt-4 flex justify-end">
				<Button
					data-testid="storage-form-submit"
					type="submit"
					disabled={!formState.isValid || isValidDatabaseName}
				>
					Connect
				</Button>
			</div>
		</form>
	);
};
