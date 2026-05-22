import { ChevronRight, Download, Pencil } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
	Badge,
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
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId, getTagBadgeStyle } from "@/utility";
import { EntityHeader } from "../shared/entity-header";
import { EngineAccessButton } from ".";

/**
 * Engine Header
 */
export const EngineHeader: React.FC = () => {
	// get the engine information
	const { name, active, type } = useEngine();

	// navigation
	const navigate = useNavigate();

	// Service for Axios calls
	const { monolithStore } = useRootStore();

	const [openExportModal, setOpenExportModal] = useState(false);

	// export loading state
	const [exportLoading, setExportLoading] = useState(false);

	const canEdit = active.role === "OWNER" || active.role === "EDITOR";

	const formatEngineTimestamp = (rawValue?: string) => {
		if (!rawValue) {
			return "N/A";
		}

		const normalizedValue = rawValue.includes("T")
			? rawValue
			: rawValue.replace(" ", "T");
		const parsedDate = new Date(normalizedValue);

		if (Number.isNaN(parsedDate.getTime())) {
			return rawValue;
		}

		return parsedDate.toLocaleString("en-US", {
			month: "long",
			day: "2-digit",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	/**
	 * @name exportDB
	 * @desc export DB pixel
	 */
	const exportDB = (includeData: boolean) => {
		setExportLoading(true);
		const pixel = `META | ExportEngine(engine=["${
			active.id
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
							{active.name}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<EntityHeader
				icon={
					<EngineSubtypeIcon
						engineType={type}
						engineSubtype={
							(active.engine_subtype ||
								(active.metadata
									.engine_subtype as string)) as string
						}
						alt={name}
						className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
					/>
				}
				name={active.name}
				id={active.id}
				copyLabel={`Copy ${name} ID`}
				nameTestId="Title"
				idTestId={`engineHeader-${name}-id`}
				copyTestId={`engineHeader-copy-${name}-id-btn`}
				actions={
					<>
						<EngineAccessButton />
						{active.role === "OWNER" && (
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
												active.engine_subtype ||
												(active.metadata
													.engine_subtype as string);
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
						{canEdit && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										aria-label="Edit"
										onClick={() => {
											navigate(
												`/engine/${type.toLowerCase()}/${active.id}/edit`,
											);
										}}
										data-testid={formatToDataTestId(
											`editEngineDetails-${name}-edit-btn`,
										)}
									>
										<Pencil className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit</TooltipContent>
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

			<div className="mt-4 flex w-full flex-col gap-4 md:flex-row md:justify-between">
				<div className="flex flex-1 flex-col gap-4">
					<p
						className="overflow-hidden whitespace-normal text-muted-foreground"
						data-testid="Description"
					>
						{(active.metadata.description as unknown as string) ||
							""}
					</p>

					<div className="flex flex-row flex-wrap gap-2">
						{active.metadata?.tag &&
							(active.metadata?.tag as string[]).map((tag) => {
								if (tag === "") return null;
								return (
									<Badge
										key={tag}
										variant="outline"
										style={getTagBadgeStyle(tag)}
										data-testid="tag-chip"
									>
										{tag}
									</Badge>
								);
							})}
					</div>
				</div>
				<div className="flex flex-col items-start gap-1 text-left md:items-end md:text-right">
					<span
						className="text-muted-foreground text-sm"
						data-testid="CreatedBy"
					>
						Created by: {active.engine_created_by || "Unknown"}
					</span>
					{(active.last_updated || active.engine_date_created) && (
						<span
							className="text-muted-foreground text-sm"
							data-testid="DateAdded"
						>
							Updated{" "}
							{formatEngineTimestamp(
								active.last_updated ||
									active.engine_date_created,
							)}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
