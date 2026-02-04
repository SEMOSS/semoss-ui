import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FileDropzone } from "@semoss/ui";
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
import { useRootStore, useStepper } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import type { CategoryTexts, FieldDefinition } from "./model-import.constants";

interface ModelImportFormProps {
	/** Optional model name being configured */
	name?: string;
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
	/**
	 * callback invoked when Back button is clicked
	 */
	onBack?: () => void;

	selectedProvider: string;

	importableModelsCategory: CategoryTexts;
}

export const ModelImportForm = (props: ModelImportFormProps) => {
	const {
		name,
		fields,
		advanced,
		onComplete,
		onBack,
		selectedProvider,
		importableModelsCategory,
	} = props;

	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const { isLoading, setIsLoading } = useStepper();

	const [advancedOpen, setAdvancedOpen] = useState(false);

	// prepare default values from fields + advanced
	const {
		control,
		handleSubmit,
		reset,
		setError,
		clearErrors,
		trigger,
		formState: { isValid },
	} = useForm({
		mode: "onChange",
		defaultValues: [...fields, ...advanced].reduce<Record<string, unknown>>(
			(acc, f) => {
				// if a name was supplied for the model, lock the MODEL field to that name
				if (f.key === "MODEL" && name) {
					acc[f.key] = name;
				} else {
					acc[f.key] =
						f.default ??
						f.value ??
						(f.type === "boolean" ? false : "");
				}
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
			if (f.key === "MODEL" && name) {
				defaults[f.key] = name;
			} else {
				defaults[f.key] =
					f.default ?? f.value ?? (f.type === "boolean" ? false : "");
			}
		});
		reset(defaults);
	}, [fields, advanced, reset, name]);

	const onSubmit = (data: Record<string, unknown>) => {
		const pixel = `CreateModelEngine(model=["${
			data.NAME
		}"],modelDetails=[${JSON.stringify(data)}])`;

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
			navigate(`/engine/model/${output.database_id}`);
		});

		if (onComplete) onComplete(data);
	};

	const renderField = (f: FieldDefinition) => {
		const defaultVal =
			f.key === "MODEL" && name
				? name
				: (f.default ?? f.value ?? (f.type === "boolean" ? false : ""));
		const isLockedModel = f.key === "MODEL" && !!name;

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
				// setFocus(field.fieldName);
				//Using the field key (not label) for errors and helper text, and setting errors with the correct key.
				setError(field.key, {
					message: field.rules.custom_rules.message,
					type: "checkField",
				});
				return false;
			} else {
				clearErrors(field.key);
			}

			return true;
		};

		return (
			<Controller
				key={f.key}
				name={f.key}
				control={control}
				defaultValue={defaultVal}
				//rules={{ required: f.required }}
				rules={{
					required: f.required,
					validate: {
						...(f.rules?.custom_rules
							? {
									checkField: async (fieldVal) => {
										// Skip validation if not needed
										if (!_lastField.current.runValidate)
											return true;
										try {
											// Run validation only if criteria match
											if (
												_lastField.current
													.lastFocussedField ===
													f.key &&
												_lastField.current
													.lastValidatedValue !==
													fieldVal
											) {
												const isValid =
													await validateFormField(
														f,
														fieldVal,
													); // must await
												return (
													isValid ||
													f.rules.custom_rules.message
												);
											}

											return true; // default valid
										} catch (err) {
											console.error(
												"Validation error:",
												err,
											);
											return (
												f.rules.custom_rules.message ||
												"Validation failed."
											);
										} finally {
											_lastField.current.runValidate = false;
										}
									},
								}
							: {}),
					},
					pattern: {
						...(f.rules?.pattern && {
							value: f.rules?.pattern.value,
							message: f.rules?.pattern.message,
						}),
					},
				}}
				render={({
					field: { ref, ...field },
					fieldState: { error },
					formState: { errors },
				}) => {
					switch (f.type) {
						case "text":
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
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										disabled={f.disabled || isLockedModel}
										autoComplete="off"
										data-testId={formatToDataTestId(
											`importForm-${f.label}-textField`,
										)}
										onFocus={() => {
											_lastField.current = {
												..._lastField.current,
												lastFocussedField: field.name,
												lastFocussedValue: field.value,
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
						case "file-upload":
							return (
								<div
									key={f.key}
									className="flex h-full w-full flex-col gap-2"
								>
									<P
										data-testid={`model-import-form-${f.label}-file-upload`}
									>
										{f.label}
									</P>
									<FileDropzone
										multiple={false}
										value={
											field.value as File | File[] | null
										}
										disabled={false}
										data-testid={formatToDataTestId(
											`importForm-${field.name}-fileDropZone`,
										)}
										onChange={(newValues) => {
											const files = newValues as
												| File
												| File[];
											field.onChange(files);
											_lastField.current = {
												..._lastField.current,
												lastFocussedField: f.value,
												lastFocussedValue: String(
													field.value ?? "",
												),
											};
										}}
									/>
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
										disabled={f.disabled || isLockedModel}
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
										disabled={f.disabled || isLockedModel}
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
										disabled={f.disabled || isLockedModel}
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
										disabled={f.disabled || isLockedModel}
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
										disabled={f.disabled || isLockedModel}
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
										disabled={f.disabled || isLockedModel}
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
					<div className="flex items-start gap-4">
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
						<div className="flex flex-row items-center justify-between">
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
								<div className="flex items-start gap-4">
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
			<div className="mt-4 flex justify-end gap-[16px]">
				<Button
					data-testId="model-importForm-back-button"
					variant="secondary"
					type="button"
					className="text-(--secondary-foreground)"
					onClick={onBack}
				>
					Back
				</Button>
				<Button
					data-testId="model-importForm-connect-button"
					variant="default"
					className="flex w-[147px] items-center gap-2 px-4 py-2"
					type="submit"
					disabled={isLoading || !isValid}
				>
					Create Model
				</Button>
			</div>
		</form>
	);
};
