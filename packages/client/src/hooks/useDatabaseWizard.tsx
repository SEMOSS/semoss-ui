import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { inferColumnTypes, parseCsvPreview } from "@/utils/databaseWizard/csv";
import { schemaPrompt } from "@/utils/databaseWizard/schemaPrompt";
import { schemaToSql } from "@/utils/databaseWizard/schemaToSql";
import type { DatabaseSummary, WizardStep } from "@/utils/databaseWizard/types";

type LlmOption = { database_id: string; database_name: string };

const defaultSchemaContract = {
	schema: [
		{
			table: "table_name",
			columns: [{ name: "column_name", type: "TEXT" }],
			foreign_keys: [
				{ column: "column_name", references: "table(column)" },
			],
			sample_data: [{ column_name: "example" }],
		},
	],
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
	const [querySql, setQuerySql] = useState("");
	const [includeSampleData, setIncludeSampleData] = useState(false);
	const [sampleRowCount, setSampleRowCount] = useState(5);
	const [csvPreview, setCsvPreview] = useState<{
		headers: string[];
		rows: string[][];
	} | null>(null);
	const [csvTableName, setCsvTableName] = useState("");
	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
	const [csvRows, setCsvRows] = useState<string[][]>([]);
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

	const generateSqlFromSchema = useCallback(() => {
		try {
			const parsed = JSON.parse(schemaJson);
			const sql = schemaToSql(parsed, includeSampleData);
			setSchemaSql(sql);
		} catch (_error) {
			toast.error("Invalid schema JSON");
		}
	}, [includeSampleData, schemaJson]);

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
		const preview = parseCsvPreview(text);
		setCsvPreview(preview);
		setCsvHeaders(preview.headers);
		setCsvRows(preview.rows);
	}, []);

	const generateSqlFromCsv = useCallback(() => {
		if (!csvHeaders.length || !csvTableName) {
			toast.error("CSV file and table name required");
			return;
		}
		const columnTypes = inferColumnTypes(csvRows, csvHeaders);
		const columns = csvHeaders.map((header) => ({
			name: header,
			type: columnTypes[header] || "TEXT",
		}));
		const sql = `CREATE TABLE "${csvTableName}" (\n  ${columns
			.map((column) => `"${column.name}" ${column.type}`)
			.join(",\n  ")}\n);`;
		setSchemaSql(sql);
	}, [csvHeaders, csvRows, csvTableName]);

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
			querySql,
			includeSampleData,
			sampleRowCount,
			csvPreview,
			csvTableName,
		},
		setters: {
			setStep,
			setDatabaseName,
			setSelectedLlmId,
			setDescription,
			setSchemaJson,
			setSchemaSql,
			setQuerySql,
			setIncludeSampleData,
			setSampleRowCount,
			setCsvTableName,
		},
		actions,
	};
}
