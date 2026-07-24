import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { download } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useEngine, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineExportButton: React.FC = () => {
	const { catalog, engine, permission } = useEngine();
	const { configStore } = useRootStore();

	const [openExportModal, setOpenExportModal] = useState(false);

	// export loading state
	const [isExporting, setIsExporting] = useState(false);

	/**
	 * Export the project
	 *
	 * @param includeData - Whether to include data in the export
	 */
	const exportEngine = async (includeData: boolean) => {
		try {
			setIsExporting(true);

			const response = await configStore.runPixel(
				`META | ExportEngine(engine=["${
					engine.engine_id
				}"], includeData="${includeData ? "true" : "false"}" );`,
			);

			await download(
				response.insightId,
				response.pixelReturn[0].output as string,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to export. Please try again.",
			);
		} finally {
			setIsExporting(false);
		}
	};

	if (permission !== "OWNER") {
		return null;
	}

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						disabled={isExporting}
						variant="outline"
						size="icon"
						aria-label="Export"
						data-testid={formatToDataTestId(
							`engineHeader-${catalog.name}-export-btn`,
						)}
						onClick={() => {
							const engineType = engine.engine_subtype;
							if (engineType === "H2_DB") {
								setOpenExportModal(true);
							} else {
								exportEngine(false);
							}
						}}
					>
						{isExporting ? <Spinner /> : <DownloadIcon />}
					</Button>
				</TooltipTrigger>
				<TooltipContent>Export</TooltipContent>
			</Tooltip>
			<Dialog open={openExportModal} onOpenChange={setOpenExportModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Export {catalog.name}</DialogTitle>
						<DialogDescription>
							Do you want to export data along with the engine?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setOpenExportModal(false);
							}}
						>
							Cancel
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setOpenExportModal(false);
								exportEngine(false);
							}}
						>
							No
						</Button>
						<Button
							onClick={() => {
								setOpenExportModal(false);
								exportEngine(true);
							}}
						>
							Yes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
