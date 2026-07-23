import { ChevronRight, Download } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EngineSubtypeIcon, EntityHeader } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
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
import { EngineAccessButton } from ".";

/**
 * Engine Header
 */
export const EngineHeader: React.FC = () => {
	// get the engine information
	const { name, engine, permission, type } = useEngine();

	// Service for Axios calls
	const { monolithStore } = useRootStore();

	const [openExportModal, setOpenExportModal] = useState(false);

	// export loading state
	const [exportLoading, setExportLoading] = useState(false);

	/**
	 * @name exportDB
	 * @desc export DB pixel
	 */
	const exportDB = (includeData: boolean) => {
		setExportLoading(true);
		const pixel = `META | ExportEngine(engine=["${
			engine.engine_id
		}"], includeData="${includeData ? "true" : "false"}" );`;

		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn[0].output as string,
				insightId = response.insightId;

			const formattedEngineType =
				type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

			monolithStore
				.download(insightId, output)
				.then(() => {
					if (output && response.errors.length === 0) {
						toast.success(
							`${formattedEngineType} engine download started`,
						);
					}
					setExportLoading(false);
				})
				.catch(() => {
					toast.error(`Failed to download ${formattedEngineType}`);
					setExportLoading(false);
				});
		});
		setExportLoading(false);
	};

	return (
		<div className="flex w-full flex-col items-start gap-4 p-0">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link
								to={".."}
								className="inline-flex items-center text-inherit leading-none"
							>
								{name} Catalog
							</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator className="inline-flex items-center [&>svg]:translate-y-[0.5px]">
						<ChevronRight />
					</BreadcrumbSeparator>
					<BreadcrumbItem>
						<BreadcrumbPage className="inline-flex items-center leading-none">
							{engine.engine_display_name || engine.engine_name}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<EntityHeader
				icon={
					<EngineSubtypeIcon
						engineType={type}
						engineSubtype={engine.engine_subtype}
						alt={name}
						className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
					/>
				}
				name={engine.engine_display_name || engine.engine_name}
				id={engine.engine_id}
				copyLabel={`Copy ${name} ID`}
				nameTestId="Title"
				idTestId={`engineHeader-${name}-id`}
				copyTestId={`engineHeader-copy-${name}-id-btn`}
				actions={
					<>
						<EngineAccessButton />
						{permission === "OWNER" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										disabled={exportLoading}
										variant="outline"
										size="icon"
										aria-label="Export"
										data-testid={formatToDataTestId(
											`engineHeader-${name}-export-btn`,
										)}
										onClick={() => {
											const engineType =
												engine.engine_subtype;
											if (engineType === "H2_DB") {
												setOpenExportModal(true);
											} else {
												exportDB(false);
											}
										}}
									>
										{exportLoading ? (
											<Spinner className="size-4" />
										) : (
											<Download className="size-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>Export</TooltipContent>
							</Tooltip>
						)}
					</>
				}
			/>

			<Dialog open={openExportModal} onOpenChange={setOpenExportModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Export Engine</DialogTitle>
						<DialogDescription>
							Do you want to export data along with the database?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setOpenExportModal(false);
								exportDB(false);
							}}
						>
							No
						</Button>
						<Button
							onClick={() => {
								setOpenExportModal(false);
								exportDB(true);
							}}
						>
							Yes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
