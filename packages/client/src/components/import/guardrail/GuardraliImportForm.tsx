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
	const notification = useNotification();
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;
	const [loading, setLoading] = useState(false);
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});

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
			(acc, fieldName) => ({ ...acc, [fieldName]: getValues(fieldName) }),
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
				notification.add({
					color: "error",
					message: pixelOutput,
				});
				setLoading(false);
				return;
			}
			notification.add({
				color: "success",
				message: `Successfully added new guardrail to catalog`,
			});
			navigate(`/engine/guardrail/${pixelOutput.database_id}`);
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
		if (!field.rules?.custom_rules?.value) return true;
		const pixelToExecute = field.rules.custom_rules.value.replace(
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

	/**
	 * This runs on input changes to check if the user has changed a dynamically updated field manually
	 * It sets a flag that will stop dynamic update from running if the user has manually changed it
	 * Allows the user to manually change the field back to re-enable dynamic updates
	 */
	const checkForDynamicFieldChange = () => {
		// check to see if this form has a dynamically updated field
		if (updateFieldName && initScriptCallback && dynamicFieldsToWatch) {
			// setTimeout sets this to occur after field values are updated
			setTimeout(() => {
				// get values from all dynamic fields
				const mappedValuesObject = dynamicFieldsToWatch.reduce(
					(acc, fieldName) => ({
						...acc,
						[fieldName]: getValues(fieldName),
					}),
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

	const renderControllerField = (val) => (
		<Controller
			key={val.key}
			name={val.key}
			control={control}
			rules={{
				required: val?.required,
			}}
			render={({ field, fieldState: { invalid, error } }) => {
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
								helperText={getHelperText(error, val)}
								error={invalid}
								data-testid={`guardrail-form-input-${val.key}`}
								onChange={(v) => {
									field.onChange(v);
									if (val.rules?.custom_rules) {
										if (
											debounceTimeoutsRef.current[val.key]
										) {
											clearTimeout(
												debounceTimeoutsRef.current[
													val.key
												],
											);
										}
										debounceTimeoutsRef.current[val.key] =
											setTimeout(async () => {
												const value = v.target.value;
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
								data-testid={`guardrail-form-input-${val.key}`}
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
								data-testid={`guardrail-form-input-${val.key}`}
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
								data-testid={`guardrail-form-input-${val.key}`}
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
										data-testid={`guardrail-form-option-${val.key}-${opt.value}`}
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
								data-testid={`guardrail-form-input-${val.key}`}
								sx={{ display: val.hidden ? "none" : "block" }}
							>
								{val.options.options.map((opt) => (
									<FormControlLabel
										key={opt.value}
										value={opt.value}
										control={
											<RadioGroup.Item
												data-testid={`guardrail-form-radio-${val.key}-${opt.value}`}
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
									data-testid="guardrail-zip-upload-title"
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
									data-testid={`guardrail-form-input-${val.key}`}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										data-testid={`guardrail-form-error-${val.key}`}
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
									data-testid={`guardrail-form-input-${val.key}`}
									sx={{
										display: val.hidden ? "none" : "block",
									}}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										sx={{ mt: 0.5, display: "block" }}
										data-testid={`guardrail-form-error-${val.key}`}
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
								data-testid={`guardrail-form-input-${val.key}`}
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
		if (error.type === "checkField" && val.rules?.custom_rules?.message) {
			return val.rules.custom_rules.message;
		}
		return error.message;
	};
	if (loading) {
		return <LoadingScreen.Trigger description="Loading..." />;
	}

	return (
		<form
			onSubmit={handleSubmit(onFormSubmit)}
			data-testid="guardrail-form"
		>
			<Typography variant="h4" data-testid="guardrail-form-title">
				{title}
			</Typography>
			<Typography
				variant="body1"
				color="textSecondary"
				data-testid="guardrail-form-description"
				sx={{ marginTop: "4px" }}
			>
				{description}
			</Typography>
			<StyledBox data-testid="guardrail-form-box">
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
										data-testId={`guardrail-importForm-category-title`}
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
							<AdvancedHeader data-testid="guardrail-form-advanced-header">
								<Typography variant="h6">
									ADVANCED SETTINGS
								</Typography>
								<IconButton
									onClick={() =>
										setOpenAdvanced(!openAdvanced)
									}
									data-testid="guardrail-form-advanced-toggle"
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
										data-testid={`guardrail-form-field-${val.key}`}
									>
										{renderControllerField(val)}
									</div>
								))}
						</>
					) : null}
				</Stack>

				<StyledFlexEnd data-testid="guardrail-form-actions">
					<StyledSubmitButton
						type="submit"
						variant="contained"
						data-testid="guardrail-form-submit"
						disabled={!formState.isValid || isValidDatabaseName}
					>
						Connect
					</StyledSubmitButton>
				</StyledFlexEnd>
			</StyledBox>
		</form>
	);
};
