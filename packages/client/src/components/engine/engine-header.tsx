import { ChevronRight, Copy, Download, Hammer, Pencil } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import BRAIN from "@/assets/img/BRAIN.png";
import { useEngine, useRootStore } from "@/hooks";
import { ENGINE_IMAGES } from "@/pages/import";
import { formatToDataTestId } from "@/utility";
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

	// mcp generation loading state
	const [generatingMCP, setGeneratingMCP] = useState(false);

	const normalizeEngineKey = (value?: string) =>
		(value || "")
			.trim()
			.replace(/[^A-Za-z0-9]+/g, "_")
			.toUpperCase();

	const findDBImage = (appType: string, appSubType: string) => {
		const typeKey = normalizeEngineKey(appType);
		const subtypeKeyRaw = normalizeEngineKey(appSubType);
		const subtypeKey =
			subtypeKeyRaw === "GUANACO" ? "HUGGINGFACE" : subtypeKeyRaw;
		const images = ENGINE_IMAGES[typeKey] || [];
		const obj = images.find((ele) => {
			return normalizeEngineKey(ele.name) === subtypeKey;
		});

		if (!obj) {
			return BRAIN;
		}

		return obj.icon;
	};

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

	/**
	 * Generates an MCP for the given engine.
	 * @throws {string} If the generation fails, it throws an error message.
	 */
	const generateMCP = async () => {
		const pixel = `MakeEngineMCP(engine="${active.id}");`;

		const { pixelReturn } = await monolithStore.runQuery(pixel);

		if (pixelReturn[0].operationType.includes("ERROR")) {
			throw pixelReturn[0].output as string;
		}

		// add MCP tag to the engine if not already present
		const existingTags = Array.isArray(active.metadata.tag)
			? (active.metadata.tag as string[])
			: [];

		if (!existingTags.includes("MCP")) {
			active.metadata.tag = [...existingTags, "MCP"];
		} else {
			active.metadata.tag = existingTags;
		}
	};

	/**
	 * Handles clicking the "Generate MCP" button. It triggers the generation
	 * process and navigates to the files view when complete. Errors are shown as
	 * toasts and a loading state keeps the button disabled while processing.
	 * @param {string} type - The type of engine.
	 * @param {string} active.id - The ID of the active engine.
	 * @param {string} navigationPath - The path to navigate to.
	 */
	const handleMCPClick = async () => {
		const navigationPath = `/engine/${type.toLowerCase()}/${active.id}/files?mcp=Generate`;
		setGeneratingMCP(true);
		try {
			await generateMCP();
			navigate(navigationPath);
		} catch (error) {
			toast.error(error as string);
		} finally {
			setGeneratingMCP(false);
		}
	};
	
	const canShowGenerateMCP = type !== "GUARDRAIL";

	return (
		<div className="flex w-full flex-col items-start gap-2 p-0">
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

			<div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
				{/* Image placeholder - space for engine/database icon */}
				<div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-muted/30 p-2">
					<img
						src={findDBImage(
							type,
							(active.engine_subtype ||
								(active.metadata
									.engine_subtype as string)) as string,
						)}
						alt={name}
						className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
					/>
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h1
						className="break-words font-semibold text-2xl text-foreground leading-normal md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-[30px]"
						data-testid="Title"
					>
						{active.name}
					</h1>
					<div className="flex flex-row items-center gap-1">
						<span
							className="text-muted-foreground text-sm"
							data-testid={`engineHeader-${name}-id`}
						>
							{active.id}
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`copy ${name} ID`}
									data-testid={`engineHeader-copy-${name}-id-btn`}
									onClick={(e) => {
										// prevent the default action
										e.preventDefault();

										// copy
										try {
											navigator.clipboard.writeText(
												active.id,
											);

											toast.success(
												"ID copied to clipboard",
											);
										} catch (e) {
											console.error(e);

											toast.error("Failed to copy ID");
										}
									}}
								>
									<Copy className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Copy {name} ID</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end">
					{canShowGenerateMCP && (
						<Button
							variant="outline"
							size="lg"
							onClick={handleMCPClick}
							data-testid="make-mcp-btn"
						>
							<div className="flex flex-row items-center">
								{generatingMCP ? (
									<Spinner className="mr-2 size-4" />
								) : (
									<Hammer className="mr-2 size-4" />
								)}
								{generatingMCP
									? "Processing..."
									: "Generate MCP"}
							</div>
						</Button>
					)}
					<EngineAccessButton />
					{active.role === "OWNER" && (
						<Button
							disabled={exportLoading}
							variant="ghost"
							className="text-(--primary) hover:bg-transparent hover:text-(--primary)"
							data-testid={formatToDataTestId(
								`engineHeader-${name}-export-btn`,
							)}
							onClick={() => {
								const engineType =
									active.engine_subtype ||
									(active.metadata.engine_subtype as string);
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
							Export
						</Button>
					)}
					{canEdit && (
						<Button
							variant="default"
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
							Edit
						</Button>
					)}
				</div>
			</div>

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
										className="border-(--primary) text-(--primary)"
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
