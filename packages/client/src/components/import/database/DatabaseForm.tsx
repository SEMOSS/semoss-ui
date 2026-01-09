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
	Modal,
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
import DataSelection from "./DataSelection";
import ExcelDataSelection from "./ExcelDataSelection";
import { MetaModelConnections } from "./MetaModelConnections";
import { MetaModelType } from "./MetaModelType";
import TableViewSelector from "./TableViewModel";

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

export const DatabaseForm = ({
	selectedTab,
	title,
	description,
	fields,
	advanced,
	categoryDescription,
}) => {
	const [step, setStep] = useState<
		"fileupload" | "table" | "metaModel" | "propFile" | "connections"
	>("fileupload");
	const [openAdvanced, setOpenAdvanced] = useState(false);
	const [resolvedFields, setResolvedFields] = useState(fields);
	const [parsedData, setParsedData] = useState<ParsedResult[]>([]);
	const [excelfileName, setExcelFileName] = useState<string[]>([]);
	const [tableName, setTableName] = useState<string[]>([]);
	const [filePath, setFilePath] = useState<string>();
	const [uploadedFile, setUploadedFile] = useState<File[]>([]);
	const [formValues, setFormValues] = useState({});
	const [isValidDatabaseName, setIsValidDatabaseName] =
		useState<boolean>(false);
	const [dropzoneKey, setDropzoneKey] = useState(Date.now());
	type ConnectionValuesType = {
		tables?: unknown[];
		views?: unknown[];
		[key: string]: unknown;
	} | null;
	const [connectionValues, setConnectionValues] =
		useState<ConnectionValuesType>(null);
	const [connectionViewModel, setConnectionViewModel] =
		useState<boolean>(false);
	const [formData, setFormData] = useState({});

	const onFileUpload = (files: File | File[]) => {
		const fileArray = Array.isArray(files) ? files : [files];
		setValue("FILE_UPLOAD", fileArray);
	};

	const updateStepBasedOnMetaModel = (METAMODEL_TYPE) => {
		if (
			METAMODEL_TYPE === "asFlatTable" ||
			METAMODEL_TYPE === "fromScratch"
		) {
			setStep("table");
		} else if (METAMODEL_TYPE === "asSuggestedMetaModel") {
			setStep("metaModel");
		} else if (METAMODEL_TYPE === "frompropFile") {
			setStep("propFile");
		} else {
			setStep("fileupload");
		}
	};

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
		defaultValues: fields.reduce((acc, f) => {
			acc[f.key] = f.value || "";
			return acc;
		}, {}),
	});

	const watchedFieldRef = useRef({});
	const debounceTimeoutsRef = useRef<
		Record<string, ReturnType<typeof setTimeout>>
	>({});
	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;
	const [loading, setLoading] = useState(false);
	const databaseType = watch("DATABASE_TYPE");

	useEffect(() => {
		setResolvedFields((prev) =>
			prev.map((f) => {
				if (f.key === "METAMODEL_TYPE") {
					if (databaseType?.toLowerCase() === "r") {
						return {
							...f,
							options: {
								...f.options,
								options: f.options.options.filter(
									(opt) => opt.value === "asFlatTable",
								),
							},
						};
					} else {
						return {
							...f,
							options: {
								...f.options,
								options:
									fields.find(
										(orig) => orig.key === "METAMODEL_TYPE",
									)?.options.options || f.options.options,
							},
						};
					}
				}
				return f;
			}),
		);
	}, [databaseType, fields]);

	//  Group fields by category
	const grouped = defaultFields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	const onFormSubmit = async (formData) => {
		setLoading(true);
		setFormValues(formData);
		if (selectedTab === "Connections") {
			setFormData(formData);
			const pixel = `
            ExternalJdbcTablesAndViews(conDetails=[${JSON.stringify(
				formData,
			)}]);
           
        `;
			try {
				const response = await monolithStore.runQuery(pixel);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					notification.add({ color: "error", message: output });
					setLoading(false);
					return;
				}
				setConnectionViewModel(true);
				setConnectionValues(response?.pixelReturn?.[0]?.output || null);
			} catch {
				notification.add({
					color: "error",
					message: "Error from ExternalJdbcTablesAndViews",
				});
				setLoading(false);
			}
			setLoading(false);
			return;
		}
		try {
			const uploadedFiles = await uploadFile(
				formData.FILE_UPLOAD,
				configStore.store.insightID,
			);

			if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
				notification.add({
					color: "error",
					message: "Upload failed or returned invalid response.",
				});
				setValue("DATABASE_TYPE", formData.DATABASE_TYPE);
				setValue("METAMODEL_TYPE", formData.METAMODEL_TYPE);
				return;
			}

			let pixelExpressions: string[] = [];

			if (
				formData.METAMODEL_TYPE === "asFlatTable" ||
				formData.METAMODEL_TYPE === "fromScratch"
			) {
				if (title === "Excel") {
					pixelExpressions = uploadedFiles.map(
						(file) =>
							`PredictExcelDataTypes(filePath=["${file.fileLocation}"])`,
					);
				} else {
					pixelExpressions = uploadedFiles.map(
						(file) =>
							`PredictDataTypes(filePath=["${file.fileLocation}"], delimiter=["${formData.DELIMITER}"], rowCount=[false])`,
					);
				}
			} else if (formData.METAMODEL_TYPE === "asSuggestedMetaModel") {
				pixelExpressions = uploadedFiles.map(
					(file) =>
						`PredictMetamodel(filePath=["${file.fileLocation}"], delimiter=["${formData.DELIMITER}"], rowCount=[false])`,
				);
			} else if (formData.METAMODEL_TYPE === "frompropFile") {
				notification.add({
					color: "error",
					message: "Prop File is not implemented.",
				});

				setLoading(false);
				return;
			} else {
				pixelExpressions = uploadedFiles.map(
					(file) =>
						`UploadDatabase(filePath=["${file.fileLocation}"],space=[""])`,
				);
			}

			const parsedResults: ParsedResult[] = [];
			const fileNames: string[] = [];

			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const output = response?.pixelReturn?.[0]?.output;
				const pixelExpression =
					response?.pixelReturn?.[0]?.pixelExpression;
				const filePathMatch = pixelExpression?.match(
					/filePath\s*=\s*\[\s*"(.+?)"\s*\]/,
				);
				const filePathFromExpression = filePathMatch
					? filePathMatch[1]
					: null;
				if (filePathFromExpression) {
					const name =
						filePathFromExpression.split(/[/\\]/).pop() || "";
					fileNames.push(name);
				}
				setFilePath(filePathFromExpression);
				parsedResults.push(output);
				if (title === "ZIP") {
					navigate(`/engine/database/${output.database_id}`);
				}
			}
			const tableName = fileNames.map((name) =>
				name.replace(/\.[^.]+$/, ""),
			);
			setTableName(tableName);
			setExcelFileName(fileNames);
			setParsedData(parsedResults);
			updateStepBasedOnMetaModel(formData.METAMODEL_TYPE);
		} catch {
			notification.add({
				color: "error",
				message: "An error occurred during upload.",
			});
		} finally {
			setLoading(false);
		}
	};

	const watchFile = filePath;
	const newHeaders: Record<string, unknown> = {};

	const submitMetamodelPixel = async (
		payload: ParsedResult | ParsedResult[],
		formValuesLocal: Record<string, unknown>,
	): Promise<void> => {
		setLoading(true);
		try {
			const payloads = Array.isArray(payload) ? payload : [payload];

			if (!payloads || payloads.length === 0) {
				notification.add({
					color: "error",
					message: "Data is missing or invalid.",
				});
				setLoading(false);
				return;
			}

			const pixelCommands: string[] = [];

			payloads.forEach((parsed, index) => {
				if (!parsed || typeof parsed !== "object") {
					return;
				}

				const {
					dataTypes = {},
					additionalDataTypes = {},
					relation = [],
					nodeProp = {},
					descriptionMap: _descriptionMap = {},
					logicalNamesMap: _logicalNamesMap = {},
				} = parsed as ParsedResult & {
					additionalDataTypes?: Record<string, unknown>;
					descriptionMap?: Record<string, unknown>;
					description?: Record<string, unknown>;
					logicalNamesMap?: Record<string, unknown>;
					logicalNames?: Record<string, unknown>;
				};

				const descriptionMap = _descriptionMap ?? {};
				const logicalNamesMap = _logicalNamesMap ?? {};

				const metamodel = [
					{
						relation,
						nodeProp,
					},
				];

				const filePath = Array.isArray(watchFile)
					? watchFile[index]
					: watchFile;

				const databaseParam =
					index === 0
						? `["${String(formValuesLocal.DATABASE_NAME ?? "")}"]`
						: `[databaseVar]`;

				const existingParam = index === 0 ? `[false]` : `[true]`;

				const assignmentPrefix = index === 0 ? `databaseVar = ` : ``;

				const command = `${assignmentPrefix}RdbmsCsvUpload(
          database=${databaseParam},
          filePath=["${String(filePath ?? "")}"],
          delimiter=["${String(formValuesLocal.DELIMITER ?? "")}"],
          metamodel=${JSON.stringify(metamodel)},
          dataTypeMap=[${JSON.stringify(dataTypes)}],
          newHeaders=[${JSON.stringify(newHeaders)}],
          additionalDataTypes=[${JSON.stringify(additionalDataTypes)}],
          descriptionMap=[${JSON.stringify(descriptionMap)}],
          logicalNamesMap=[${JSON.stringify(logicalNamesMap)}],
          existing=${existingParam}
        );`;

				pixelCommands.push(command);
			});

			const meta = {
				...(formValuesLocal.DATABASE_DESCRIPTION && {
					description: formValuesLocal.DATABASE_DESCRIPTION,
				}),
				...(formValuesLocal.DATABASE_TAG && {
					tag: formValuesLocal.DATABASE_TAG,
				}),
			};

			const response = await monolithStore.runQuery(
				`${pixelCommands.join("")}SetDatabaseMetadata(database=[${JSON.stringify(formValuesLocal.DATABASE_NAME)}], meta=[${JSON.stringify(meta)}]);`,
			);

			if (response.errors.length > 0) {
				notification.add({
					color: "error",
					message: response.errors.join(""),
				});

				return;
			}

			const databaseId = response.pixelReturn[0].output.database_id;

			notification.add({
				color: "success",
				message: "Successfully created database",
			});

			navigate(`/engine/database/${databaseId}`);
		} catch {
			notification.add({
				color: "error",
				message: "An error occurred while submitting the metamodel.",
			});
		} finally {
			setLoading(false);
		}
	};

	const submitExcelTablePixel = async (payloadArray, formValues) => {
		setLoading(true);
		let pixelStatements = payloadArray
			.map((payloadObject) => {
				return `RdbmsUploadExcelData(database=["${formValues.DATABASE_NAME}"],filePath=${JSON.stringify(payloadObject.filePath)},dataTypeMap=[${JSON.stringify(payloadObject.dataTypeMap)}],newHeaders=[${JSON.stringify(payloadObject.newHeaders)}],additionalDataTypes=[${JSON.stringify(payloadObject.additionalDataTypes)}],descriptionMap=[${JSON.stringify(payloadObject.descriptionMap)}],logicalNamesMap=[${JSON.stringify(payloadObject.logicalNamesMap)}],existing=[${payloadObject.existing}],tables=[${JSON.stringify(payloadObject.tables)}]);`;
			})
			.join("");
		const meta = {
			...(formValues.DATABASE_DESCRIPTION && {
				description: formValues.DATABASE_DESCRIPTION,
			}),
			...(formValues.DATABASE_TAG && {
				tag: formValues.DATABASE_TAG,
			}),
		};
		pixelStatements += `SetDatabaseMetadata(database=["${formValues.DATABASE_NAME}"],meta=[${JSON.stringify(meta)}])`;
		try {
			const response = await monolithStore.runQuery(pixelStatements);
			const { output } = response.pixelReturn[0];
			const hasError = response.pixelReturn.some((res) =>
				res.operationType.includes("ERROR"),
			);
			if (hasError) {
				response.pixelReturn.forEach((res) => {
					if (res.operationType.includes("ERROR")) {
						notification.add({
							color: "error",
							message: res.output,
						});
					}
				});
			} else {
				notification.add({
					color: "success",
					message: "Successfully Created Database",
				});
			}
			navigate(`/engine/database/${output.database_id}`);
		} catch {
			notification.add({
				color: "error",
				message: "An error occurred while processing the request.",
			});
		} finally {
			setLoading(false);
		}
	};
	const submitTablePixel = async (payloadObject, formValues) => {
		setLoading(true);
		let pixel = payloadObject
			.map((pixel) => {
				return `RdbmsUploadTableData(database=["${formValues.DATABASE_NAME}"],filePath=["${pixel.filePath}"],delimiter=["${formValues.DELIMITER}"],dataTypeMap=[${JSON.stringify(pixel.dataTypeMap)}],newHeaders=[${JSON.stringify(pixel.newHeaders)}],additionalDataTypes=[${JSON.stringify(pixel.additionalDataTypes)}],descriptionMap=[${JSON.stringify(pixel.descriptionMap)}],logicalNamesMap=[${JSON.stringify(pixel.logicalNamesMap)}],existing=[${JSON.stringify(pixel.existing)}],table=[${JSON.stringify(pixel.table)}]);`;
			})
			.join("");
		const meta = {
			...(formValues.DATABASE_DESCRIPTION && {
				description: formValues.DATABASE_DESCRIPTION,
			}),
			...(formValues.DATABASE_TAG && {
				tag: formValues.DATABASE_TAG,
			}),
		};
		pixel += `SetDatabaseMetadata(database=["${formValues.DATABASE_NAME}"],meta=[${JSON.stringify(meta)}])`;

		try {
			const response = await monolithStore.runQuery(pixel);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.includes("ERROR")) {
				notification.add({
					color: "error",
					message: output,
				});
				return;
			}

			notification.add({
				color: "success",
				message: "Successfully created database",
			});

			navigate(`/engine/database/${output.database_id}`);
		} catch {
			notification.add({
				color: "error",
				message: "An error occurred while processing the request.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setStep("fileupload");
		setUploadedFile(uploadedFile);
	};

	const submitConnections = async (
		payload: ParsedResult | ParsedResult[],
		formValues,
	) => {
		const newFormValues = Object.fromEntries(
			Object.entries(formValues).filter(
				([key]) =>
					key !== "NAME" &&
					key !== "DATABASE_DESCRIPTION" &&
					key !== "DATABASE_TAGS",
			),
		);
		const meta = {
			...(formValues.DATABASE_DESCRIPTION && {
				description: formValues.DATABASE_DESCRIPTION,
			}),
			...(formValues.DATABASE_TAG && {
				tag: formValues.DATABASE_TAG,
			}),
		};
		const relation = Array.isArray(payload)
			? payload[0].relation
			: payload.relation;
		const positions = Array.isArray(payload)
			? payload[0].positions
			: payload.positions;
		const tables = Object.entries(payload[0]?.nodeProp).reduce(
			(acc, [key, value]) => {
				const firstKey = value[0];
				acc[`${key}.${firstKey}`] = value;
				return acc;
			},
			{},
		);
		setLoading(true);
		const pixel = `databaseVar = RdbmsExternalUpload(conDetails=[${JSON.stringify(newFormValues)}],database=["${formValues.NAME}"], metamodel=[{"relationships":${JSON.stringify(relation)},"tables":${JSON.stringify(tables)}}]);SetDatabaseMetadata(database=[databaseVar],meta=[${JSON.stringify(meta)}]);SaveOwlPositions(database=[databaseVar],positionMap=[${JSON.stringify(positions)}]);`;
		try {
			const response = await monolithStore.runQuery(pixel);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.includes("ERROR")) {
				notification.add({ color: "error", message: output });
				return;
			}
			notification.add({
				color: "success",
				message: "Successfully created database.",
			});
			navigate(`/engine/database/${output.database_id}`);
		} catch {
			notification.add({
				color: "error",
				message: "An error occurred while processing the request.",
			});
		} finally {
			setLoading(false);
		}
	};
	//biome-ignore lint/correctness/useExhaustiveDependencies: this functional dependencies cannot be added
	useEffect(() => {
		resolvedFields.forEach((f) => {
			let pixel = f.pixel;
			let optionsPixel = f.options?.pixel;

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
								options: {
									...f.options,
									options: output.map((opt) => ({
										display: opt[f.options.optionDisplay],
										value: opt[f.options.optionValue],
									})),
								},
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
			render={({ field, fieldState: { error } }) => {
				switch (val.type) {
					case "text":
						return (
							<TextField
								{...field}
								fullWidth
								label={val.label}
								disabled={val.disabled}
								variant="outlined"
								required={val?.required}
								sx={{ display: val.hidden ? "none" : "block" }}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`database-form-input-${val.key}`}
								onChange={(e) => {
									field.onChange(e);
									if (val.rules?.custom) {
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
						);

					case "password":
						return (
							<TextField
								{...field}
								type="password"
								fullWidth
								label={val.label}
								disabled={val.disabled}
								required={val?.required}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`database-form-input-${val.key}`}
							/>
						);

					case "number":
						return (
							<TextField
								{...field}
								type="number"
								fullWidth
								label={val.label}
								disabled={val.disabled}
								required={val?.required}
								sx={{ display: val.hidden ? "none" : "block" }}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`database-form-input-${val.key}`}
							/>
						);

					case "select":
						return (
							<Select
								{...field}
								fullWidth
								label={val.label}
								disabled={val.disabled}
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
								data-testid={`database-form-input-${val.key}`}
							>
								{val?.options?.options?.map((opt) => (
									<Menu.Item
										key={opt.value}
										value={opt.value}
										data-testid={`database-form-option-${val.key}-${opt.value}`}
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
								data-testid={`database-form-input-${val.key}`}
								sx={{ display: val.hidden ? "none" : "block" }}
							>
								{val.options.options.map((opt) => (
									<FormControlLabel
										key={opt.value}
										value={opt.value}
										control={
											<RadioGroup.Item
												data-testid={`database-form-radio-${val.key}-${opt.value}`}
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
								<FileDropzone
									multiple
									key={dropzoneKey}
									value={field.value || []}
									disabled={val.disabled}
									extensions={val.options?.extensions || []}
									onChange={(files) => {
										field.onChange(files);
										onFileUpload(files);
										setDropzoneKey(Date.now()); // Reset dropzone
									}}
									data-testid={`database-form-input-${val.key}`}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										data-testid={`database-form-error-${val.key}`}
									>
										{getHelperText(error, val)}
									</Typography>
								)}
							</>
						);

					case "zip-upload":
						return (
							<>
								<FileDropzone
									multiple
									value={field.value || []}
									disabled={val.disabled}
									onChange={(newValues) =>
										field.onChange(newValues)
									}
									data-testid={`database-form-input-${val.key}`}
								/>
								{error && (
									<Typography
										variant="caption"
										color="error"
										data-testid={`database-form-error-${val.key}`}
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
									data-testid={`database-form-input-${val.key}`}
									sx={{
										display: val.hidden ? "none" : "block",
									}}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										sx={{ mt: 0.5, display: "block" }}
										data-testid={`database-form-error-${val.key}`}
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
								data-testid={`database-form-input-${val.key}`}
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
	function transformStructure(dbObject) {
		const result = {
			headers: [],
			dataTypes: {},
			cleanHeaders: [],
			relation: [],
			nodeProp: {},
			positions: {},
		};

		dbObject.tables.forEach((table, _index) => {
			// Extract clean column names and types
			const columnMap = {};
			table.columns.forEach((col, i) => {
				columnMap[col] = table.type[i]?.toLowerCase() || "string";
				result.dataTypes[col] =
					table.type[i]?.toLowerCase() || "string";
			});

			// Add to nodeProp
			result.nodeProp[table.table] = table.columns;

			// Add headers
			result.headers.push(...table.columns);
		});

		// Add relationships
		if (dbObject.relationships && dbObject.relationships.length > 0) {
			result.relation = dbObject.relationships.map((r) => ({
				fromTable: r.fromTable,
				fromCol: r.fromCol,
				toTable: r.toTable,
				toCol: r.toCol,
			}));
		}

		// Remove duplicates
		result.headers = [...new Set(result.headers)];
		result.cleanHeaders = result.headers.map(
			(h) => h.charAt(0).toUpperCase() + h.slice(1).toLowerCase(),
		);

		result.positions = dbObject.positions;
		return result;
	}

	const filteredTables =
		(connectionValues as { tables?: unknown[] } | null)?.tables ?? [];
	const filteredViews = connectionValues?.views;
	const handleApply = async (output) => {
		setConnectionViewModel(false);
		const filter = [...output.tables, ...output.views];
		setLoading(true);
		const pixel = `ExternalJdbcSchema(conDetails=[${JSON.stringify(
			formData,
		)}], filters=${JSON.stringify(filter)})`;

		try {
			const response = await monolithStore.runQuery(pixel);
			const { output, operationType } = response.pixelReturn[0];
			const parsedOutput = transformStructure(output);
			setParsedData([parsedOutput]);
			if (operationType.includes("ERROR")) {
				notification.add({
					color: "error",
					message: output,
				});
				return;
			}
			setStep("connections");
		} catch {
			notification.add({
				color: "error",
				message: "An error occurred while processing the request.",
			});
		} finally {
			setLoading(false);
		}
	};
	return (
		<>
			{step === "fileupload" && (
				<form
					onSubmit={handleSubmit(onFormSubmit)}
					data-testid="database-form"
				>
					<Typography variant="h4" data-testid="database-form-title">
						{title}
					</Typography>
					<Typography
						variant="body1"
						color="textSecondary"
						data-testid="database-form-description"
						sx={{ marginTop: "4px" }}
					>
						{description}
					</Typography>
					<StyledBox data-testid="database-form-box">
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
												data-testId={`database-importForm-category-title`}
											>
												{category}
											</Typography>
											<Typography
												variant="body2"
												data-testId={`model-importForm-category-description`}
												color="textSecondary"
											>
												{categoryDescriptions[
													category
												] ??
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
									<AdvancedHeader data-testid="database-form-advanced-header">
										<Typography variant="h6">
											ADVANCED SETTINGS
										</Typography>
										<IconButton
											onClick={() =>
												setOpenAdvanced(!openAdvanced)
											}
											data-testid="database-form-advanced-toggle"
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
												data-testid={`database-form-field-${val.key}`}
											>
												{renderControllerField(val)}
											</div>
										))}
								</>
							) : null}
						</Stack>

						<StyledFlexEnd data-testid="database-form-actions">
							<StyledSubmitButton
								type="submit"
								variant="contained"
								data-testid="database-form-submit"
								disabled={
									!formState.isValid || isValidDatabaseName
								}
							>
								Next
							</StyledSubmitButton>
						</StyledFlexEnd>
					</StyledBox>
				</form>
			)}
			{step === "table" &&
				parsedData &&
				parsedData.length > 0 &&
				(title === "Excel" ? (
					<ExcelDataSelection
						files={parsedData}
						fileName={excelfileName}
						onImport={(payloadArray) =>
							submitExcelTablePixel(payloadArray, formValues)
						}
						onCancel={handleCancel}
					/>
				) : (
					<DataSelection
						files={parsedData}
						fileName={excelfileName}
						tableName={tableName}
						onImport={(payload) =>
							submitTablePixel(payload, formValues)
						}
						onCancel={handleCancel}
					/>
				))}

			{step === "metaModel" && parsedData && parsedData.length > 0 && (
				<MetaModelType
					parsedData={parsedData}
					onImport={(payload: ParsedResult | ParsedResult[]) =>
						submitMetamodelPixel(payload, formValues)
					}
					onCancel={handleCancel}
				/>
			)}
			{step === "propFile" && <div>Prop file logic UI goes here</div>}
			{step === "connections" && parsedData && parsedData.length > 0 && (
				<MetaModelConnections
					parsedData={parsedData}
					onImport={(payload: ParsedResult | ParsedResult[]) =>
						submitMetamodelPixel(payload, formValues)
					}
					onImportConnections={(
						payload: ParsedResult | ParsedResult[],
					) => submitConnections(payload, formValues)}
					onCancel={handleCancel}
				/>
			)}
			<Modal
				open={connectionViewModel}
				maxWidth="xl"
				onClose={() => setConnectionViewModel(false)}
				data-testid="model-zip-upload-modal"
			>
				<Modal.Content sx={{ width: "100%" }}>
					{/* <StyledDropzoneField> */}
					<TableViewSelector
						tables={filteredTables}
						views={filteredViews}
						onApply={handleApply}
						onClose={() => setConnectionViewModel(false)}
					/>
				</Modal.Content>
			</Modal>
		</>
	);
};
