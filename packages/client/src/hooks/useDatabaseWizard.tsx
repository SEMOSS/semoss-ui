import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import {
	ALLOWED_SQL_TYPES,
	type AllowedSqlType,
	normalizeSqlType,
} from "@/utils/databaseWizard/allowedTypes";
import {
	inferColumnTypes,
	normalizeCsvHeader,
	parseCsvData,
} from "@/utils/databaseWizard/csv";
import { schemaPrompt } from "@/utils/databaseWizard/schemaPrompt";
import { schemaToSql } from "@/utils/databaseWizard/schemaToSql";
import type { DatabaseSummary, WizardStep } from "@/utils/databaseWizard/types";

type LlmOption = { database_id: string; database_name: string };

type SchemaEditorColumn = {
	id: string;
	name: string;
	type: AllowedSqlType;
	description: string;
};

const defaultSchemaContract = {
	type: "object",
	properties: {
		schema: {
			type: "object",
			description:
				"An object where each key is a table name and the value contains table details.",
			patternProperties: {
				"^[a-zA-Z0-9_]+$": {
					type: "object",
					properties: {
						columns: {
							type: "object",
							description:
								"An object where each key is a column name and the value is an object containing its SQL data type and description.",
							patternProperties: {
								"^[a-zA-Z0-9_]+$": {
									type: "object",
									properties: {
										type: {
											type: "string",
											description:
												"SQL data type for the column.",
										},
										description: {
											type: "string",
											description:
												"A brief description of the column's purpose.",
										},
									},
									required: ["type", "description"],
								},
							},
							additionalProperties: false,
						},
						primary_key: { type: "string" },
						foreign_keys: {
							type: "object",
							description:
								"An object defining foreign key relationships.",
							patternProperties: {
								"^[a-zA-Z0-9_]+$": {
									type: "object",
									properties: {
										references: {
											type: "string",
											description:
												"The table this key references.",
										},
										on: {
											type: "string",
											description:
												"The column in the referenced table.",
										},
									},
									required: ["references", "on"],
								},
							},
						},
					},
					required: ["columns"],
				},
			},
			additionalProperties: false,
		},
		sample_data: {
			type: ["object", "null"],
			description:
				"An object where each key is a table name and the value is an array of data objects. Only include if requested.",
			patternProperties: {
				"^[a-zA-Z0-9_]+$": {
					type: "array",
					items: {
						type: "object",
						additionalProperties: {
							type: ["string", "number", "boolean", "null"],
						},
					},
				},
			},
			additionalProperties: false,
		},
	},
	required: ["schema"],
};

const MAX_CSV_INSERT_ROWS = 500;
const CSV_PREVIEW_ROWS = 20;

const createColumnId = () => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `col_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

type UseDatabaseWizardOptions = {
	mode?: "catalog" | "engine";
	databaseId?: string;
	onDatabaseCreated?: (databaseId: string) => void;
};

export function useDatabaseWizard(options: UseDatabaseWizardOptions = {}) {
	const { mode = "catalog", databaseId, onDatabaseCreated } = options;
	const { monolithStore, configStore } = useRootStore();
	const [step, setStep] = useState<WizardStep>(
		mode === "engine" ? "actions" : "select",
	);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<string | null>(null);
	const [databases, setDatabases] = useState<DatabaseSummary[]>([]);
	const [currentDatabaseId, setCurrentDatabaseId] = useState("");
	const [databaseName, setDatabaseName] = useState("");
	const [llms, setLlms] = useState<LlmOption[]>([]);
	const [selectedLlmId, setSelectedLlmId] = useState("");
	const [description, setDescription] = useState("");
	const [schemaJson, setSchemaJson] = useState("");
	const [schemaSql, setSchemaSql] = useState("");
	const [schemaMetadata, setSchemaMetadata] = useState("");
	const [schemaTableName, setSchemaTableName] = useState("");
	const [schemaColumns, setSchemaColumns] = useState<SchemaEditorColumn[]>(
		[],
	);
	const [schemaSampleData, setSchemaSampleData] = useState<Record<
		string,
		Array<Record<string, unknown>>
	> | null>(null);
	const [querySql, setQuerySql] = useState("");
	const [includeSampleData, setIncludeSampleData] = useState(false);
	const [sampleRowCount, setSampleRowCount] = useState(5);
	const [csvPreview, setCsvPreview] = useState<{
		headers: string[];
		rows: string[][];
	} | null>(null);
	const [csvRows, setCsvRows] = useState<string[][]>([]);
	const [csvHeaderMap, setCsvHeaderMap] = useState<Record<string, number>>(
		{},
	);
	const resolvedDatabaseId = databaseId || currentDatabaseId;

	useEffect(() => {
		if (databaseId) {
			setCurrentDatabaseId(databaseId);
		}
		if (mode === "engine") {
			setStep("actions");
		}
	}, [databaseId, mode]);

	const resetErrors = useCallback(() => setErrors(null), []);

	const runPixel = useCallback(
		async (pixel: string) => {
			const response = await monolithStore.runQuery(pixel);
			const { output, operationType } = response.pixelReturn[0];
			if (String(operationType).includes("ERROR")) {
				throw new Error(
					typeof output === "string" ? output : output?.response,
				);
			}
			return output;
		},
		[monolithStore],
	);

	const listDatabases = useCallback(async () => {
		setIsLoading(true);
		resetErrors();
		try {
			const output = await runPixel(
				'MyEngines(engineTypes=["DATABASE"]);',
			);
			setDatabases(Array.isArray(output) ? output : []);
		} catch (error) {
			const message = (error as Error).message;
			setErrors(message);
			toast.error(message || "Failed to load databases");
		} finally {
			setIsLoading(false);
		}
	}, [resetErrors, runPixel]);

	const listLlms = useCallback(async () => {
		try {
			const output = await runPixel('MyEngines(engineTypes=["MODEL"]);');
			const options = Array.isArray(output) ? output : [];
			setLlms(options);
			if (!selectedLlmId && options.length > 0) {
				setSelectedLlmId(options[0].database_id);
			}
		} catch (error) {
			const message = (error as Error).message;
			toast.error(message || "Failed to load models");
		}
	}, [runPixel, selectedLlmId]);

	const createDatabase = useCallback(async () => {
		if (!databaseName.trim()) {
			toast.error("Database name is required");
			return;
		}
		setIsLoading(true);
		resetErrors();
		try {
			const csvSeed = "col1,col2\n1,1";
			const seedFile = new File([csvSeed], "seed.csv", {
				type: "text/csv",
			});
			const uploadedFiles = await uploadFile(
				[seedFile],
				configStore.store.insightID,
			);
			if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
				throw new Error("CSV upload failed");
			}
			const sampleCsvPath = uploadedFiles[0]?.fileLocation;
			if (!sampleCsvPath) {
				throw new Error("Uploaded CSV file location not found");
			}
			const tempTableName = "temp_init_table";
			const dataTypeMap = { col1: "STRING", col2: "STRING" };
			const pixel = `RdbmsUploadTableData(database=["${databaseName}"],filePath=["${sampleCsvPath}"],delimiter=[","],dataTypeMap=[${JSON.stringify(
				dataTypeMap,
			)}],newHeaders=[{}],additionalDataTypes=[{}],descriptionMap=[{}],logicalNamesMap=[{}],existing=[false],table=["${tempTableName}"]);`;
			const output = await runPixel(pixel);
			setCurrentDatabaseId(output.database_id);
			await runPixel(
				`Database(database=["${output.database_id}"]) | Query("<encode>DROP TABLE ${tempTableName};</encode>") | ExecQuery();`,
			);
			toast.success("Database created");
			if (onDatabaseCreated) {
				onDatabaseCreated(output.database_id);
			} else {
				await listDatabases();
				setStep("actions");
			}
		} catch (error) {
			const message = (error as Error).message;
			setErrors(message);
			toast.error(message || "Failed to create database");
		} finally {
			setIsLoading(false);
		}
	}, [databaseName, listDatabases, onDatabaseCreated, resetErrors, runPixel]);

	const refreshSchema = useCallback(
		async (databaseId?: string) => {
			const targetId = databaseId || resolvedDatabaseId;
			if (!targetId) return;
			setIsLoading(true);
			resetErrors();
			try {
				const tablesOutput = await runPixel(
					`ExternalUpdateJdbcTablesAndViews(database=["${targetId}"]);`,
				);
				const tables = (tablesOutput?.tables || []).concat(
					tablesOutput?.views || [],
				);
				const filters = JSON.stringify(tables);
				const schemaOutput = await runPixel(
					`ExternalUpdateJdbcSchema(database=["${targetId}"], filters=${filters});`,
				);
				setSchemaMetadata(JSON.stringify(schemaOutput, null, 2));
			} catch (error) {
				const message = (error as Error).message;
				setErrors(message);
				toast.error(message || "Failed to refresh schema");
			} finally {
				setIsLoading(false);
			}
		},
		[resolvedDatabaseId, resetErrors, runPixel],
	);

	const selectDatabase = useCallback(
		async (databaseId: string) => {
			if (!databaseId) {
				toast.error("Select a database");
				return;
			}
			setCurrentDatabaseId(databaseId);
			setStep("actions");
			await refreshSchema(databaseId);
		},
		[refreshSchema],
	);

	const deleteDatabase = useCallback(
		async (databaseId: string) => {
			if (!databaseId) return;
			setIsLoading(true);
			resetErrors();
			try {
				await runPixel(`DeleteEngine(engine=["${databaseId}"]);`);
				toast.success("Database deleted");
				await listDatabases();
				if (currentDatabaseId === databaseId) {
					setCurrentDatabaseId("");
					setStep("select");
				}
			} catch (error) {
				const message = (error as Error).message;
				setErrors(message);
				toast.error(message || "Failed to delete database");
			} finally {
				setIsLoading(false);
			}
		},
		[currentDatabaseId, listDatabases, resetErrors, runPixel],
	);

	const generateSchemaFromNl = useCallback(async () => {
		if (!description.trim()) {
			toast.error("Provide a description");
			return;
		}
		if (!selectedLlmId) {
			toast.error("Select an LLM");
			return;
		}
		setIsLoading(true);
		resetErrors();
		try {
			const prompt = schemaPrompt(
				description,
				defaultSchemaContract,
				includeSampleData,
				sampleRowCount,
			);
			const pixel = `LLM(engine=["${selectedLlmId}"], command=["<encode>${prompt}</encode>"], paramValues=[{"schema": ${JSON.stringify(
				defaultSchemaContract,
			)}}]);`;
			const output = await runPixel(pixel);
			let response = output?.response ?? output;
			if (typeof response === "string") {
				response = response
					.replace(/```json/g, "")
					.replace(/```/g, "")
					.trim();
				response = JSON.parse(response);
			}
			if (!response?.schema) {
				throw new Error("LLM response missing schema");
			}
			setSchemaJson(JSON.stringify(response, null, 2));

			const tableEntries = Object.entries(response.schema || {});
			if (tableEntries.length === 0) {
				throw new Error("LLM response has no tables");
			}
			if (tableEntries.length > 1) {
				toast.info("Multiple tables returned. Using the first table.");
			}
			const [tableName, tableDef] = tableEntries[0];
			const columns = tableDef?.columns || {};
			const columnEntries = Object.entries(columns);
			const nextColumns = columnEntries.map(([name, column]) => ({
				id: createColumnId(),
				name,
				type: normalizeSqlType(column?.type || "TEXT"),
				description: column?.description || "",
			}));

			setSchemaTableName(tableName);
			setSchemaColumns(nextColumns);
			setSchemaSampleData(response.sample_data || null);
			toast.success("Schema generated");
		} catch (error) {
			const message = (error as Error).message;
			setErrors(message);
			toast.error(message || "Failed to generate schema");
		} finally {
			setIsLoading(false);
		}
	}, [
		description,
		includeSampleData,
		resetErrors,
		runPixel,
		sampleRowCount,
		selectedLlmId,
	]);

	const buildSchemaFromEditor = useCallback(
		(
			sampleDataOverride?: Record<
				string,
				Array<Record<string, unknown>>
			> | null,
		) => {
			if (!schemaTableName.trim()) {
				toast.error("Table name is required");
				return null;
			}
			const filteredColumns = schemaColumns.filter((column) =>
				column.name.trim(),
			);
			if (filteredColumns.length === 0) {
				toast.error("At least one column is required");
				return null;
			}
			const columnsMap = filteredColumns.reduce<
				Record<string, { type: string; description?: string }>
			>((acc, column) => {
				acc[column.name] = {
					type: normalizeSqlType(column.type),
					description: column.description,
				};
				return acc;
			}, {});

			return {
				schema: {
					[schemaTableName]: {
						columns: columnsMap,
					},
				},
				sample_data: sampleDataOverride ?? null,
			};
		},
		[schemaColumns, schemaTableName],
	);

	const generateSqlFromSchema = useCallback(() => {
		const wizardSchema = buildSchemaFromEditor(
			includeSampleData ? schemaSampleData : null,
		);
		if (!wizardSchema) return;
		const sql = schemaToSql(wizardSchema, includeSampleData);
		setSchemaSql(sql);
	}, [buildSchemaFromEditor, includeSampleData, schemaSampleData]);

	const coerceCsvValue = useCallback(
		(value: string, type: AllowedSqlType) => {
			const trimmed = value.trim();
			if (!trimmed) return null;
			const normalizedType = normalizeSqlType(type);
			if (normalizedType === "BOOLEAN") {
				const lowered = trimmed.toLowerCase();
				if (lowered === "true") return true;
				if (lowered === "false") return false;
			}
			if (
				normalizedType === "INTEGER" ||
				normalizedType === "DOUBLE" ||
				normalizedType === "FLOAT" ||
				normalizedType === "DECIMAL(10, 2)"
			) {
				const parsed = Number(trimmed);
				if (!Number.isNaN(parsed)) return parsed;
			}
			return trimmed;
		},
		[],
	);

	const buildCsvSampleRows = useCallback(
		(limit: number) => {
			if (csvRows.length === 0)
				return [] as Array<Record<string, unknown>>;
			const columnsForInsert = schemaColumns.filter((column) =>
				column.name.trim(),
			);
			if (columnsForInsert.length === 0) {
				return [] as Array<Record<string, unknown>>;
			}
			const rowLimit = Math.min(csvRows.length, limit);
			return csvRows.slice(0, rowLimit).map((row) => {
				const rowObject: Record<string, unknown> = {};
				columnsForInsert.forEach((column, index) => {
					const headerIndex = csvHeaderMap[column.name] ?? -1;
					const valueIndex = headerIndex >= 0 ? headerIndex : index;
					rowObject[column.name] = coerceCsvValue(
						row[valueIndex] ?? "",
						column.type,
					);
				});
				return rowObject;
			});
		},
		[coerceCsvValue, csvHeaderMap, csvRows, schemaColumns],
	);

	const executeSql = useCallback(async () => {
		if (!resolvedDatabaseId || !schemaSql.trim()) return;
		setIsLoading(true);
		resetErrors();
		try {
			const pixel = `Database(database=["${resolvedDatabaseId}"]) | Query("<encode>${schemaSql}</encode>") | ExecQuery();`;
			await runPixel(pixel);
			toast.success("SQL executed");
			await refreshSchema();
		} catch (error) {
			const message = (error as Error).message;
			setErrors(message);
			toast.error(message || "Failed to execute SQL");
		} finally {
			setIsLoading(false);
		}
	}, [refreshSchema, resetErrors, resolvedDatabaseId, runPixel, schemaSql]);

	const handleCsvFileSelected = useCallback(async (file: File) => {
		const text = await file.text();
		const parsed = parseCsvData(text);
		const normalizedHeaders = parsed.headers.map((header, index) =>
			normalizeCsvHeader(header, `column_${index + 1}`),
		);
		const headerMap = normalizedHeaders.reduce<Record<string, number>>(
			(acc, header, index) => {
				acc[header] = index;
				return acc;
			},
			{},
		);
		setCsvRows(parsed.rows);
		setCsvPreview({
			headers: parsed.headers,
			rows: parsed.rows.slice(0, 5),
		});
		setCsvHeaderMap(headerMap);
		setSchemaSampleData(null);
		const inferredTypes = inferColumnTypes(parsed.rows, normalizedHeaders);
		const nextColumns = normalizedHeaders.map((header) => ({
			id: createColumnId(),
			name: header,
			type: normalizeSqlType(inferredTypes[header] || "TEXT"),
			description: "",
		}));
		setSchemaColumns(nextColumns);
	}, []);

	const generateSqlFromCsv = useCallback(() => {
		if (!csvPreview || csvRows.length === 0) {
			const wizardSchema = buildSchemaFromEditor(null);
			if (!wizardSchema) return;
			const sql = schemaToSql(wizardSchema, false);
			setSchemaSql(sql);
			return;
		}

		const tableName = schemaTableName.trim();
		const rowLimit = Math.min(csvRows.length, MAX_CSV_INSERT_ROWS);
		if (csvRows.length > MAX_CSV_INSERT_ROWS) {
			toast.info(
				`CSV has ${csvRows.length} rows. Generating inserts for the first ${MAX_CSV_INSERT_ROWS} rows.`,
			);
		}
		const sampleRows = buildCsvSampleRows(rowLimit);

		const wizardSchema = buildSchemaFromEditor(
			tableName
				? {
						[tableName]: sampleRows,
					}
				: null,
		);
		if (!wizardSchema) return;
		const sql = schemaToSql(wizardSchema, true);
		setSchemaSql(sql);
	}, [
		buildSchemaFromEditor,
		buildCsvSampleRows,
		csvPreview,
		csvRows,
		schemaColumns,
		schemaTableName,
	]);

	const csvRowsPreview = useMemo(
		() => buildCsvSampleRows(CSV_PREVIEW_ROWS),
		[buildCsvSampleRows],
	);

	const updateSchemaColumn = useCallback(
		(index: number, patch: Partial<SchemaEditorColumn>) => {
			setSchemaColumns((prev) =>
				prev.map((column, idx) => {
					if (idx !== index) return column;
					return {
						...column,
						...patch,
						type: normalizeSqlType(patch.type || column.type),
					};
				}),
			);
		},
		[],
	);

	const addSchemaColumn = useCallback(() => {
		setSchemaColumns((prev) => [
			...prev,
			{
				id: createColumnId(),
				name: "",
				type: ALLOWED_SQL_TYPES[0],
				description: "",
			},
		]);
	}, []);

	const deleteSchemaColumn = useCallback((index: number) => {
		setSchemaColumns((prev) => prev.filter((_, idx) => idx !== index));
	}, []);

	const runQuery = useCallback(async () => {
		if (!resolvedDatabaseId || !querySql.trim()) return;
		setIsLoading(true);
		resetErrors();
		try {
			const pixel = `Database(database=["${resolvedDatabaseId}"]) | Query("<encode>${querySql}</encode>") | ExecQuery();`;
			await runPixel(pixel);
			toast.success("Query executed");
		} catch (error) {
			const message = (error as Error).message;
			setErrors(message);
			toast.error(message || "Failed to run query");
		} finally {
			setIsLoading(false);
		}
	}, [querySql, resetErrors, resolvedDatabaseId, runPixel]);

	const actions = useMemo(
		() => ({
			listDatabases,
			listLlms,
			createDatabase,
			selectDatabase,
			deleteDatabase,
			refreshSchema,
			generateSchemaFromNl,
			generateSqlFromSchema,
			executeSql,
			handleCsvFileSelected,
			generateSqlFromCsv,
			updateSchemaColumn,
			addSchemaColumn,
			deleteSchemaColumn,
			runQuery,
		}),
		[
			createDatabase,
			deleteDatabase,
			executeSql,
			generateSchemaFromNl,
			generateSqlFromSchema,
			generateSqlFromCsv,
			handleCsvFileSelected,
			listDatabases,
			listLlms,
			updateSchemaColumn,
			addSchemaColumn,
			deleteSchemaColumn,
			refreshSchema,
			runQuery,
			selectDatabase,
		],
	);

	return {
		state: {
			step,
			isLoading,
			errors,
			databases,
			currentDatabaseId,
			databaseName,
			llms,
			selectedLlmId,
			description,
			schemaJson,
			schemaSql,
			schemaMetadata,
			schemaTableName,
			schemaColumns,
			querySql,
			includeSampleData,
			sampleRowCount,
			csvPreview,
			csvRows,
			csvHeaderMap,
			csvRowsPreview,
			csvRowCount: csvRows.length,
		},
		setters: {
			setStep,
			setDatabaseName,
			setSelectedLlmId,
			setDescription,
			setSchemaSql,
			setQuerySql,
			setIncludeSampleData,
			setSampleRowCount,
			setSchemaTableName,
		},
		actions,
	};
}
