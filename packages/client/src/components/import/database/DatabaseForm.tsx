import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Box, Radio } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Checkbox,
	Divider,
	FileDropzone,
	FormControlLabel,
	Grid,
	IconButton,
	Menu,
	RadioGroup,
	Select,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useRootStore, useStepper } from "@/hooks";
import DataSelection from "./DataSelection";
import ExcelDataSelection from "./ExcelDataSelection";
import { MetaModelType } from "./MetaModelType";


const StyledBox = styled(Box)({
	boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
	width: "100%",
	padding: "16px 16px 16px 16px",
	marginBottom: "32px",
	marginTop: "15px",
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

const StyledNoSection = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	marginBottom: theme.spacing(2),
}));

const SectionContainer = styled(Grid)({
	padding: "20px",
});

const SectionLeft = styled(Grid)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "flex-start",
	paddingRight: theme.spacing(2),
	width: "40%",
}));

const SectionRight = styled(Grid)(() => ({
	display: "flex",
	flexDirection: "column",
	gap: "16px",
	width: "60%",
}));

const AdvancedHeader = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
	alignItems: "center",
	padding: theme.spacing(2, 0),
}));

interface ParsedResult {
	headers: string[];
	dataTypes: Record<string, string>;
	cleanHeaders: string[];
	positions: Record<string, { left: number; top: number }>;
	relation: { relName: string; fromTable: string; toTable: string }[];
	nodeProp: Record<string, string[]>;
}

export const DatabaseForm = ({ title, description, fields }) => {
	const [step, setStep] = useState<
		"fileupload" | "table" | "metaModel" | "propFile"
	>("fileupload");
	const [openAdvanced, setOpenAdvanced] = useState(false);
	const [resolvedFields, setResolvedFields] = useState(fields);
	const [parsedData, setParsedData] = useState<ParsedResult[]>([]);
	const [excelfileName, setExcelFileName] = useState<string[]>([]);
	const [fileName, setFileName] = useState<string>("");
	const [filePath, setFilePath] = useState<string>();
	const [uploadedFile, setUploadedFile] = useState<File[]>([]);
	const [formValues, setFormValues] = useState({});

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

	const { control, handleSubmit, watch, setValue, setFocus, formState } =
		useForm({
			mode: "onChange",
			reValidateMode: "onChange",
			defaultValues: fields.reduce((acc, f) => {
				acc[f.fieldName] = f.defaultValue || "";
				return acc;
			}, {}),
		});

	const watchedFieldRef = useRef({});
	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
	const navigate = useNavigate();
	const { setIsLoading } = useStepper();

	const defaultFields = resolvedFields.filter((f) => !f.advanced);
	const advancedFields = resolvedFields.filter((f) => f.advanced);

	const databaseType = watch("DATABASE_TYPE");

	useEffect(() => {
		setResolvedFields((prev) =>
			prev.map((f) => {
				if (f.fieldName === "METAMODEL_TYPE") {
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
										(orig) =>
											orig.fieldName === "METAMODEL_TYPE",
									)?.options.options || f.options.options,
							},
						};
					}
				}
				return f;
			}),
		);
	}, [databaseType, fields]);

	const onFormSubmit = async (formData) => {
		setIsLoading(true);
		setFormValues(formData);

		try {
			const uploadedFiles = await monolithStore.uploadFile(
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
				setIsLoading(false);
				return;
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
					title === "Excel"
						? fileNames.push(name)
						: setFileName(name);
				}
				setFilePath(filePathFromExpression);
				parsedResults.push(output);
			}
			setExcelFileName(fileNames);
			setParsedData(parsedResults);
			updateStepBasedOnMetaModel(formData.METAMODEL_TYPE);
		} catch (error) {
			console.error("Upload error:", error);
			notification.add({
				color: "error",
				message: "An error occurred during upload.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const watchFile = filePath;
	const newHeaders: Record<string, unknown> = {};

	const submitMetamodelPixel = async (parsedData, formValues) => {
		setIsLoading(true);
		if (!parsedData?.length || !parsedData[0]) {
			notification.add({
				color: "error",
				message: "Data is missing or invalid.",
			});
			return;
		}

		const { dataTypes, additionalDataTypes, relation, nodeProp } =
			parsedData[0];
		const logicalNamesMap = {};
		const descriptionMap = {};
		const metamodel = [
			{
				relation,
				nodeProp,
			},
		];
		const pixel = `
            databaseVar = RdbmsCsvUpload(
                database=["${formValues.DATABASE_NAME}"],
                filePath=["${watchFile}"],
                delimiter=["${formValues.DELIMITER}"],
                metamodel=${JSON.stringify(metamodel)},
                newHeaders=[${JSON.stringify(newHeaders)}],
                additionalDataTypes=[${JSON.stringify(additionalDataTypes)}],
                dataTypeMap=[${JSON.stringify(dataTypes)}],
                descriptionMap=[${JSON.stringify(descriptionMap)}],
                logicalNamesMap=[${JSON.stringify(logicalNamesMap)}],
                existing=[false]
            );
            ExtractDatabaseMeta(database=[databaseVar]);
           
        `;
		const response = await monolithStore.runQuery(pixel);

		const { output, operationType } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			notification.add({
				color: "error",
				message: output,
			});
			setIsLoading(false);
			return;
		} else {
			notification.add({
				color: "success",
				message: "success",
			});
			setIsLoading(false);
			navigate(`/engine/database/${output.database_id}`);
		}
	};

	const submitExcelTablePixel = async (payloadArray, formValues) => {
		const pixelStatements = payloadArray
			.map((payloadObject) => {
				return `RdbmsUploadExcelData(database=["${formValues.DATABASE_NAME}"],filePath=${JSON.stringify(payloadObject.filePath)},dataTypeMap=[${JSON.stringify(payloadObject.dataTypeMap)}],newHeaders=[${JSON.stringify(payloadObject.newHeaders)}],additionalDataTypes=[${JSON.stringify(payloadObject.additionalDataTypes)}],descriptionMap=[${JSON.stringify(payloadObject.descriptionMap)}],logicalNamesMap=[${JSON.stringify(payloadObject.logicalNamesMap)}],existing=[${payloadObject.existing}],tables=[${JSON.stringify(payloadObject.tables)}]);`;
			})
			.join("");

		try {
			const response = await monolithStore.runQuery(pixelStatements);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.includes("ERROR")) {
				notification.add({ color: "error", message: output });
				return;
			}
			notification.add({ color: "success", message: "Success" });
			navigate(`/engine/database/${output.database_id}`);
		} catch (error) {
			notification.add({
				color: "error",
				message: "An error occurred while processing the request.",
			});
			console.error("Error executing query:", error);
		}
	};
	const submitTablePixel = async (payloadObject, formValues) => {
		const pixel = `RdbmsUploadTableData(
            database=["${formValues.DATABASE_NAME}"],
            filePath=["${watchFile}"],
            delimiter=["${formValues.DELIMITER}"],
            dataTypeMap=[${JSON.stringify(payloadObject.dataTypeMap)}],
            newHeaders=[${JSON.stringify(payloadObject.newHeaders)}],
            additionalDataTypes=[${JSON.stringify(
				payloadObject.additionalDataTypes,
			)}],
            descriptionMap=[${JSON.stringify(payloadObject.descriptionMap)}],
            logicalNamesMap=[${JSON.stringify(payloadObject.logicalNamesMap)}],
            existing=[false]
          );`;

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
				message: "Success",
			});

			navigate(`/engine/database/${output.database_id}`);
		} catch (error) {
			notification.add({
				color: "error",
				message: "An error occurred while processing the request.",
			});
			console.error("Error executing query:", error);
		}
	};

	const handleCancel = () => {
		setStep("fileupload");
		setUploadedFile(uploadedFile);
	};

	useEffect(() => {
		resolvedFields.forEach((f) => {
			let pixel = f.pixel;
			let optionsPixel = f.options?.pixel;

			fieldsToWatch.forEach((name: keyof typeof watch) => {
				const val = watch(name);
				if (watchedFieldRef.current[name] !== undefined && val) {
					pixel = pixel?.replaceAll(`<${name}>`, val);
					optionsPixel = optionsPixel?.replaceAll(`<${name}>`, val);
				}
			});

			if (pixel && !hasParameterizedValue(pixel)) {
				executeWatchedFieldPixel(f.fieldName, pixel, "value");
			}

			if (optionsPixel && !hasParameterizedValue(optionsPixel)) {
				executeWatchedFieldPixel(f.fieldName, optionsPixel, "options");
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

	const executeWatchedFieldPixel = async (fieldName, pixelStr, type) => {
		const response = await monolithStore.runQuery(pixelStr);
		const output = response.pixelReturn[0].output;
		const operationType = response.pixelReturn[0].operationType;

		if (operationType.includes("ERROR")) {
			notification.add({ color: "error", message: output });
			return;
		}

		if (type === "value") {
			setValue(fieldName, output);
			return;
		}

		if (type === "options") {
			setResolvedFields((prev) =>
				prev.map((f) =>
					f.fieldName === fieldName
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
			userInput,
		);

		const response = await monolithStore.runQuery(pixelToExecute);
		const output = response.pixelReturn[0].output;
		const operationType = response.pixelReturn[0].operationType;

		if (operationType.includes("ERROR")) {
			notification.add({ color: "error", message: output });
			return false;
		}

		if (output.exists) {
			setFocus(field.fieldName);
			return false;
		}

		return true;
	};

	const checkForDisplayRulesSet = (field, value) => {
		const selectedDefaultField = resolvedFields.find(
			(f) => f.fieldName === field.name,
		);
		if (selectedDefaultField?.displayRules?.hideOtherFields) {
			selectedDefaultField.displayRules.hideOtherFields.forEach((fth) => {
				const optionValue = fth.value;
				setResolvedFields((prev) =>
					prev.map((f) =>
						f.fieldName === fth.fieldName
							? { ...f, hidden: optionValue.includes(value) }
							: f,
					),
				);
			});
		}
	};

	const renderControllerField = (val) => (
		<Controller
			key={val.fieldName}
			name={val.fieldName}
			control={control}
			rules={{
				required: val.rules?.required,
				pattern: val.rules?.pattern,
				validate: val.rules?.custom && {
					checkField: async (fieldVal) =>
						validateFormField(val, fieldVal),
				},
			}}
			render={({ field, fieldState: { error } }) => {
				
				switch (val.options.component) {
					case "text-field":
						return (
							
							<TextField
								{...field}
								fullWidth
								label={val.label}
								disabled={val.disabled}
								required={val.rules?.required}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`database-form-input-${val.fieldName}`}
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
								required={val.rules?.required}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`database-form-input-${val.fieldName}`}
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
								required={val.rules?.required}
								// @ts-expect-error TODO FIX
								error={!!error}
								helperText={getHelperText(error, val)}
								data-testid={`database-form-input-${val.fieldName}`}
							/>
						);

					case "select":
						return (
							<Select
								{...field}
								fullWidth
								label={val.label}
								disabled={val.disabled}
								required={val.rules?.required}
								error={!!error}
								helperText={getHelperText(error, val)}
								onChange={(e) => {
									field.onChange(e);
									checkForDisplayRulesSet(
										field,
										e.target.value,
									);
								}}
								data-testid={`database-form-input-${val.fieldName}`}
							>
								{val?.options?.options?.map((opt) => (
									<Menu.Item
										key={opt.value}
										value={opt.value}
										data-testid={`database-form-option-${val.fieldName}-${opt.value}`}
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
								data-testid={`database-form-input-${val.fieldName}`}
							>
								{val.options.options.map((opt) => (
									<FormControlLabel
										key={opt.value}
										value={opt.value}
										control={
											<Radio
												data-testid={`database-form-radio-${val.fieldName}-${opt.value}`}
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
									value={field.value || []}
									disabled={val.disabled}
									extensions={val.options?.extensions || []}
									onChange={(files) => {
										field.onChange(files);
										onFileUpload(files);
									}}
									data-testid={`database-form-input-${val.fieldName}`}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										data-testid={`database-form-error-${val.fieldName}`}
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
									data-testid={`database-form-input-${val.fieldName}`}
								/>
								{error && (
									<Typography
										variant="caption"
										color="error"
										data-testid={`database-form-error-${val.fieldName}`}
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
									required={val.rules.required}
									label={val.label}
									disabled={val.disabled}
									checked={field.value ? field.value : false}
									onChange={(value) => field.onChange(value)}
									data-testid={`database-form-input-${val.fieldName}`}
								/>
								{error && (
									<Typography
										variant="body1"
										color="error"
										sx={{ mt: 0.5, display: "block" }}
										data-testid={`database-form-error-${val.fieldName}`}
									>
										{error.message}
									</Typography>
								)}
							</>
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

	const SECTION_ORDER = Array.from(
		new Set<string>(
			defaultFields.map((f) => f.section?.toLowerCase()).filter(Boolean),
		),
	);
	console.log(parsedData, "parsedData");

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
						data-testid="database-form-description"
					>
						{description}
					</Typography>

					<StyledBox data-testid="database-form-box">
						<Stack rowGap={4}>
							{SECTION_ORDER.map((sectionKey) => {
								const sectionFields = defaultFields.filter(
									(f) =>
										f.section?.toLowerCase() === sectionKey,
								);
								if (!sectionFields.length) return null;

								const sectionDesc =
									sectionFields[0]?.sectiondescription || "";

								return (
									<div
										data-testid={`database-form-section-${sectionKey}`}
										key={sectionKey}
									>
										<SectionContainer container spacing={2}>
											<SectionLeft>
												<Typography
													variant="h6"
													gutterBottom
													data-testid={`database-form-section-title-${sectionKey}`}
												>
													{sectionKey.toUpperCase()}
												</Typography>
												<Typography
													variant="body2"
													color="textSecondary"
													data-testid={`database-form-section-desc-${sectionKey}`}
												>
													{sectionDesc}
												</Typography>
											</SectionLeft>
											<SectionRight
												data-testid={`database-form-section-fields-${sectionKey}`}
											>
												{sectionFields.map((val) => (
													<div
														key={val.fieldName}
														data-testid={`database-form-field-${val.fieldName}`}
													>
														{renderControllerField(
															val,
														)}
													</div>
												))}
											</SectionRight>
										</SectionContainer>
										<Divider
											data-testid={`database-form-section-divider-${sectionKey}`}
										/>
									</div>
								);
							})}

							{defaultFields.filter((f) => !f.section).length >
								0 && (
								<SectionContainer data-testid="database-form-no-section">
									{defaultFields
										.filter((f) => !f.section)
										.map((val) => (
											<StyledNoSection
												key={val.fieldName}
												data-testid={`database-form-field-${val.fieldName}`}
											>
												<Typography variant="body1">
													{val.label}
												</Typography>
												{renderControllerField(val)}
											</StyledNoSection>
										))}
								</SectionContainer>
							)}

							{advancedFields.length ? (
								<>
									<AdvancedHeader data-testid="database-form-advanced-header">
										<Typography variant="body1">
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
										advancedFields.map((val) => (
											<div
												key={val.fieldName}
												data-testid={`database-form-field-${val.fieldName}`}
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
								disabled={!formState.isValid}
							>
								Create Database
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
						fileName={fileName}
						onImport={(payload) =>
							submitTablePixel(payload, formValues)
						}
						onCancel={handleCancel}
					/>
				))}

			{step === "metaModel" && parsedData && parsedData.length > 0 && (
				<MetaModelType
					parsedData={parsedData}
					onImport={() =>
						submitMetamodelPixel(parsedData, formValues)
					}
					onCancel={handleCancel}
				/>
			)}
			{step === "propFile" && <div>Prop file logic UI goes here</div>}
		</>
	);
};
