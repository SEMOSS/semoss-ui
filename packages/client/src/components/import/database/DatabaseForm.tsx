/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
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
	Dialog,
	DialogContent,
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
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import DataSelection from "./DataSelection";
import ExcelDataSelection from "./ExcelDataSelection";
import { MetaModelConnections } from "./MetaModelConnections";
import { MetaModelType } from "./MetaModelType";
import TableViewSelector from "./TableViewModel";

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
	const [formValues, setFormValues] = useState({});
	const [isValidDatabaseName, setIsValidDatabaseName] =
		useState<boolean>(false);
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
	const fileInputRef = useRef<HTMLInputElement>(null);

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
	const { monolithStore, configStore } = useRootStore();
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
					}
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
				return f;
			}),
		);
	}, [databaseType, fields]);

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
					toast.error(output as string);
					setLoading(false);
					return;
				}
				setConnectionViewModel(true);
				setConnectionValues(response?.pixelReturn?.[0]?.output || null);
			} catch {
				toast.error("Error from ExternalJdbcTablesAndViews");
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
				toast.error("Upload failed or returned invalid response.");
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
				toast.error("Prop File is not implemented.");
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
			toast.error("An error occurred during upload.");
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

			if (!payloads || payloads?.length === 0) {
				toast.error("Data is missing or invalid.");
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

			if (response.errors?.length > 0) {
				toast.error(response.errors.join(""));
				return;
			}

			const databaseId = response.pixelReturn[0].output.database_id;

			toast.success("Successfully created database");

			navigate(`/engine/database/${databaseId}`);
		} catch {
			toast.error("An error occurred while submitting the metamodel.");
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
						toast.error(res.output);
					}
				});
			} else {
				toast.success("Successfully Created Database");
			}
			navigate(`/engine/database/${output.database_id}`);
		} catch {
			toast.error("An error occurred while processing the request.");
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
				toast.error(output);
				return;
			}

			toast.success("Successfully created database");

			navigate(`/engine/database/${output.database_id}`);
		} catch {
			toast.error("An error occurred while processing the request.");
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setStep("fileupload");
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
				toast.error(output);
				return;
			}
			toast.success("Successfully created database.");
			navigate(`/engine/database/${output.database_id}`);
		} catch {
			toast.error("An error occurred while processing the request.");
		} finally {
			setLoading(false);
		}
	};

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
			toast.error(output);
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
			toast.error(output);
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

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field,
	) => {
		const files = e.target.files;
		if (files && files?.length > 0) {
			const fileArray = Array.isArray(files)
				? Array.from(files)
				: [files[0]];
			field.onChange(fileArray);
			onFileUpload(fileArray);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>, field) => {
		e.preventDefault();
		e.stopPropagation();
		const files = e.dataTransfer.files;
		if (files && files?.length > 0) {
			const fileArray = Array.from(files);
			field.onChange(fileArray);
			onFileUpload(fileArray);
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
							<Field
								className={val.hidden ? "hidden" : ""}
								data-testid={`database-form-field-${val.key}`}
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
									data-testid={`database-form-input-${val.key}`}
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
								data-testid={`database-form-field-${val.key}`}
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
									data-testid={`database-form-input-${val.key}`}
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
								data-testid={`database-form-field-${val.key}`}
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
									data-testid={`database-form-input-${val.key}`}
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
								data-testid={`database-form-field-${val.key}`}
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
										data-testid={`database-form-input-${val.key}`}
									>
										<SelectValue
											placeholder={`Select ${val.label}`}
										/>
									</SelectTrigger>
									<SelectContent>
										{val?.options?.options?.map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
												data-testid={`database-form-option-${val.key}-${opt.value}`}
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
								data-testid={`database-form-field-${val.key}`}
							>
								<FieldLabel>{val.label}</FieldLabel>
								<RadioGroup
									value={field.value || ""}
									onValueChange={field.onChange}
									className="flex flex-row gap-4"
									data-testid={`database-form-input-${val.key}`}
								>
									{val.options.options.map((opt) => (
										<div
											key={opt.value}
											className="flex items-center gap-2"
										>
											<RadioGroupItem
												value={opt.value}
												id={`${val.key}-${opt.value}`}
												data-testid={`database-form-radio-${val.key}-${opt.value}`}
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
					case "zip-upload":
						return (
							<div
								className="flex flex-col gap-2"
								data-testid={`database-form-field-${val.key}`}
							>
								<P>{val.label}</P>
								<div
									className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
									onClick={() =>
										fileInputRef.current?.click()
									}
									onDragOver={handleDragOver}
									onDrop={(e) => handleDrop(e, field)}
								>
									<input
										ref={fileInputRef}
										type="file"
										accept={
											val.options?.extensions?.join(
												",",
											) || "*"
										}
										multiple={val.type === "file-upload"}
										className="hidden"
										onChange={(e) =>
											handleFileChange(e, field)
										}
										disabled={val.disabled}
										data-testid={`database-form-input-${val.key}`}
									/>
									{field.value && field.value?.length > 0 ? (
										<div className="text-center">
											<P className="font-medium text-foreground">
												{field.value?.length} file(s)
												selected
											</P>
											<P className="text-muted-foreground text-sm">
												Click or drag to replace
											</P>
										</div>
									) : (
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
									)}
								</div>
								{error && (
									<P
										className="text-destructive text-sm"
										data-testid={`database-form-error-${val.key}`}
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
								data-testid={`database-form-field-${val.key}`}
							>
								<Checkbox
									id={val.key}
									checked={field.value || false}
									onCheckedChange={field.onChange}
									disabled={val.disabled}
									data-testid={`database-form-input-${val.key}`}
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
										data-testid={`database-form-error-${val.key}`}
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
								data-testid={`database-form-field-${val.key}`}
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
									data-testid={`database-form-input-${val.key}`}
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
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<P>Loading...</P>
				</div>
			</div>
		);
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

		dbObject.tables.forEach((table) => {
			table.columns.forEach((col, i) => {
				result.dataTypes[col] =
					table.type[i]?.toLowerCase() || "string";
			});

			result.nodeProp[table.table] = table.columns;
			result.headers.push(...table.columns);
		});

		if (dbObject.relationships && dbObject.relationships?.length > 0) {
			result.relation = dbObject.relationships.map((r) => ({
				fromTable: r.fromTable,
				fromCol: r.fromCol,
				toTable: r.toTable,
				toCol: r.toCol,
			}));
		}

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
				toast.error(output);
				return;
			}
			setStep("connections");
		} catch {
			toast.error("An error occurred while processing the request.");
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
					className="my-4"
					autoComplete="off"
				>
					<div className="mb-6">
						<H4 data-testid="database-form-title">{title}</H4>
						<Muted
							className="mt-1 text-base"
							data-testid="database-form-description"
						>
							{description}
						</Muted>
					</div>

					{Object.keys(grouped).map((category) => (
						<div
							key={category}
							className="mb-4 flex flex-col gap-4"
						>
							<div className="flex items-start gap-4">
								<div className="flex flex-1 flex-col gap-1">
									<H4 data-testid="database-importForm-category-title">
										{category}
									</H4>
									<Muted data-testid="database-importForm-category-description" className="text-base">
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
									<H4 data-testid="database-advanced-settings-title">
										Advanced Settings
									</H4>
									<CollapsibleTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											data-testid="database-advanced-settings-toggle"
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
												<Muted data-testid="database-advanced-settings-description" className="text-base">
													Configure advanced database
													settings
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
							data-testid="database-form-connect-button"
							type="submit"
							disabled={
								loading ||
								!formState.isValid ||
								isValidDatabaseName
							}
						>
							Connect
						</Button>
					</div>
				</form>
			)}

			{step === "table" &&
				parsedData &&
				parsedData?.length > 0 &&
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

			{step === "metaModel" && parsedData && parsedData?.length > 0 && (
				<MetaModelType
					parsedData={parsedData}
					onImport={(payload: ParsedResult | ParsedResult[]) =>
						submitMetamodelPixel(payload, formValues)
					}
					onCancel={handleCancel}
				/>
			)}

			{step === "propFile" && <div>Prop file logic UI goes here</div>}

			{step === "connections" && parsedData && parsedData?.length > 0 && (
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

			<Dialog
				open={connectionViewModel}
				onOpenChange={setConnectionViewModel}
			>
				<DialogContent
					className="max-w-7xl"
					data-testid="model-zip-upload-modal"
				>
					<TableViewSelector
						tables={filteredTables}
						views={filteredViews}
						onApply={handleApply}
						onClose={() => setConnectionViewModel(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};
