import { DownloadIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
	type AutomationWorkflowDocument,
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
	const [modelEngineId, setModelEngineId] = useState("");
	const [databaseEngineMappings, setDatabaseEngineMappings] = useState<
		Record<string, string>
	>({});
	const modelEngines = usePixel<ModelEngine[]>(
		pendingImport
			? 'MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);'
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
	const unresolvedModelNodes = pendingImport?.document.graph.nodes.filter(
		(node) =>
			node.type.startsWith("model.") &&
			(typeof node.config.engineId !== "string" ||
				node.config.engineId.trim() === ""),
	);
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
			setDatabaseEngineMappings({});
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
		if (unresolvedModelNodes?.length && !modelEngineId) {
			toast.error("Select a model engine before importing.");
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
			const unresolvedModelNodeIds = new Set(
				(unresolvedModelNodes ?? []).map((node) => node.id),
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
						const modelEngine = unresolvedModelNodeIds.has(node.id)
							? modelEngineId
							: undefined;
						if (
							databaseEngineMapping === undefined &&
							!modelEngine
						) {
							return node;
						}
						return {
							...node,
							config: {
								...node.config,
								...(databaseEngineMapping !== undefined
									? {
											engineId: databaseEngineId,
											engineName: databaseEngineName,
										}
									: {}),
								...(modelEngine
									? { engineId: modelEngine }
									: {}),
							},
						};
					}),
				},
			};
			const response = await runPixel(
				`SaveAutomation(project=${JSON.stringify([project.project_id])}, json=${JSON.stringify([encodeTextToBase64(JSON.stringify(document))])}, nodeSources=${JSON.stringify([encodeTextToBase64(JSON.stringify(pendingImport.nodeSources))])});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join("\n"));
			}
			setPendingImport(null);
			setModelEngineId("");
			setDatabaseEngineMappings({});
			if (
				pendingImport.warnings.length > 0 ||
				hasUnassignedDatabaseMapping
			) {
				toast.warning(
					`Automation imported with ${pendingImport.warnings.length + Number(hasUnassignedDatabaseMapping)} warning(s)${hasUnassignedDatabaseMapping ? "; database engines remain unassigned" : ""}`,
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
						setModelEngineId("");
						setDatabaseEngineMappings({});
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
					{unresolvedModelNodes?.length ? (
						<div className="flex flex-col gap-2">
							<P className="text-sm">
								Select a model engine for{" "}
								{unresolvedModelNodes.length} imported model
								node(s).
							</P>
							<Select
								value={modelEngineId}
								onValueChange={setModelEngineId}
								disabled={modelEngines.status === "LOADING"}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a model engine" />
								</SelectTrigger>
								<SelectContent>
									{modelEngines.data.map((engine) => (
										<SelectItem
											key={engine.engine_id}
											value={engine.engine_id}
										>
											{engine.engine_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : null}
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
								(hasDatabaseNodes &&
									databaseEngines.status !== "SUCCESS") ||
								unresolvedDatabaseEngineIds.some(
									(engineId) =>
										!databaseEngineMappings[engineId],
								) ||
								Boolean(
									unresolvedModelNodes?.length &&
										!modelEngineId,
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
