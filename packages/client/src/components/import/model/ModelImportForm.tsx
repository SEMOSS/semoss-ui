import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	Collapse,
	Divider,
	FileDropzone,
	IconButton,
	Select,
	Stack,
	Switch,
	styled,
	TextArea,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
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

	selectedProvider: string;

	importableModelsCategory: CategoryTexts;
}

const StyledDropzoneField = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	width: "100%",
	height: "100%",
}));

export const ModelImportForm = (props: ModelImportFormProps) => {
	const {
		name,
		fields,
		advanced,
		onComplete,
		selectedProvider,
		importableModelsCategory,
	} = props;

	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const notification = useNotification();
	const { isLoading, setIsLoading } = useStepper();

	const [advancedOpen, setAdvancedOpen] = useState(false);
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
				notification.add({
					color: "error",
					message: output,
				});
				return;
			}

			notification.add({
				color: "success",
				message: `Successfully added LLM to catalog`,
			});
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

		const getHelperText = (error, val) => {
			if (!error) return val.helperText || "";
			if (error.type === "checkField" && val.rules?.custom?.message) {
				return val.rules.custom.message;
			}
			return error.message;
		};

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
				notification.add({
					color: "error",
					message: output,
				});
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
						case "text":
							return (
								<TextField
									label={f.label}
									size="small"
									variant="outlined"
									required={f.required}
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
													debounceTimeoutsRef.current[
														f.key
													],
												);
											}
											debounceTimeoutsRef.current[f.key] =
												setTimeout(async () => {
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
									disabled={f.disabled || isLockedModel}
									helperText={getHelperText(error, f)}
									data-testId={formatToDataTestId(
										`importForm-${f.label}-textField`,
									)}
									error={!!error}
								/>
							);
						case "file-upload":
							return (
								<StyledDropzoneField>
									<Typography
										data-testid={`model-import-form-${f.label}-file-upload`}
										variant={"body1"}
									>
										{f.label}
									</Typography>
									<FileDropzone
										multiple={false}
										value={field.value as File | File[]}
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
								</StyledDropzoneField>
							);
						case "url":
							return (
								<TextField
									label={f.label}
									variant="outlined"
									size="small"
									required={f.required}
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
									disabled={f.disabled || isLockedModel}
									data-testId={formatToDataTestId(
										`model-importForm-${f.label}-url`,
									)}
								/>
							);
						case "password":
							return (
								<TextField
									label={f.label}
									variant="outlined"
									type="password"
									size="small"
									required={f.required}
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
									helperText={f.helperText || ""}
									disabled={f.disabled || isLockedModel}
									data-testId={formatToDataTestId(
										`model-importForm-${f.label}-password`,
									)}
								/>
							);
						case "number":
							return (
								<TextField
									label={f.label}
									variant="outlined"
									type="text"
									size="small"
									required={f.required}
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
									disabled={f.disabled || isLockedModel}
									data-testId={formatToDataTestId(
										`model-importForm-${f.label}`,
									)}
									helperText={
										error?.message?.toString() ||
										f.helperText ||
										""
									}
									error={!!error}
									inputProps={{
										onFocus: () => {
											_lastField.current = {
												..._lastField.current,
												lastFocussedField: field.name,
												lastFocussedValue: String(
													field.value ?? "",
												),
												lastValidatedValue: field.value,
											};
										},
										onBlur: () => {
											if (f.rules?.custom_rules) {
												_lastField.current.runValidate = true;
												trigger(field.name);
											}
										},
									}}
								/>
							);
						case "textarea":
							return (
								<TextArea
									label={f.label}
									variant="outlined"
									required={f.required}
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
									rows={4}
									disabled={f.disabled || isLockedModel}
									data-testId={formatToDataTestId(
										`model-importForm-${f.label}-textarea`,
									)}
								/>
							);
						case "select":
							return (
								<Select
									fullWidth
									size="small"
									value={field.value ?? ""}
									required={f.required}
									label={f.label}
									onChange={(e: unknown) =>
										field.onChange(
											(
												e as {
													target?: {
														value?: unknown;
													};
												}
											).target?.value ?? e,
										)
									}
									disabled={f.disabled || isLockedModel}
									data-testId={formatToDataTestId(
										`model-importForm-${f.label}-select`,
									)}
								>
									{(f.options || []).map((opt) => (
										<Select.Item key={opt} value={opt}>
											{opt}
										</Select.Item>
									))}
								</Select>
							);
						case "boolean":
							return (
								<Stack
									direction="row"
									alignItems="center"
									spacing={2}
								>
									<Switch
										checked={!!field.value}
										onChange={(e: unknown) => {
											const checked = Boolean(
												(
													e as {
														target?: {
															checked?: unknown;
														};
													}
												).target?.checked ?? e,
											);
											field.onChange(checked);
										}}
										required={f.required}
										disabled={f.disabled || isLockedModel}
									/>
									<Typography
										variant="body1"
										data-testId={formatToDataTestId(
											`model-importForm-${f.label}-text`,
										)}
									>
										{f.label}
									</Typography>
								</Stack>
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
			style={{ marginTop: "16px", marginBottom: "16px" }}
		>
			{Object.keys(grouped).map((category) => (
				<Box
					key={category}
					sx={{
						display: "flex",
						gap: 4,
						mb: 4,
						flexDirection: "column",
					}}
				>
					<Box
						sx={{
							display: "flex",
							gap: 4,
							alignItems: "flex-start",
						}}
					>
						{/* Left: Category title + description */}
						<Stack sx={{ flex: 1 }}>
							<Typography
								variant="h6"
								data-testId={`model-importForm-category-title`}
							>
								{category}
							</Typography>
							<Typography
								variant="body2"
								data-testId={`model-importForm-category-description`}
								color="textSecondary"
							>
								{importableModelsCategory[selectedProvider]?.[
									category
								] ?? "No description available."}
							</Typography>
						</Stack>

						{/* Right: Fields under this category */}
						<Stack spacing={2} sx={{ flex: 2 }}>
							{grouped[category].map((f) => renderField(f))}
						</Stack>
					</Box>
					<Divider sx={{ color: "secondary" }} />
				</Box>
			))}
			{advanced.length > 0 && (
				<Box sx={{ mt: 4 }}>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
					>
						<Typography
							data-testId="model-advanced-settings-title"
							variant="h6"
						>
							Advanced Settings
						</Typography>
						<IconButton
							data-testId="model-advanced-settings-toggle"
							onClick={() => setAdvancedOpen((prev) => !prev)}
							size="small"
						>
							{advancedOpen ? <ExpandLess /> : <ExpandMore />}
						</IconButton>
					</Stack>
					<Collapse in={advancedOpen}>
						<Box
							sx={{
								display: "flex",
								gap: 4,
								mb: 4,
								flexDirection: "column",
							}}
						>
							<Box
								sx={{
									display: "flex",
									gap: 4,
									alignItems: "flex-start",
								}}
							>
								{/* Left: Category title + description */}
								<Stack sx={{ flex: 1 }}>
									<Typography
										data-testId="model-advanced-settings-description"
										variant="body2"
										color="textSecondary"
									>
										Add advanced settings here
									</Typography>
								</Stack>

								{/* Right: Fields under this category */}
								<Stack spacing={2} sx={{ flex: 2 }}>
									{advanced.map((f) => renderField(f))}
								</Stack>
							</Box>
						</Box>
					</Collapse>
				</Box>
			)}
			<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
				<Button
					data-testId="model-importForm-connect-button"
					type="submit"
					variant="contained"
					disabled={isLoading || !isValid || isValidDatabaseName}
				>
					Connect
				</Button>
			</Box>
		</form>
	);
};
