import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	Autocomplete,
	Box,
	Button,
	Checkbox,
	Divider,
	FileDropzone,
	FormControlLabel,
	IconButton,
	LoadingScreen,
	Menu,
	RadioGroup,
	Select,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";

const StyledBox = styled(Box)({
	marginBottom: "32px",
	marginTop: "16px",
});

const StyledFlexEnd = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	gap: theme.spacing(1),
	marginTop: theme.spacing(2),
}));

const StyledSubmitButton = styled(Button)({
	textTransform: "capitalize",
	minWidth: "128px",
});

const AdvancedHeader = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
	alignItems: "center",
	padding: theme.spacing(2, 0),
}));

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

export const VectorForm = ({
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
		defaultValues: [...fields, ...advanced].reduce((acc, f) => {
			acc[f.key] = f.value || "";
			return acc;
		}, {}),
	});

	const watchedFieldRef = useRef({});
	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
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

	const handleFieldValidation = async (
		e,
		val,
		field,
		validateFormField,
		setError,
		clearErrors,
	) => {
		field.onChange(e);
		const value = e.target.value;
		if (val.rules?.custom) {
			const isValid = await validateFormField(val, value);
			if (!isValid) {
				setError(val.key, {
					type: "manual",
					message:
						val.rules?.custom?.message ||
						"Database name already exists.",
				});
			} else {
				clearErrors(val.key);
			}
		}
	};

	const onFormSubmit = async (formData) => {
		const {
			EMBEDDINGS,
			DESCRIPTION: description,
			TAGS: tag,
			...newFormData
		} = formData;
		const metaData = JSON.stringify({ description, tag });

		setLoading(true);
		const pixel = `CreateVectorDatabaseEngine(database=["${
			formData.NAME
		}"],conDetails=[${JSON.stringify(newFormData)}]);SetDatabaseMetadata(database=["${formData.NAME}"],meta=[${metaData}])`;

		monolithStore.runQuery(pixel).then(async (response) => {
			const pixelOutput = response.pixelReturn[0].output,
				operationType = response.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: pixelOutput,
				});
				setLoading(false);
				return;
			}
			notification.add({
				color: "success",
				message: `Successfully added vector database to catalog`,
			});

			if (EMBEDDINGS !== "") {
				try {
					const uploadedFiles = await uploadFile(
						[EMBEDDINGS.NAME],
						configStore.store.insightID,
					);

					if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
						notification.add({
							color: "error",
							message:
								"Upload failed or returned invalid response.",
						});
						setLoading(false);
						return;
					}
					const pixelExpressions = `CreateEmbeddingsFromDocuments(filePaths=["${uploadedFiles[0].fileLocation}"], engine=["${pixelOutput.database_id}"])`;
					const response =
						await monolithStore.runQuery(pixelExpressions);
					const { output, operationType } = response.pixelReturn[0];
					if (operationType.includes("ERROR")) {
						notification.add({ color: "error", message: output });
					}
				} catch {
					notification.add({
						color: "error",
						message: "Upload failed or returned invalid response.",
					});
				}
			}
			navigate(`/engine/vector/${pixelOutput.database_id}`);
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
			notification.add({ color: "error", message: output });
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
								options: output.map((opt) => ({
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
			notification.add({ color: "error", message: output });
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
			render={({ field, fieldState: { error }, formState }) => {
				switch (val.component) {
					case "text":
						return (
							<TextField
								{...field}
								fullWidth
								label={val.label}
								disabled={val.disabled}
								variant="outlined"
								required={val?.required}
								size="small"
								sx={{ display: val.hidden ? "none" : "block" }}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`vector-form-input-${val.key}`}
								onChange={(e) =>
									handleFieldValidation(
										e,
										val,
										field,
										validateFormField,
										setError,
										clearErrors,
									)
								}
							/>
						);

					case "password":
						return (
							<TextField
								{...field}
								type="password"
								fullWidth
								size="small"
								label={val.label}
								disabled={val.disabled}
								required={val?.required}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`vector-form-input-${val.key}`}
							/>
						);

					case "number":
						return (
							<TextField
								{...field}
								type="number"
								fullWidth
								label={val.label}
								size="small"
								disabled={val.disabled}
								required={val?.required}
								sx={{ display: val.hidden ? "none" : "block" }}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`vector-form-input-${val.key}`}
							/>
						);

					case "select":
						return (
							<Select
								{...field}
								fullWidth
								label={val.label}
								disabled={val.disabled}
								size="small"
								required={val?.required}
								sx={{ display: val.hidden ? "none" : "block" }}
								error={!!error}
								helperText={getHelperText(error, val)}
								onChange={(e) => {
									field.onChange(e);
									checkForDisplayRulesSet(
										field,
										e.target.value,
									);
								}}
								data-testid={`vector-form-input-${val.key}`}
							>
								{(Array.isArray(val?.options)
									? val && Array.isArray(val.options)
										? val.options
										: []
									: []
								).map((opt) => (
									<Menu.Item
										key={opt.value}
										value={opt.value}
										data-testid={`vector-form-option-${val.key}-${opt.value}`}
									>
										{opt.display}
									</Menu.Item>
								))}
							</Select>
						);

					case "radio":
						return (
							<RadioGroup
								row
								value={field.value || ""}
								onChange={(e) => field.onChange(e.target.value)}
								data-testid={`vector-form-input-${val.key}`}
								sx={{ display: val.hidden ? "none" : "block" }}
							>
								{val.options.options.map((opt) => (
									<FormControlLabel
										key={opt.value}
										value={opt.value}
										control={
											<RadioGroup.Item
												data-testid={`vector-form-radio-${val.key}-${opt.value}`}
												label={""}
											/>
										}
										label={opt.display}
									/>
								))}
								{error && (
									<Typography variant="caption" color="error">
										{getHelperText(error, val)}
									</Typography>
								)}
							</RadioGroup>
						);

					case "file-upload":
						return (
							<>
								<Typography
									variant={"body1"}
									data-testid="vector-zip-upload-title"
								>
									{val.label}
								</Typography>
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
									data-testid={`vector-form-input-${val.key}`}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										data-testid={`vector-form-error-${val.key}`}
									>
										{getHelperText(error, val)}
									</Typography>
								)}
							</>
						);
					case "checkbox":
						return (
							<>
								<Checkbox
									required={val?.required}
									label={val.label}
									disabled={val.disabled}
									checked={field.value ? field.value : false}
									onChange={(value) => field.onChange(value)}
									data-testid={`vector-form-input-${val.key}`}
									sx={{
										display: val.hidden ? "none" : "block",
									}}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										sx={{ mt: 0.5, display: "block" }}
										data-testid={`vector-form-error-${val.key}`}
									>
										{error.message}
									</Typography>
								)}
							</>
						);
					case "tags":
						return (
							<Autocomplete
								multiple
								freeSolo
								size="small"
								options={val.options?.options || []}
								value={field.value || []}
								onChange={(_, newValue) => {
									// Filter out empty or whitespace-only tags
									const filteredValue = newValue.filter(
										(tag) =>
											typeof tag === "string" &&
											tag.trim() !== "",
									);
									field.onChange(filteredValue);
								}}
								renderInput={(params) => (
									<TextField
										{...params}
										fullWidth
										label={val.label}
										placeholder='Press "Enter" to add tag'
										variant="outlined"
										required={val?.required}
										// @ts-expect-error TODO FIX
										error={!!error}
										helperText={getHelperText(error, val)}
										disabled={val.disabled}
										sx={{
											display: val.hidden
												? "none"
												: "block",
										}}
										inputProps={{
											...params.inputProps,
											required: false,
										}}
									/>
								)}
								data-testid={`vector-form-input-${val.key}`}
							/>
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
		return <LoadingScreen.Trigger description="Loading..." />;
	}

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} data-testid="vector-form">
			<Typography variant="h4" data-testid="vector-form-title">
				{title}
			</Typography>
			<Typography
				variant="body1"
				color="textSecondary"
				data-testid="vector-form-description"
				sx={{ marginTop: "4px" }}
			>
				{description}
			</Typography>
			<StyledBox data-testid="vector-form-box">
				<Stack rowGap={4}>
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
								<Stack sx={{ flex: 1 }}>
									<Typography
										variant="h6"
										data-testId={`vector-importForm-category-title`}
									>
										{category}
									</Typography>
									<Typography
										variant="body2"
										data-testId={`model-importForm-category-description`}
										color="textSecondary"
									>
										{categoryDescriptions[category] ??
											"No description available."}
									</Typography>
								</Stack>
								<Stack spacing={2} sx={{ flex: 2 }}>
									{grouped[category].map((f) =>
										renderControllerField(f),
									)}
								</Stack>
							</Box>
							<Divider sx={{ color: "secondary" }} />
						</Box>
					))}
					{advancedFields?.length ? (
						<>
							<AdvancedHeader data-testid="vector-form-advanced-header">
								<Typography variant="h6">
									ADVANCED SETTINGS
								</Typography>
								<IconButton
									onClick={() =>
										setOpenAdvanced(!openAdvanced)
									}
									data-testid="vector-form-advanced-toggle"
								>
									{openAdvanced ? (
										<ExpandLess />
									) : (
										<ExpandMore />
									)}
								</IconButton>
							</AdvancedHeader>
							{openAdvanced &&
								advancedFields?.map((val) => (
									<div
										key={val.key}
										data-testid={`vector-form-field-${val.key}`}
									>
										{renderControllerField(val)}
									</div>
								))}
						</>
					) : null}
				</Stack>

				<StyledFlexEnd data-testid="vector-form-actions">
					<StyledSubmitButton
						type="submit"
						variant="contained"
						data-testid="vector-form-submit"
						disabled={!formState.isValid || isValidDatabaseName}
					>
						Connect
					</StyledSubmitButton>
				</StyledFlexEnd>
			</StyledBox>
		</form>
	);
};
