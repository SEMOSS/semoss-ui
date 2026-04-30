/** biome-ignore-all lint/a11y/noStaticElementInteractions: legacy form layout relies on non-interactive wrappers with delegated events */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: legacy form layout relies on delegated keyboard handling */

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { console as getPixelConsole } from "@semoss/sdk/react";
import { PairedFileUpload, type PairedFileUploadRow } from "@semoss/shared";
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
import { useNavigate } from "@/hooks/useNavigate";
import DataSelection from "./flat-table-column-editor";
import ExcelDataSelection from "./flat-table-column-editor-excel";
import TableViewSelector from "./jdbc-table-selector";
import { MetaModelType } from "./metamodel-editor-csv";
import { MetaModelConnections } from "./metamodel-editor-jdbc";

const hasParameterizedValue = (str: string) => /<([^>]+)>/.test(str);
const CONSOLE_POLL_INTERVAL_MS = 1000;

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
		"fileUpload" | "table" | "metaModel" | "connections"
	>("fileUpload");
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
	const [pairedFiles, setPairedFiles] = useState<PairedFileUploadRow[]>([]);
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	const updateStepBasedOnMetaModel = (METAMODEL_TYPE) => {
		if (METAMODEL_TYPE === "asFlatTable") {
			setStep("table");
		} else if (METAMODEL_TYPE === "asSuggestedMetaModel") {
			setStep("metaModel");
		} else {
			setStep("fileUpload");
		}
	};

	const {
		control,
		handleSubmit,
		watch,
		getValues,
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
	const navigate = useNavigate();
	const defaultFields = resolvedFields;
	const advancedFields = advanced;
	const categoryDescriptions = categoryDescription;
	const [loading, setLoading] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState("Loading...");
	const [loadingLogMessages, setLoadingLogMessages] = useState<string[]>([]);
	const [openLoadingLog, setOpenLoadingLog] = useState(false);
	const databaseType = watch("DATABASE_TYPE");
	const metamodelType = watch("METAMODEL_TYPE");

	type MetaOpt = { display: string; value: string };
	const metamodelOptions = useMemo(() => {
		const type = databaseType?.toLowerCase();
		const allOpts: MetaOpt[] =
			(
				fields.find(
					(f: { key: string }) => f.key === "METAMODEL_TYPE",
				) as { options?: { options?: MetaOpt[] } } | undefined
			)?.options?.options ?? [];
		if (type === "rdf")
			return allOpts.filter((o) => o.value !== "asFlatTable");
		if (type === "r" || type === "h2")
			return allOpts.filter((o) => o.value === "asFlatTable");
		return allOpts;
	}, [databaseType, fields]);

	useEffect(() => {
		const isPropFile = metamodelType === "fromPropFile";
		setResolvedFields((prev) =>
			prev.map((f) => {
				if (f.key === "FILE_UPLOAD")
					return { ...f, hidden: isPropFile };
				if (f.key === "PROP_FILE_UPLOAD") return { ...f, hidden: true };
				return f;
			}),
		);
		if (!isPropFile) setPairedFiles([]);
	}, [metamodelType]);

	useEffect(() => {
		type MetaOpt = { display: string; value: string };
		const type = databaseType?.toLowerCase();
		const originalOptions: MetaOpt[] =
			fields.find(
				(orig: { key: string }) => orig.key === "METAMODEL_TYPE",
			)?.options?.options ?? [];
		let filteredOptions: MetaOpt[] = originalOptions;
		if (type === "rdf") {
			filteredOptions = originalOptions.filter(
				(opt: MetaOpt) => opt.value !== "asFlatTable",
			);
		} else if (type === "r" || type === "h2") {
			filteredOptions = originalOptions.filter(
				(opt: MetaOpt) => opt.value === "asFlatTable",
			);
		}
		const currentValue = getValues("METAMODEL_TYPE");
		const valueStillValid = filteredOptions.some(
			(opt: MetaOpt) => opt.value === currentValue,
		);
		if (!valueStillValid && filteredOptions[0]) {
			setValue("METAMODEL_TYPE", filteredOptions[0].value);
		}
		setResolvedFields((prev: Record<string, unknown>[]) =>
			prev.map((f: Record<string, unknown>) => {
				if (f.key !== "METAMODEL_TYPE") return f;
				return {
					...f,
					value: valueStillValid
						? currentValue
						: (filteredOptions[0]?.value ?? ""),
					options: { ...f.options, options: filteredOptions },
				};
			}),
		);
		// biome-ignore lint/correctness/useExhaustiveDependencies: getValues/setValue are stable react-hook-form refs
	}, [databaseType, fields]);

	const grouped = defaultFields.reduce((acc, f) => {
		if (!acc[f.category]) acc[f.category] = [];
		acc[f.category].push(f);
		return acc;
	}, {});

	const onFormSubmit = async (formData) => {
		setLoading(true);
		setLoadingMessage("Loading...");
		setFormValues(formData);
		if (selectedTab === "Connections") {
			setFormData(formData);
			const pixel = `
            ExternalJdbcTablesAndViews(conDetails=[${JSON.stringify(formData)}]);

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
				setConnectionValues(
					(response?.pixelReturn?.[0]
						?.output as ConnectionValuesType) || null,
				);
			} catch {
				toast.error("Error from ExternalJdbcTablesAndViews");
				setLoading(false);
			}
			setLoading(false);
			return;
		}

		if (formData.dbDriver) {
			if (formData.UPLOAD_MODE === "empty") {
				// Create an empty database without uploading a file
				try {
					const meta = {
						...(formData.DATABASE_DESCRIPTION && {
							description: formData.DATABASE_DESCRIPTION,
						}),
						...(formData.DATABASE_TAG && {
							tag: formData.DATABASE_TAG,
						}),
					};
					const pixel = `databaseVar = CreateEmptyRdbmsDatabase(database=[${JSON.stringify(formData.NAME)}], rdbmsType=[${JSON.stringify(formData.dbDriver)}], username=[${JSON.stringify(formData.USERNAME ?? "")}], password=[${JSON.stringify(formData.PASSWORD ?? "")}]);SetDatabaseMetadata(database=[databaseVar], meta=[${JSON.stringify(meta)}]);SyncDatabaseWithLocalMaster(database=[databaseVar]);`;
					const response = await monolithStore.runQuery(pixel);
					if (response.errors?.length > 0) {
						toast.error(response.errors.join(""));
						setLoading(false);
						return;
					}
					const engineOutput = response.pixelReturn[0].output as {
						engine_id?: string;
						database_id?: string;
					};
					const engineId =
						engineOutput.engine_id || engineOutput.database_id;
					toast.success("Successfully created database.");
					navigate(`/engine/database/${engineId}`);
				} catch {
					toast.error(
						"An error occurred while creating the database.",
					);
				}
				setLoading(false);
				return;
			}

			// File upload path: upload the file then run the external JDBC flow
			if (!formData.FILE_UPLOAD?.length) {
				toast.error("Please upload a file.");
				setLoading(false);
				return;
			}
			try {
				const uploadedFiles = await uploadFile(
					formData.FILE_UPLOAD,
					configStore.store.insightID,
				);
				if (
					!uploadedFiles ||
					!Array.isArray(uploadedFiles) ||
					uploadedFiles.length === 0
				) {
					toast.error("Upload failed or returned invalid response.");
					setLoading(false);
					return;
				}
				const { fileLocation } = uploadedFiles[0];
				// Build clean connection details: replace FILE_UPLOAD with the uploaded file path
				const {
					FILE_UPLOAD: _removed,
					UPLOAD_MODE: _mode,
					...rest
				} = formData;
				const connectionData = { ...rest, hostname: fileLocation };
				setFormData(connectionData);
				setFormValues(connectionData);
				const pixel = `ExternalJdbcTablesAndViews(conDetails=[${JSON.stringify(connectionData)}]);`;
				const response = await monolithStore.runQuery(pixel);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					toast.error(output as string);
					setLoading(false);
					return;
				}
				setConnectionViewModel(true);
				setConnectionValues(
					(response?.pixelReturn?.[0]
						?.output as ConnectionValuesType) || null,
				);
			} catch {
				toast.error("Error during file upload or database connection.");
			}
			setLoading(false);
			return;
		}
		if (formData.METAMODEL_TYPE === "fromPropFile") {
			// uploads handled inside the fromPropFile branch below
		}
		try {
			const uploadedFilesResponse =
				formData.METAMODEL_TYPE === "fromPropFile"
					? []
					: await uploadFile(
							formData.FILE_UPLOAD,
							configStore.store.insightID,
						);

			if (
				formData.METAMODEL_TYPE !== "fromPropFile" &&
				(!uploadedFilesResponse ||
					!Array.isArray(uploadedFilesResponse))
			) {
				toast.error("Upload failed or returned invalid response.");
				setValue("DATABASE_TYPE", formData.DATABASE_TYPE);
				setValue("METAMODEL_TYPE", formData.METAMODEL_TYPE);
				return;
			}

			let pixelExpressions: string[] = [];

			if (formData.METAMODEL_TYPE === "asFlatTable") {
				if (title === "Excel") {
					pixelExpressions = uploadedFilesResponse.map(
						(file) =>
							`PredictExcelDataTypes(filePath=["${file.fileLocation}"])`,
					);
				} else {
					pixelExpressions = uploadedFilesResponse.map(
						(file) =>
							`PredictDataTypes(filePath=["${file.fileLocation}"], delimiter=["${formData.DELIMITER}"], rowCount=[false])`,
					);
				}
			} else if (formData.METAMODEL_TYPE === "asSuggestedMetaModel") {
				pixelExpressions = uploadedFilesResponse.map(
					(file) =>
						`PredictMetamodel(filePath=["${file.fileLocation}"], delimiter=["${formData.DELIMITER}"], rowCount=[false])`,
				);
			} else if (formData.METAMODEL_TYPE === "excelLoaderSheetFormat") {
				try {
					const filePath = uploadedFilesResponse[0].fileLocation;
					const customBaseURI =
						formData.CUSTOM_BASE_URI ||
						"http://semoss.org/ontologies";
					const meta = {
						...(formData.DATABASE_DESCRIPTION && {
							description: formData.DATABASE_DESCRIPTION,
						}),
						...(formData.DATABASE_TAG && {
							tag: formData.DATABASE_TAG,
						}),
					};
					const pixel = `databaseVar = RdfLoaderSheetUpload(database=[${JSON.stringify(formData.DATABASE_NAME)}], filePath=["${filePath}"], customBaseURI=[${JSON.stringify(customBaseURI)}]);SetDatabaseMetadata(database=[databaseVar], meta=[${JSON.stringify(meta)}]);SyncDatabaseWithLocalMaster(database=[databaseVar]);`;
					const response = await runPixelWithConsole(pixel);
					if (response.errors?.length > 0) {
						toast.error(response.errors.join(""));
						return;
					}
					const out = response.pixelReturn[0].output as {
						engine_id?: string;
						database_id?: string;
					};
					toast.success("Successfully created database.");
					navigate(
						`/engine/database/${out.engine_id || out.database_id}`,
					);
				} catch {
					toast.error("An error occurred during Excel RDF upload.");
				} finally {
					setLoading(false);
				}
				return;
			} else if (formData.METAMODEL_TYPE === "fromPropFile") {
				const validPairs = pairedFiles.filter((r) => r.dataFile);
				if (validPairs.length === 0) {
					toast.error("Please upload at least one data file.");
					setLoading(false);
					return;
				}
				try {
					const parsedResults: ParsedResult[] = [];
					const names: string[] = [];
					let firstCsvPath: string | undefined;

					for (const pair of validPairs) {
						const [csvUpload, propUpload] = await Promise.all([
							uploadFile(
								[pair.dataFile as File],
								configStore.store.insightID,
							),
							pair.propFile
								? uploadFile(
										[pair.propFile as File],
										configStore.store.insightID,
									)
								: Promise.resolve(null),
						]);
						if (!csvUpload?.length) {
							toast.error(
								`Failed to upload ${(pair.dataFile as File).name}.`,
							);
							setLoading(false);
							return;
						}
						const csvPath = csvUpload[0].fileLocation;
						const propPath = propUpload?.[0]?.fileLocation;
						if (!firstCsvPath) firstCsvPath = csvPath;

						const pixel = propPath
							? `ParseMetamodel(filePath=["${csvPath}"], delimiter=["${formData.DELIMITER ?? ","}"], rowCount=[false], propFile=["${propPath}"])`
							: `PredictMetamodel(filePath=["${csvPath}"], delimiter=["${formData.DELIMITER ?? ","}"], rowCount=[false])`;
						const response = await monolithStore.runQuery(pixel);
						if (response.errors?.length > 0) {
							toast.error(response.errors.join(""));
							setLoading(false);
							return;
						}
						parsedResults.push(
							response?.pixelReturn?.[0]?.output as ParsedResult,
						);
						const name = csvPath.split(/[/\\]/).pop() || "";
						names.push(name);
					}

					setFilePath(firstCsvPath);
					setTableName(names.map((n) => n.replace(/\.[^.]+$/, "")));
					setExcelFileName(names);
					setParsedData(parsedResults);
					setStep("metaModel");
				} catch {
					toast.error(
						"An error occurred while processing the files.",
					);
				} finally {
					setLoading(false);
				}
				return;
			} else {
				pixelExpressions = uploadedFilesResponse.map(
					(file) =>
						`UploadDatabase(filePath=["${file.fileLocation}"],space=[""])`,
				);
			}

			const parsedResults: ParsedResult[] = [];
			const fileNames: string[] = [];

			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const output = response?.pixelReturn?.[0]?.output as {
					engine_id?: string;
					database_id?: string;
				} & ParsedResult;
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
				parsedResults.push(output as ParsedResult);
				if (title === "ZIP") {
					// engine_id is the current key; database_id is the legacy fallback
					navigate(
						`/engine/database/${output.engine_id || output.database_id}`,
					);
				}
			}
			const tableName = fileNames.map((name) =>
				name.replace(/\.[^.]+$/, ""),
			);
			setTableName(tableName);
			setExcelFileName(fileNames);
			setParsedData(parsedResults);
			if (formData.DATABASE_TYPE === "rdf") {
				setStep("metaModel");
			} else {
				updateStepBasedOnMetaModel(formData.METAMODEL_TYPE);
			}
		} catch {
			toast.error("An error occurred during upload.");
		} finally {
			setLoading(false);
		}
	};

	const runPixelWithConsole = async <O extends unknown[] | []>(
		pixel: string,
	) => {
		const insightId = configStore.store.insightID;
		if (!insightId) {
			throw new Error("Missing insight ID for database import request.");
		}

		let stopPolling = false;
		const pollConsole = async () => {
			while (!stopPolling) {
				try {
					const { message } = await getPixelConsole(insightId);

					if (Array.isArray(message) && message.length > 0) {
						let latestConsoleMessage = "";
						const cleanedMessages = message
							.map((entry) => String(entry ?? "").trim())
							.filter(Boolean);

						if (cleanedMessages.length > 0) {
							latestConsoleMessage =
								cleanedMessages[cleanedMessages.length - 1];
							setLoadingLogMessages((prev) => {
								const next = [...prev];
								for (const entry of cleanedMessages) {
									if (next[next.length - 1] !== entry) {
										next.push(entry);
									}
								}
								return next;
							});
						}

						if (latestConsoleMessage) {
							setLoadingMessage(latestConsoleMessage);
						}
					}
				} catch {
					// Ignore console polling failures; main query result decides success/failure.
				}

				await new Promise((resolve) =>
					setTimeout(resolve, CONSOLE_POLL_INTERVAL_MS),
				);
			}
		};

		const pollPromise = pollConsole();
		try {
			return await monolithStore.runQuery<O>(pixel, insightId);
		} finally {
			stopPolling = true;
			await pollPromise;
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

				const isRdf = formValuesLocal.DATABASE_TYPE === "rdf";
				const uploadReactor = isRdf ? "RdfCsvUpload" : "RdbmsCsvUpload";
				const customBaseURIParam = isRdf
					? `, customBaseURI=[${JSON.stringify(formValuesLocal.CUSTOM_BASE_URI || "http://semoss.org/ontologies")}]`
					: "";

				const command = `${assignmentPrefix}${uploadReactor}(
          database=${databaseParam},
          filePath=["${String(filePath ?? "")}"],
          delimiter=["${String(formValuesLocal.DELIMITER ?? "")}"],
          metamodel=${JSON.stringify(metamodel)},
          dataTypeMap=[${JSON.stringify(dataTypes)}],
          newHeaders=[${JSON.stringify(newHeaders)}],
          additionalDataTypes=[${JSON.stringify(additionalDataTypes)}],
          descriptionMap=[${JSON.stringify(descriptionMap)}],
          logicalNamesMap=[${JSON.stringify(logicalNamesMap)}]${customBaseURIParam},
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

			const engineOutput = response.pixelReturn[0].output as {
				engine_id?: string;
				database_id?: string;
			};
			// engine_id is the current key; database_id is the legacy fallback
			const engineId = engineOutput.engine_id || engineOutput.database_id;

			toast.success("Successfully created database");

			navigate(`/engine/database/${engineId}`);
		} catch {
			toast.error("An error occurred while submitting the metamodel.");
		} finally {
			setLoading(false);
		}
	};

	const submitExcelTablePixel = async (payloadArray, formValues) => {
		setLoading(true);
		setLoadingMessage("Starting database synchronization...");
		setLoadingLogMessages(["Starting database synchronization..."]);
		setOpenLoadingLog(false);
		let pixelStatements = payloadArray
			.map((payloadObject) => {
				return `newDbInfo=RdbmsUploadExcelData(database=["${formValues.DATABASE_NAME}"],filePath=${JSON.stringify(payloadObject.filePath)},dataTypeMap=[${JSON.stringify(payloadObject.dataTypeMap)}],newHeaders=[${JSON.stringify(payloadObject.newHeaders)}],additionalDataTypes=[${JSON.stringify(payloadObject.additionalDataTypes)}],descriptionMap=[${JSON.stringify(payloadObject.descriptionMap)}],logicalNamesMap=[${JSON.stringify(payloadObject.logicalNamesMap)}],existing=[${payloadObject.existing}],tables=[${JSON.stringify(payloadObject.tables)}]);SyncDatabaseWithLocalMaster(database=[newDbInfo]);`;
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
			const response = await runPixelWithConsole(pixelStatements);
			const output = response.pixelReturn[0].output as {
				engine_id?: string;
				database_id?: string;
			};
			if (response.errors?.length > 0) {
				toast.error(response.errors.join(""));
				return;
			}
			toast.success("Successfully created database");
			// engine_id is the current key; database_id is the legacy fallback
			navigate(
				`/engine/database/${output.engine_id || output.database_id}`,
			);
		} catch {
			toast.error("An error occurred while processing the request.");
		} finally {
			setLoading(false);
			setLoadingMessage("Loading...");
			setLoadingLogMessages([]);
			setOpenLoadingLog(false);
		}
	};

	const submitTablePixel = async (payloadObject, formValues) => {
		setLoading(true);
		setLoadingMessage("Starting database synchronization...");
		setLoadingLogMessages(["Starting database synchronization..."]);
		setOpenLoadingLog(false);
		let pixel = payloadObject
			.map((pixel) => {
				return `newDbInfo=RdbmsUploadTableData(database=["${formValues.DATABASE_NAME}"],filePath=["${pixel.filePath}"],delimiter=["${formValues.DELIMITER}"],dataTypeMap=[${JSON.stringify(pixel.dataTypeMap)}],newHeaders=[${JSON.stringify(pixel.newHeaders)}],additionalDataTypes=[${JSON.stringify(pixel.additionalDataTypes)}],descriptionMap=[${JSON.stringify(pixel.descriptionMap)}],logicalNamesMap=[${JSON.stringify(pixel.logicalNamesMap)}],existing=[${JSON.stringify(pixel.existing)}],table=[${JSON.stringify(pixel.table)}]);SyncDatabaseWithLocalMaster(database=[newDbInfo]);`;
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
			const response = await runPixelWithConsole(pixel);
			const output = response.pixelReturn[0].output as {
				engine_id?: string;
				database_id?: string;
			};
			if (response.errors?.length > 0) {
				toast.error(response.errors.join(""));
				return;
			}

			toast.success("Successfully created database");

			// engine_id is the current key; database_id is the legacy fallback
			navigate(
				`/engine/database/${output.engine_id || output.database_id}`,
			);
		} catch {
			toast.error("An error occurred while processing the request.");
		} finally {
			setLoading(false);
			setLoadingMessage("Loading...");
			setLoadingLogMessages([]);
			setOpenLoadingLog(false);
		}
	};

	const handleCancel = () => {
		setStep("fileUpload");
	};

	const submitExternalConnectionUpload = async (formValues) => {
		const newFormValues = Object.fromEntries(
			Object.entries(formValues).filter(
				([key]) =>
					key !== "NAME" &&
					key !== "DATABASE_DESCRIPTION" &&
					key !== "DATABASE_TAG" &&
					key !== "FILE_UPLOAD" &&
					key !== "relationships" &&
					key !== "tables" &&
					key !== "positions",
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
		setLoading(true);
		setLoadingMessage("Starting database synchronization...");
		setLoadingLogMessages(["Starting database synchronization..."]);
		setOpenLoadingLog(false);
		const pixel = `newDbInfo=RdbmsExternalUpload(conDetails=[${JSON.stringify(newFormValues)}],database=["${formValues.NAME}"], metamodel=[{"relationships":${JSON.stringify(formValues.relationships)},"tables":${JSON.stringify(formValues.tables)}}]);SetDatabaseMetadata(database=[newDbInfo],meta=[${JSON.stringify(meta)}]);SaveOwlPositions(database=[newDbInfo],positionMap=[${JSON.stringify(formValues.positions)}]);SyncDatabaseWithLocalMaster(database=[newDbInfo]);`;
		try {
			const response = await runPixelWithConsole(pixel);
			const output = response.pixelReturn[0].output as {
				engine_id?: string;
				database_id?: string;
			};
			if (response.errors?.length > 0) {
				toast.error(response.errors.join(""));
				return;
			}
			toast.success("Successfully created database.");
			// engine_id is the current key; database_id is the legacy fallback
			navigate(
				`/engine/database/${output.engine_id || output.database_id}`,
			);
		} catch {
			toast.error("An error occurred while processing the request.");
		} finally {
			setLoading(false);
			setLoadingMessage("Loading...");
			setLoadingLogMessages([]);
			setOpenLoadingLog(false);
		}
	};

	const submitConnections = async (
		payload: ParsedResult | ParsedResult[],
		formValues,
	) => {
		const normalizedPayload = Array.isArray(payload) ? payload[0] : payload;
		const tables = Object.entries(normalizedPayload?.nodeProp ?? {}).reduce(
			(acc, [key, value]) => {
				const firstKey = value[0];
				if (!firstKey) {
					return acc;
				}
				acc[`${key}.${firstKey}`] = value;
				return acc;
			},
			{},
		);

		await submitExternalConnectionUpload({
			...formValues,
			relationships: normalizedPayload?.relation ?? [],
			tables: tables,
			positions: normalizedPayload?.positions ?? {},
		});
	};

	const submitEmptyConnections = async (formValues) => {
		await submitExternalConnectionUpload({
			...formValues,
			relationships: [],
			tables: {},
			positions: {},
		});
	};
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

	const executeWatchedFieldPixel = useCallback(
		async (key: string, pixelStr: string, type: "value" | "options") => {
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
									options: {
										...f.options,
										options: (
											output as {
												[key: string]: string;
											}[]
										).map((opt) => ({
											display:
												opt[f.options.optionDisplay],
											value: opt[f.options.optionValue],
										})),
									},
								}
							: f,
					),
				);
			}
		},
		[monolithStore, setValue],
	);

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
	}, [resolvedFields, fieldsToWatch, watch, executeWatchedFieldPixel]);

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

		if ((output as { exists?: boolean }).exists) {
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

	// NEW: Helper functions for incremental file upload
	const onFileUpload = (
		files: File | File[],
		fieldOnChange: (value: File[]) => void,
		currentFiles: File[],
	) => {
		const fileArray = Array.isArray(files) ? files : [files];
		const existingFileNames = currentFiles.map((f: File) => f.name);
		const newFiles = fileArray.filter(
			(f) => !existingFileNames.includes(f.name),
		);
		fieldOnChange([...currentFiles, ...newFiles]);
	};

	const removeFile = (
		index: number,
		fieldOnChange: (value: File[]) => void,
		currentFiles: File[],
	) => {
		fieldOnChange(currentFiles.filter((_, i) => i !== index));
	};

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		fieldOnChange: (value: File[]) => void,
		currentFiles: File[],
	) => {
		const files = e.target.files;
		if (files && files?.length > 0) {
			onFileUpload(Array.from(files), fieldOnChange, currentFiles);
		}
		e.target.value = "";
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		fieldOnChange: (value: File[]) => void,
		currentFiles: File[],
	) => {
		e.preventDefault();
		e.stopPropagation();
		const files = e.dataTransfer.files;
		if (files && files?.length > 0) {
			onFileUpload(Array.from(files), fieldOnChange, currentFiles);
		}
	};

	const renderControllerField = (val) => (
		<Controller
			key={val.key}
			name={val.key}
			control={control}
			rules={{
				required: val?.required && !val?.hidden,
				pattern: val.rules?.pattern,
				validate:
					val.type === "file-upload" || val.type === "zip-upload"
						? (value) => {
								if (
									val.required &&
									!val.hidden &&
									(!value || value.length === 0)
								) {
									return "File upload is required";
								}
								return true;
							}
						: undefined,
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
										{(val.key === "METAMODEL_TYPE"
											? metamodelOptions
											: ((val?.options?.options ??
													[]) as MetaOpt[])
										).map((opt: MetaOpt) => (
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
									onValueChange={(value) => {
										field.onChange(value);
										checkForDisplayRulesSet(field, value);
									}}
									className="flex flex-wrap gap-4"
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
								className={`flex flex-col gap-2${val.hidden ? "hidden" : ""}`}
								data-testid={`database-form-field-${val.key}`}
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
								<div
									className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
									onClick={() =>
										fileInputRefs.current[val.key]?.click()
									}
									onDragOver={handleDragOver}
									onDrop={(e) =>
										handleDrop(
											e,
											field.onChange,
											field.value || [],
										)
									}
								>
									<input
										ref={(el) => {
											fileInputRefs.current[val.key] = el;
										}}
										type="file"
										accept={
											val.options?.extensions?.join(
												",",
											) || "*"
										}
										multiple={val.type === "file-upload"}
										className="hidden"
										onChange={(e) =>
											handleFileChange(
												e,
												field.onChange,
												field.value || [],
											)
										}
										disabled={val.disabled}
										data-testid={`database-form-input-${val.key}`}
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

								{/* File List - Using field.value */}
								{field.value && field.value?.length > 0 && (
									<div className="mt-2 flex flex-col gap-2">
										<P className="font-medium text-foreground text-sm">
											{field.value.length} file(s)
											selected:
										</P>
										<div className="flex max-h-[200px] max-w-full flex-col gap-1 overflow-auto rounded-md border border-border bg-muted/30 p-2">
											{field.value.map((file, index) => (
												<div
													key={`${file.name}-${index}`}
													className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-background px-3 py-2 transition-colors hover:bg-accent"
													data-testid={`uploaded-file-item-${index}`}
												>
													<div className="flex min-w-0 flex-1 items-center gap-2">
														<div className="min-w-0 flex-1">
															<P className="truncate text-foreground text-sm">
																{file.name}
															</P>
															<P className="text-muted-foreground text-xs">
																{(
																	file.size /
																	1024
																).toFixed(
																	2,
																)}{" "}
																KB
															</P>
														</div>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={(e) => {
															e.stopPropagation();
															removeFile(
																index,
																field.onChange,
																field.value ||
																	[],
															);
														}}
														className="size-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
														data-testid={`remove-file-btn-${index}`}
													>
														<X className="size-4" />
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

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
													Array.isArray(field.value)
														? field.value
														: [];
												if (
													currentTags.includes(value)
												) {
													e.currentTarget.value = "";
													return;
												}
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
										{field.value.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
											>
												{tag}
												<button
													type="button"
													onClick={() => {
														const newTags =
															field.value.filter(
																(existingTag) =>
																	existingTag !==
																	tag,
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
				<div className="w-full max-w-2xl px-4">
					<div className="flex flex-col items-center gap-5 rounded-md border border-border bg-card p-6">
						<div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<div className="flex flex-col items-center gap-1">
							<H4 className="text-center font-semibold text-lg tracking-tight">
								Syncing Database
							</H4>
							<Muted className="text-center text-sm leading-6">
								We are applying your database changes.
							</Muted>
						</div>
						<div className="flex w-full max-w-xl flex-col items-center gap-1">
							<Muted className="text-xs uppercase tracking-wide">
								Latest Status
							</Muted>
							<P className="text-center text-base leading-6">
								{loadingMessage}
							</P>
						</div>

						<Collapsible
							open={openLoadingLog}
							onOpenChange={setOpenLoadingLog}
						>
							<div className="flex w-full justify-center">
								<CollapsibleTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="gap-2 font-medium"
									>
										{openLoadingLog ? (
											<ChevronUp className="size-4" />
										) : (
											<ChevronDown className="size-4" />
										)}
										{openLoadingLog ? "Hide" : "Show"}{" "}
										Execution Log (
										{loadingLogMessages.length})
									</Button>
								</CollapsibleTrigger>
							</div>
							<CollapsibleContent>
								<div className="mt-3 max-h-64 overflow-auto rounded-md border border-border bg-background p-3">
									{loadingLogMessages.length > 0 ? (
										<div className="space-y-1.5">
											{loadingLogMessages.map(
												(entry, index) => (
													<P
														key={`${index}-${entry}`}
														className="break-words text-muted-foreground text-sm leading-6"
													>
														{entry}
													</P>
												),
											)}
										</div>
									) : (
										<P className="text-center text-muted-foreground text-sm">
											No console messages received yet.
										</P>
									)}
								</div>
							</CollapsibleContent>
						</Collapsible>
					</div>
				</div>
			</div>
		);
	}

	function transformStructure(dbObject) {
		const result: {
			headers: string[];
			dataTypes: Record<string, string>;
			physicalTypes: Record<string, string>;
			cleanHeaders: string[];
			relation: {
				relName: string;
				fromTable: string;
				fromCol?: string;
				toTable: string;
				toCol?: string;
			}[];
			nodeProp: Record<string, string[]>;
			positions: Record<string, { left: number; top: number }>;
		} = {
			headers: [],
			dataTypes: {},
			physicalTypes: {},
			cleanHeaders: [],
			relation: [],
			nodeProp: {},
			positions: {},
		};

		dbObject.tables.forEach((table) => {
			table.columns.forEach((col, i) => {
				result.dataTypes[col] = table.type[i] || "";
				if (table.raw_type?.[i]) {
					result.physicalTypes[col] = table.raw_type[i];
				}
			});

			result.nodeProp[table.table] = table.columns;
			result.headers.push(...table.columns);
		});

		if (dbObject.relationships && dbObject.relationships?.length > 0) {
			result.relation = dbObject.relationships.map((r) => ({
				relName: `${r.fromCol ?? r.fromTable}.${r.toCol ?? r.toTable}`,
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
	const normalizedTables = filteredTables as string[];
	const normalizedViews = (filteredViews as string[] | undefined) ?? [];
	const hasTableOptions = normalizedTables.length > 0;
	const hasViewOptions = normalizedViews.length > 0;
	const hasBothOptions = hasTableOptions && hasViewOptions;
	const hasSingleOptionType = hasTableOptions !== hasViewOptions;
	const connectionDialogClassName = hasBothOptions
		? "h-[92dvh] max-h-[980px] w-[96vw] max-w-[1500px] overflow-hidden p-0"
		: hasSingleOptionType
			? "h-[90dvh] max-h-[920px] w-[96vw] max-w-[980px] overflow-hidden p-0"
			: "max-h-[520px] w-[96vw] max-w-[640px] overflow-hidden p-0";

	const handleApply = async (output) => {
		setConnectionViewModel(false);
		const filter = [...output.tables, ...output.views];

		if (filter.length === 0) {
			await submitEmptyConnections(formData);
			return;
		}

		setLoading(true);
		const pixel = `ExternalJdbcSchema(conDetails=[${JSON.stringify(formData)}], filters=${JSON.stringify(filter)})`;

		try {
			const response = await monolithStore.runQuery(pixel);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.includes("ERROR")) {
				toast.error(output as string);
				return;
			}
			const parsedOutput = transformStructure(output);
			setParsedData([parsedOutput]);
			setStep("connections");
		} catch {
			toast.error("An error occurred while processing the request.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{step === "fileUpload" && (
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
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
								<div className="flex flex-1 flex-col gap-1">
									<H4
										className="font-semibold text-base tracking-tight"
										data-testid="database-importForm-category-title"
									>
										{category}
									</H4>
									<Muted
										className="text-muted-foreground text-sm leading-6"
										data-testid="database-importForm-category-description"
									>
										{categoryDescriptions[category] ??
											"No description available."}
									</Muted>
								</div>
								<div className="flex min-w-0 flex-[2] flex-col gap-2 py-2">
									{grouped[category].map((f) =>
										renderControllerField(f),
									)}
									{category === "File Upload" &&
										metamodelType === "fromPropFile" && (
											<PairedFileUpload
												columns={[
													{
														key: "dataFile",
														label: "Data File",
														extensions:
															resolvedFields.find(
																(f: {
																	key: string;
																}) =>
																	f.key ===
																	"FILE_UPLOAD",
															)?.options
																?.extensions ?? [
																".csv",
															],
														required: true,
													},
													{
														key: "propFile",
														label: "Prop File",
														extensions: [".json"],
													},
												]}
												value={pairedFiles}
												onChange={setPairedFiles}
											/>
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
								<div className="flex flex-row items-center justify-between gap-2">
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
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
											<div className="flex flex-1 flex-col gap-1">
												<Muted
													data-testid="database-advanced-settings-description"
													className="text-base"
												>
													Configure advanced database
													settings
												</Muted>
											</div>
											<div className="flex min-w-0 flex-[2] flex-col gap-2">
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

					<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button
							data-testid="database-form-connect-button"
							type="submit"
							className="w-full sm:w-auto"
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
					isRdf={
						(formValues as { DATABASE_TYPE?: string })
							.DATABASE_TYPE === "rdf"
					}
				/>
			)}

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
					className={connectionDialogClassName}
					showCloseButton={false}
					data-testid="model-zip-upload-modal"
				>
					<TableViewSelector
						tables={normalizedTables}
						views={normalizedViews}
						onApply={handleApply}
						onClose={() => setConnectionViewModel(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};
