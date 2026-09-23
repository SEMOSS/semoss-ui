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
}

function isSavedAutomation(value: unknown): value is SavedAutomation {
	return (
		Boolean(value) &&
		typeof value === "object" &&
		(value as { formatVersion?: unknown }).formatVersion === 2 &&
		typeof (value as { graph?: unknown }).graph === "object"
	);
}

function encodeBase64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
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
	const modelEngines = usePixel<ModelEngine[]>(
		pendingImport
			? 'MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);'
			: "",
		{ data: [] },
	);
	const unresolvedModelNodes = pendingImport?.document.graph.nodes.filter(
		(node) =>
			node.type.startsWith("model.") &&
			(typeof node.config.engineId !== "string" ||
				node.config.engineId.trim() === ""),
	);

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
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to export automation.",
			);
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
			setPendingImport(parsed);
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to import automation.",
			);
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
		try {
			setIsImporting(true);
			const document = unresolvedModelNodes?.length
				? {
						...pendingImport.document,
						graph: {
							...pendingImport.document.graph,
							nodes: pendingImport.document.graph.nodes.map(
								(node) =>
									unresolvedModelNodes.some(
										(candidate) => candidate.id === node.id,
									)
										? {
												...node,
												config: {
													...node.config,
													engineId: modelEngineId,
												},
											}
										: node,
							),
						},
					}
				: pendingImport.document;
			const response = await runPixel(
				`SaveAutomation(project=${JSON.stringify([project.project_id])}, json=${JSON.stringify([encodeBase64(JSON.stringify(document))])}, nodeSources=${JSON.stringify([encodeBase64(JSON.stringify(pendingImport.nodeSources))])});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join("\n"));
			}
			setPendingImport(null);
			setModelEngineId("");
			if (pendingImport.warnings.length > 0) {
				toast.warning(
					`Automation imported with ${pendingImport.warnings.length} warning(s)`,
				);
			} else {
				toast.success("Automation imported");
			}
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to save automation.",
			);
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
