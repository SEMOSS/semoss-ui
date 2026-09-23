import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { download, runPixel, useSession } from "@semoss/sdk/react";
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
import { useEngine } from "@/hooks";
import { formatToDataTestId } from "@/utility";

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineExportButton: React.FC = () => {
	const { catalog, engine, permission } = useEngine();
	const insightID = useSession((state) => state.insightId);

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

			const response = await runPixel(
				`META | ExportEngine(engine=["${
					engine.engine_id
				}"], includeData="${includeData ? "true" : "false"}" );`,
				insightID,
			);

			await download(insightID, response.pixelReturn[0].output as string);
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
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<span
						className="inline-flex"
						tabIndex={isExporting ? 0 : undefined}
					>
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
					</span>
				</TooltipTrigger>
				<TooltipContent>
					{isExporting ? "Exporting results…" : "Export"}
				</TooltipContent>
			</Tooltip>
			<Dialog open={openExportModal} onOpenChange={setOpenExportModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Export {catalog.name}
						</DialogTitle>
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
