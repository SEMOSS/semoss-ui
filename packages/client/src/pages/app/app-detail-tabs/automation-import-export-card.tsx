import { DownloadIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
	type AutomationWorkflowDocument,
	buildAutomationImportSaveAggregate,
	downloadAutomationExport,
	downloadN8nExport,
	parseAutomationImportFileAsync,
} from "@semoss/automation";
import { usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	H3,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { encodeTextToBase64 } from "@semoss/utility/encoding";
import { getErrorMessage } from "@semoss/utility/error";
import { useSession } from "@/hooks";

interface AutomationImportExportCardProps {
	project: Project;
}

interface SavedAutomation extends AutomationWorkflowDocument {
	nodeSources?: Record<string, string>;
}

interface PendingImport {
	document: AutomationWorkflowDocument;
	nodeSources: Record<string, string>;
	warnings: string[];
}

interface ModelEngine {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
}

const LEAVE_DATABASE_UNASSIGNED = "__leave_database_unassigned__";
const LEAVE_MODEL_UNASSIGNED = "__leave_model_unassigned__";

function isSavedAutomation(value: unknown): value is SavedAutomation {
	return (
		Boolean(value) &&
		typeof value === "object" &&
		(value as { formatVersion?: unknown }).formatVersion === 2 &&
		typeof (value as { graph?: unknown }).graph === "object"
	);
}

export const AutomationImportExportCard = ({
	project,
}: AutomationImportExportCardProps) => {
	const runPixel = useSession((state) => state.runPixel);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [pendingImport, setPendingImport] = useState<PendingImport | null>(
		null,
	);
	const [modelEngineMappings, setModelEngineMappings] = useState<
		Record<string, string>
	>({});
	const [databaseEngineMappings, setDatabaseEngineMappings] = useState<
		Record<string, string>
	>({});
	const [functionEngineMappings, setFunctionEngineMappings] = useState<
		Record<string, string>
	>({});
	const hasFunctionNodes =
		pendingImport?.document.graph.nodes.some((node) =>
			node.type.startsWith("function."),
		) ?? false;
	const functionEngines = usePixel<ModelEngine[]>(
		hasFunctionNodes
			? 'MyEngines(engineTypes=["FUNCTION"], limit=[1000], offset=[0]);'
			: "",
		{ data: [] },
	);
	const importedFunctionEngineIds = Array.from(
		new Set(
			(pendingImport?.document.graph.nodes ?? [])
				.filter((node) => node.type.startsWith("function."))
				.map((node) =>
					typeof node.config.engineId === "string"
						? node.config.engineId
						: "",
				),
		),
	);
	const accessibleFunctionEngineIds = new Set(
		functionEngines.data.map((engine) => engine.engine_id),
	);
	const unresolvedFunctionEngineIds =
		functionEngines.status === "SUCCESS"
			? importedFunctionEngineIds.filter(
					(engineId) => !accessibleFunctionEngineIds.has(engineId),
				)
			: [];
	const hasModelNodes =
		pendingImport?.document.graph.nodes.some((node) =>
			node.type.startsWith("model."),
		) ?? false;
	const modelEngines = usePixel<ModelEngine[]>(
		hasModelNodes
			? 'MyEngines(engineTypes=["MODEL"], limit=[1000], offset=[0]);'
			: "",
		{ data: [] },
	);
	const hasDatabaseNodes =
		pendingImport?.document.graph.nodes.some((node) =>
			node.type.startsWith("database."),
		) ?? false;
	const databaseEngines = usePixel<ModelEngine[]>(
		hasDatabaseNodes
			? 'MyEngines(engineTypes=["DATABASE"], limit=[1000], offset=[0]);'
			: "",
		{ data: [] },
	);
	const importedModelEngineIds = Array.from(
		new Set(
			(pendingImport?.document.graph.nodes ?? [])
				.filter((node) => node.type.startsWith("model."))
				.map((node) =>
					typeof node.config.engineId === "string"
						? node.config.engineId
						: "",
				),
		),
	);
	const accessibleModelEngineIds = new Set(
		modelEngines.data.map((engine) => engine.engine_id),
	);
	const unresolvedModelEngineIds =
		modelEngines.status === "SUCCESS"
			? importedModelEngineIds.filter(
					(engineId) => !accessibleModelEngineIds.has(engineId),
				)
			: [];
	const hasUnassignedModelMapping = Object.values(
		modelEngineMappings,
	).includes(LEAVE_MODEL_UNASSIGNED);
	const importedDatabaseEngineIds = Array.from(
		new Set(
			(pendingImport?.document.graph.nodes ?? [])
				.filter((node) => node.type.startsWith("database."))
				.map((node) =>
					typeof node.config.engineId === "string"
						? node.config.engineId
						: "",
				),
		),
	);
	const accessibleDatabaseEngineIds = new Set(
		databaseEngines.data.map((engine) => engine.engine_id),
	);
	const unresolvedDatabaseEngineIds =
		databaseEngines.status === "SUCCESS"
			? importedDatabaseEngineIds.filter(
					(engineId) => !accessibleDatabaseEngineIds.has(engineId),
				)
			: [];
	const hasUnassignedDatabaseMapping = Object.values(
		databaseEngineMappings,
	).includes(LEAVE_DATABASE_UNASSIGNED);

	const loadAutomation = async (): Promise<SavedAutomation> => {
		const response = await runPixel(
			`GetAutomation(project=${JSON.stringify([project.project_id])});`,
		);
		const output = response.pixelReturn?.[0]?.output;
		if (!isSavedAutomation(output)) {
			throw new Error("No saved automation workflow was found.");
		}
		return output;
	};

	const exportAutomation = async (format: "native" | "n8n") => {
		try {
			setIsExporting(true);
			const automation = await loadAutomation();
			const name = project.project_display_name || project.project_name;
			const nodeSources = automation.nodeSources ?? {};
			if (format === "native") {
				downloadAutomationExport(name, automation, nodeSources);
				toast.success("Automation exported");
				return;
			}
			const warnings = downloadN8nExport(name, automation, nodeSources);
			if (warnings.length > 0) {
				toast.warning(`Exported with ${warnings.length} warning(s)`);
			} else {
				toast.success("Automation exported to n8n");
			}
		} catch (error) {
			console.error(error);
			toast.error(getErrorMessage(error, "Unable to export automation."));
		} finally {
			setIsExporting(false);
		}
	};

	const selectImportFile = async (file: File) => {
		try {
			setIsImporting(true);
			const parsed = await parseAutomationImportFileAsync(
				await file.text(),
			);
			setModelEngineMappings({});
			setDatabaseEngineMappings({});
			setFunctionEngineMappings({});
			setPendingImport(parsed);
		} catch (error) {
			console.error(error);
			toast.error(getErrorMessage(error, "Unable to import automation."));
		} finally {
			setIsImporting(false);
		}
	};

	const saveImport = async () => {
		if (!pendingImport) return;
		if (hasFunctionNodes && functionEngines.status !== "SUCCESS") {
			toast.error("Unable to verify accessible function engines.");
			return;
		}
		if (
			unresolvedFunctionEngineIds.some(
				(engineId) =>
					!accessibleFunctionEngineIds.has(
						functionEngineMappings[engineId],
					),
			)
		) {
			toast.error(
				"Select an accessible replacement for each missing or inaccessible function engine.",
			);
			return;
		}
		if (hasModelNodes && modelEngines.status !== "SUCCESS") {
			toast.error("Unable to verify accessible model engines.");
			return;
		}
		if (
			unresolvedModelEngineIds.some(
				(engineId) => !modelEngineMappings[engineId],
			)
		) {
			toast.error(
				"Select a replacement for each inaccessible model engine.",
			);
			return;
		}
		if (hasDatabaseNodes && databaseEngines.status !== "SUCCESS") {
			toast.error("Unable to verify accessible database engines.");
			return;
		}
		if (
			unresolvedDatabaseEngineIds.some(
				(engineId) => !databaseEngineMappings[engineId],
			)
		) {
			toast.error(
				"Select a replacement for each inaccessible database engine.",
			);
			return;
		}
		try {
			setIsImporting(true);
			const functionEngineNames = new Map(
				functionEngines.data.map((engine) => [
					engine.engine_id,
					engine.engine_display_name || engine.engine_name,
				]),
			);
			const modelEngineNames = new Map(
				modelEngines.data.map((engine) => [
					engine.engine_id,
					engine.engine_display_name || engine.engine_name,
				]),
			);
			const databaseEngineNames = new Map(
				databaseEngines.data.map((engine) => [
					engine.engine_id,
					engine.engine_display_name || engine.engine_name,
				]),
			);
			const document = {
				...pendingImport.document,
				graph: {
					...pendingImport.document.graph,
					nodes: pendingImport.document.graph.nodes.map((node) => {
						const importedEngineId =
							typeof node.config.engineId === "string"
								? node.config.engineId
								: "";
						const functionEngineMapping =
							node.type.startsWith("function.") &&
							unresolvedFunctionEngineIds.includes(
								importedEngineId,
							)
								? functionEngineMappings[importedEngineId]
								: undefined;
						const functionEngineName =
							functionEngineMapping !== undefined
								? functionEngineNames.get(functionEngineMapping)
								: undefined;
						const databaseEngineMapping =
							node.type.startsWith("database.") &&
							unresolvedDatabaseEngineIds.includes(
								importedEngineId,
							)
								? databaseEngineMappings[importedEngineId]
								: undefined;
						const databaseEngineId =
							databaseEngineMapping === LEAVE_DATABASE_UNASSIGNED
								? ""
								: databaseEngineMapping;
						const databaseEngineName =
							databaseEngineMapping === LEAVE_DATABASE_UNASSIGNED
								? ""
								: databaseEngineId
									? (databaseEngineNames.get(
											databaseEngineId,
										) ?? databaseEngineId)
									: undefined;
						const modelEngineMapping =
							node.type.startsWith("model.") &&
							unresolvedModelEngineIds.includes(importedEngineId)
								? modelEngineMappings[importedEngineId]
								: undefined;
						const modelEngineId =
							modelEngineMapping === LEAVE_MODEL_UNASSIGNED
								? ""
								: modelEngineMapping;
						const modelEngineName =
							modelEngineMapping === LEAVE_MODEL_UNASSIGNED
								? ""
								: modelEngineId
									? (modelEngineNames.get(modelEngineId) ??
										modelEngineId)
									: undefined;
						if (
							databaseEngineMapping === undefined &&
							modelEngineMapping === undefined &&
							functionEngineMapping === undefined
						) {
							return node;
						}
						return {
							...node,
							config: {
								...node.config,
								...(functionEngineMapping !== undefined
									? {
											engineId: functionEngineMapping,
											engineName: functionEngineName,
										}
									: {}),
								...(databaseEngineMapping !== undefined
									? {
											engineId: databaseEngineId,
											engineName: databaseEngineName,
										}
									: {}),
								...(modelEngineMapping !== undefined
									? {
											engineId: modelEngineId,
											engineName: modelEngineName,
										}
									: {}),
							},
						};
					}),
				},
			};
			const aggregate = buildAutomationImportSaveAggregate(
				pendingImport,
				document,
			);
			const response = await runPixel(
				`SaveAutomation(project=${JSON.stringify([project.project_id])}, json=${JSON.stringify([encodeTextToBase64(aggregate.definitionJson)])}, nodeSources=${JSON.stringify([encodeTextToBase64(aggregate.nodeSourcesJson)])});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join("\n"));
			}
			setPendingImport(null);
			setModelEngineMappings({});
			setDatabaseEngineMappings({});
			setFunctionEngineMappings({});
			if (
				pendingImport.warnings.length > 0 ||
				hasUnassignedDatabaseMapping ||
				hasUnassignedModelMapping
			) {
				toast.warning(
					`Automation imported with ${pendingImport.warnings.length + Number(hasUnassignedDatabaseMapping) + Number(hasUnassignedModelMapping)} warning(s)${hasUnassignedDatabaseMapping ? "; database engines remain unassigned" : ""}${hasUnassignedModelMapping ? "; model engines remain unassigned" : ""}`,
				);
			} else {
				toast.success("Automation imported");
			}
		} catch (error) {
			console.error(error);
			toast.error(getErrorMessage(error, "Unable to save automation."));
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<>
			<Card className="gap-1 p-4">
				<CardHeader className="px-0">
					<CardTitle>
						<H3>Automation Workflow</H3>
					</CardTitle>
					<CardDescription>
						Importing replaces the current workflow. Exporting here
						only downloads the automation definition, not the full
						project.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2 px-0">
					<input
						ref={fileInputRef}
						type="file"
						accept=".json,application/json"
						className="sr-only"
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							if (file) void selectImportFile(file);
						}}
					/>
					<Button
						variant="outline"
						disabled={isImporting || isExporting}
						onClick={() => fileInputRef.current?.click()}
					>
						{isImporting ? (
							<Spinner className="size-4" />
						) : (
							<UploadIcon className="size-4" />
						)}
						Import workflow
					</Button>
					<Button
						variant="outline"
						disabled={isImporting || isExporting}
						onClick={() => void exportAutomation("native")}
					>
						{isExporting ? (
							<Spinner className="size-4" />
						) : (
							<DownloadIcon className="size-4" />
						)}
						Export SEMOSS
					</Button>
					<Button
						variant="outline"
						disabled={isImporting || isExporting}
						onClick={() => void exportAutomation("n8n")}
					>
						<DownloadIcon className="size-4" />
						Export n8n
					</Button>
				</CardContent>
			</Card>
			<Dialog
				open={pendingImport !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPendingImport(null);
						setModelEngineMappings({});
						setDatabaseEngineMappings({});
						setFunctionEngineMappings({});
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Replace this automation?
						</DialogTitle>
						<DialogDescription>
							Importing replaces every step and connection in this
							automation.
						</DialogDescription>
					</DialogHeader>
					{pendingImport?.warnings.length ? (
						<P className="text-muted-foreground text-sm">
							{pendingImport.warnings.length} import warning(s)
							will be reported after saving.
						</P>
					) : null}
					{hasFunctionNodes &&
						functionEngines.status === "LOADING" && (
							<output className="text-sm">
								Checking function engine access...
							</output>
						)}
					{hasFunctionNodes && functionEngines.status === "ERROR" && (
						<div className="flex flex-col items-start gap-2">
							<P
								className="text-destructive text-sm"
								role="alert"
							>
								Could not load accessible function engines.
							</P>
							<Button
								variant="outline"
								onClick={() => functionEngines.refresh()}
							>
								Retry
							</Button>
						</div>
					)}
					{hasFunctionNodes &&
						functionEngines.status === "SUCCESS" &&
						functionEngines.data.length === 0 && (
							<P
								className="text-destructive text-sm"
								role="alert"
							>
								No accessible function engines are available.
								Access to a function engine is required before
								importing these steps.
							</P>
						)}
					{unresolvedFunctionEngineIds.map((engineId) => (
						<div className="flex flex-col gap-2" key={engineId}>
							<P className="break-all text-sm">
								Choose a replacement for function engine{" "}
								{engineId || "(not selected)"}.
							</P>
							<Select
								value={functionEngineMappings[engineId] ?? ""}
								onValueChange={(value) =>
									setFunctionEngineMappings((previous) => ({
										...previous,
										[engineId]: value,
									}))
								}
								disabled={
									isImporting ||
									functionEngines.status !== "SUCCESS"
								}
							>
								<SelectTrigger
									aria-label={`Replacement for function engine ${engineId || "not selected"}`}
								>
									<SelectValue placeholder="Select a function engine" />
								</SelectTrigger>
								<SelectContent>
									{functionEngines.data.map((engine) => (
										<SelectItem
											key={engine.engine_id}
											value={engine.engine_id}
										>
											{engine.engine_display_name ||
												engine.engine_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					))}
					{hasModelNodes && modelEngines.status === "LOADING" && (
						<output className="text-sm">
							Checking model engine access...
						</output>
					)}
					{hasModelNodes && modelEngines.status === "ERROR" && (
						<div className="flex flex-col items-start gap-2">
							<P
								className="text-destructive text-sm"
								role="alert"
							>
								Could not load accessible model engines.
							</P>
							<Button
								variant="outline"
								onClick={() => modelEngines.refresh()}
							>
								Retry
							</Button>
						</div>
					)}
					{unresolvedModelEngineIds.map((engineId) => (
						<div className="flex flex-col gap-2" key={engineId}>
							<P className="break-all text-sm">
								Choose a replacement for model engine{" "}
								{engineId || "(not selected)"}.
							</P>
							<Select
								value={modelEngineMappings[engineId] ?? ""}
								onValueChange={(value) =>
									setModelEngineMappings((previous) => ({
										...previous,
										[engineId]: value,
									}))
								}
								disabled={
									isImporting ||
									modelEngines.status !== "SUCCESS"
								}
							>
								<SelectTrigger
									aria-label={`Replacement for model engine ${engineId || "not selected"}`}
								>
									<SelectValue placeholder="Select a model engine" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={LEAVE_MODEL_UNASSIGNED}>
										Leave unassigned
									</SelectItem>
									{modelEngines.data.map((engine) => (
										<SelectItem
											key={engine.engine_id}
											value={engine.engine_id}
										>
											{engine.engine_display_name ||
												engine.engine_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					))}
					{hasUnassignedModelMapping && (
						<P className="text-muted-foreground text-sm">
							Unassigned model steps need an accessible engine
							before they can be saved or run from the editor.
						</P>
					)}
					{hasDatabaseNodes &&
						databaseEngines.status === "LOADING" && (
							<P className="text-sm">
								Checking database engine access...
							</P>
						)}
					{hasDatabaseNodes && databaseEngines.status === "ERROR" && (
						<div className="flex flex-col items-start gap-2">
							<P className="text-destructive text-sm">
								Could not load accessible database engines.
							</P>
							<Button
								variant="outline"
								onClick={() => databaseEngines.refresh()}
							>
								Retry
							</Button>
						</div>
					)}
					{unresolvedDatabaseEngineIds.map((engineId) => (
						<div className="flex flex-col gap-2" key={engineId}>
							<P className="text-sm">
								Choose a replacement for database engine{" "}
								{engineId || "(not selected)"}.
							</P>
							<Select
								value={databaseEngineMappings[engineId] ?? ""}
								onValueChange={(value) =>
									setDatabaseEngineMappings((previous) => ({
										...previous,
										[engineId]: value,
									}))
								}
								disabled={databaseEngines.status !== "SUCCESS"}
							>
								<SelectTrigger
									aria-label={`Replacement for database engine ${engineId || "not selected"}`}
								>
									<SelectValue placeholder="Select a database engine" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value={LEAVE_DATABASE_UNASSIGNED}
									>
										Leave unassigned
									</SelectItem>
									{databaseEngines.data.map((engine) => (
										<SelectItem
											key={engine.engine_id}
											value={engine.engine_id}
										>
											{engine.engine_display_name ||
												engine.engine_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					))}
					{hasUnassignedDatabaseMapping && (
						<P className="text-muted-foreground text-sm">
							Unassigned database steps need an accessible engine
							before they can be saved or run from the editor.
						</P>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							disabled={isImporting}
							onClick={() => setPendingImport(null)}
						>
							Cancel
						</Button>
						<Button
							disabled={
								isImporting ||
								(hasFunctionNodes &&
									functionEngines.status !== "SUCCESS") ||
								unresolvedFunctionEngineIds.some(
									(engineId) =>
										!accessibleFunctionEngineIds.has(
											functionEngineMappings[engineId],
										),
								) ||
								(hasDatabaseNodes &&
									databaseEngines.status !== "SUCCESS") ||
								unresolvedDatabaseEngineIds.some(
									(engineId) =>
										!databaseEngineMappings[engineId],
								) ||
								(hasModelNodes &&
									modelEngines.status !== "SUCCESS") ||
								unresolvedModelEngineIds.some(
									(engineId) =>
										!modelEngineMappings[engineId],
								)
							}
							onClick={() => void saveImport()}
						>
							{isImporting && <Spinner className="size-4" />}
							Replace automation
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
