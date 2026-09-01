import {
	ArrowLeft,
	Calendar,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Copy,
	Globe,
	Layers,
	Layout,
	Lock,
	Maximize2,
	Minimize2,
	Shield,
	Sparkles,
	Tag as TagIcon,
	User,
	Zap,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	H3,
	P,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { CloneProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { getTagBadgeStyle } from "@/utility";
import { formatDateToLocal } from "@/utility/date";

export interface ScreenshotItem {
	url: string;
	title?: string;
	caption?: string;
}

export const TemplateDetailsPage: React.FC = observer((): JSX.Element => {
	const { id = "" } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { configStore } = useRootStore();

	const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
	const [activeScreenshotIdx, setActiveScreenshotIndex] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [isFit, setIsFit] = useState(true);

	// Dynamically pull all configured project metakeys
	const metaKeys = useMemo(() => {
		const configuredKeys = configStore.store.config.projectMetaKeys.map(
			(k) => k.metakey,
		);
		return Array.from(
			new Set([
				...configuredKeys,
				"description",
				"markdown",
				"tag",
				"tags",
				"images",
				"screenshots",
				"author",
				"version",
				"domain",
				"category",
				"data classification",
				"data restrictions",
			]),
		);
	}, [configStore.store.config.projectMetaKeys]);

	// Fetch full template project details by ID with all metadata
	const templatePixel = usePixel<Project[]>(
		id
			? `MyProjects(metaKeys=${JSON.stringify(metaKeys)}, metaFilters=[{"project_id":["${id}"]}], onlyTemplates=[true], limit=[1]);`
			: "",
	);

	const template = templatePixel.data?.[0];
	const isLoading = templatePixel.status === "LOADING";

	// Generate screenshot list (real project images or high quality fallback previews)
	const screenshots = useMemo<ScreenshotItem[]>(() => {
		if (!template) return [];

		const projectRecord = template as unknown as Record<string, unknown>;
		const rawImages = projectRecord.images || projectRecord.screenshots;
		if (Array.isArray(rawImages) && rawImages.length > 0) {
			return rawImages.map((url, i) => ({
				url: String(url),
				title: `${template.project_name} Screenshot ${i + 1}`,
				caption: `Screenshot view ${i + 1} for ${template.project_name}`,
			}));
		}

		return [
			{
				url: `https://placehold.co/1200x800/1e293b/ffffff?text=${encodeURIComponent(
					`${template.project_name}\nMain Application View`,
				)}`,
				title: "Main Application Interface",
				caption:
					"Primary layout and primary task view for this template.",
			},
			{
				url: `https://placehold.co/1200x800/0f172a/38bdf8?text=${encodeURIComponent(
					`${template.project_name}\nAnalytics & Insights Panel`,
				)}`,
				title: "Analytics & Data Insights",
				caption:
					"Interactive dashboard metrics and contextual workspace controls.",
			},
			{
				url: `https://placehold.co/1200x800/18181b/a855f7?text=${encodeURIComponent(
					`${template.project_name}\nWorkflow & Settings Configuration`,
				)}`,
				title: "Workflow & Action Settings",
				caption: "Configuration panel and integration options.",
			},
		];
	}, [template]);

	const activeScreenshot = screenshots[activeScreenshotIdx] || screenshots[0];
	const formattedCreatedDate = formatDateToLocal(
		template?.project_date_created || "",
	);
	const formattedEditedDate = formatDateToLocal(
		template?.project_date_last_edited || "",
	);

	const handleCopyId = () => {
		if (id) {
			navigator.clipboard.writeText(id);
			toast.success("Template ID copied to clipboard");
		}
	};

	const handleNextImage = () => {
		if (screenshots.length === 0) return;
		setActiveScreenshotIndex((prev) => (prev + 1) % screenshots.length);
		setZoom(1);
		setIsFit(true);
	};

	const handlePrevImage = () => {
		if (screenshots.length === 0) return;
		setActiveScreenshotIndex(
			(prev) => (prev - 1 + screenshots.length) % screenshots.length,
		);
		setZoom(1);
		setIsFit(true);
	};

	const handleZoomIn = () => {
		setIsFit(false);
		setZoom((prev) => Math.min(prev + 0.25, 2.5));
	};

	const handleZoomOut = () => {
		setZoom((prev) => {
			const next = Math.max(prev - 0.25, 0.75);
			if (next === 1) setIsFit(true);
			return next;
		});
	};

	const handleToggleFit = () => {
		if (isFit) {
			setIsFit(false);
			setZoom(1.5);
		} else {
			setIsFit(true);
			setZoom(1);
		}
	};

	// Extract all custom metadata attributes from template object
	const customMetadataEntries = useMemo(() => {
		if (!template) return [];
		const knownKeys = new Set([
			"project_id",
			"project_name",
			"project_display_name",
			"project_type",
			"project_date_created",
			"project_date_last_edited",
			"project_created_by",
			"project_created_by_type",
			"project_global",
			"project_favorite",
			"user_permission",
			"group_permission",
			"description",
			"markdown",
			"tag",
			"tags",
			"images",
			"screenshots",
		]);

		const entries: { key: string; value: string }[] = [];
		const record = template as unknown as Record<string, unknown>;

		for (const [k, v] of Object.entries(record)) {
			if (knownKeys.has(k) || v == null || v === "") continue;
			if (Array.isArray(v)) {
				if (v.length > 0) {
					entries.push({ key: k, value: v.join(", ") });
				}
			} else if (typeof v === "object") {
				entries.push({ key: k, value: JSON.stringify(v) });
			} else {
				entries.push({ key: k, value: String(v) });
			}
		}

		return entries;
	}, [template]);

	if (isLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!template && !isLoading) {
		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<div className="flex flex-col items-center justify-center py-20">
					<H3 className="font-semibold text-xl">
						Template Not Found
					</H3>
					<P className="mt-2 text-muted-foreground text-sm">
						The requested template could not be found or you do not
						have permission to view it.
					</P>
					<Button asChild className="mt-6">
						<Link to="/templates">Back to Templates Catalog</Link>
					</Button>
				</div>
			</>
		);
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
				{/* Back Navigation Bar */}
				<div className="mb-6 flex items-center justify-between">
					<Link
						to="/templates"
						className="inline-flex items-center gap-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-4" />
						Back to Templates
					</Link>

					<div className="flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="outline"
									onClick={handleCopyId}
									className="size-8"
								>
									<Copy className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Copy Template ID</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{/* Header Section */}
				<div className="mb-8 flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
					<div className="flex items-start gap-4">
						<AppCatalogAvatar
							name={
								template.project_display_name ||
								template.project_name
							}
							className="size-16 rounded-xl text-xl shadow-sm"
						/>
						<div className="flex flex-col gap-1.5">
							<div className="flex flex-wrap items-center gap-2">
								<H3 className="font-bold text-2xl tracking-tight">
									{template.project_display_name ||
										template.project_name}
								</H3>
								<Badge
									variant="secondary"
									className="gap-1 text-xs"
								>
									<Layout className="size-3" />
									Template
								</Badge>
								{template.project_global === "true" ||
								template.project_global === "1" ? (
									<Badge
										variant="outline"
										className="gap-1 text-primary text-xs"
									>
										<Globe className="size-3" />
										Public
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="gap-1 text-muted-foreground text-xs"
									>
										<Lock className="size-3" />
										Private
									</Badge>
								)}
							</div>

							<P className="max-w-2xl text-muted-foreground text-sm">
								{template.description ||
									"No description provided for this template."}
							</P>

							{(() => {
								const tagsList = Array.isArray(template.tag)
									? template.tag
									: template.tag
										? [template.tag]
										: [];
								if (tagsList.length === 0) return null;
								return (
									<div className="mt-1 flex flex-wrap gap-1.5">
										{tagsList.map((t: string) => (
											<Badge
												key={t}
												variant="outline"
												style={getTagBadgeStyle(t)}
												className="font-normal text-xs"
											>
												<TagIcon className="mr-1 size-3" />
												{t}
											</Badge>
										))}
									</div>
								);
							})()}
						</div>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
						<Button
							size="lg"
							className="gap-2 font-semibold shadow-sm"
							onClick={() => setIsCloneModalOpen(true)}
						>
							<Sparkles className="size-4" />
							Use Template
						</Button>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Left Column (Inline Screenshots & Documentation) */}
					<div className="flex flex-col gap-8 lg:col-span-2">
						{/* Inline Screenshot Viewer (No popup dialog) */}
						<Card className="overflow-hidden p-0 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between border-b px-6 py-3.5">
								<CardTitle className="font-semibold text-base">
									Screenshots & Previews
								</CardTitle>
								<div className="flex items-center gap-1.5">
									<Button
										size="icon"
										variant="ghost"
										className="size-8"
										onClick={handleZoomOut}
										title="Zoom Out"
										disabled={zoom <= 0.75}
									>
										<ZoomOut className="size-4" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										className="size-8"
										onClick={handleZoomIn}
										title="Zoom In"
										disabled={zoom >= 2.5}
									>
										<ZoomIn className="size-4" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										className="size-8"
										onClick={handleToggleFit}
										title={
											isFit ? "Expand Scale" : "Reset Fit"
										}
									>
										{isFit ? (
											<Maximize2 className="size-4" />
										) : (
											<Minimize2 className="size-4" />
										)}
									</Button>
								</div>
							</CardHeader>

							<CardContent className="p-0">
								{/* Inline Main Image View Container */}
								<div className="relative flex max-h-[70vh] min-h-[400px] w-full items-center justify-center overflow-auto bg-black/5 p-4 dark:bg-black/40">
									{screenshots.length > 1 && (
										<>
											<Button
												size="icon"
												variant="secondary"
												className="-translate-y-1/2 absolute top-1/2 left-4 z-10 size-10 rounded-full shadow-md backdrop-blur-sm"
												onClick={handlePrevImage}
												title="Previous image"
											>
												<ChevronLeft className="size-5" />
											</Button>
											<Button
												size="icon"
												variant="secondary"
												className="-translate-y-1/2 absolute top-1/2 right-4 z-10 size-10 rounded-full shadow-md backdrop-blur-sm"
												onClick={handleNextImage}
												title="Next image"
											>
												<ChevronRight className="size-5" />
											</Button>
										</>
									)}

									<div className="flex items-center justify-center transition-all duration-200">
										<img
											src={activeScreenshot.url}
											alt={
												activeScreenshot.title ||
												template.project_name
											}
											className={`rounded-lg object-contain shadow-md transition-transform duration-200 ${
												isFit
													? "max-h-[60vh] max-w-full"
													: ""
											}`}
											style={
												!isFit
													? {
															transform: `scale(${zoom})`,
														}
													: undefined
											}
										/>
									</div>
								</div>

								{/* Inline Caption Bar */}
								{activeScreenshot.title ||
								activeScreenshot.caption ? (
									<div className="flex flex-col border-t bg-card px-6 py-2.5">
										{activeScreenshot.title && (
											<span className="font-medium text-sm">
												{activeScreenshot.title}
											</span>
										)}
										{activeScreenshot.caption && (
											<span className="text-muted-foreground text-xs">
												{activeScreenshot.caption}
											</span>
										)}
									</div>
								) : null}

								{/* Inline Thumbnail Selector Strip */}
								{screenshots.length > 1 && (
									<div className="flex items-center gap-3 overflow-x-auto border-t bg-muted/20 p-4">
										{screenshots.map((s, idx) => (
											<button
												key={`preview-${s.title || "shot"}-${s.url.slice(-10)}`}
												type="button"
												onClick={() => {
													setActiveScreenshotIndex(
														idx,
													);
													setZoom(1);
													setIsFit(true);
												}}
												className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
													idx === activeScreenshotIdx
														? "border-primary ring-2 ring-primary/20"
														: "border-transparent opacity-70 hover:opacity-100"
												}`}
											>
												<img
													src={s.url}
													alt={
														s.title ||
														`Preview ${idx + 1}`
													}
													className="h-full w-full object-cover"
												/>
											</button>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Markdown / Full Project Description */}
						{template.markdown || template.description ? (
							<Card className="p-6 shadow-sm">
								<CardTitle className="mb-3 font-semibold text-base">
									About this Template
								</CardTitle>
								<P className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
									{template.markdown || template.description}
								</P>
							</Card>
						) : null}

						{/* Custom Metadata Attributes Grid */}
						{customMetadataEntries.length > 0 && (
							<Card className="p-6 shadow-sm">
								<CardTitle className="mb-4 font-semibold text-base">
									Project Attributes
								</CardTitle>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									{customMetadataEntries.map(
										({ key, value }) => (
											<div
												key={key}
												className="flex flex-col gap-1 rounded-lg border bg-card p-3"
											>
												<span className="font-medium text-muted-foreground text-xs capitalize">
													{key.replaceAll("_", " ")}
												</span>
												<span className="font-medium text-sm">
													{value}
												</span>
											</div>
										),
									)}
								</div>
							</Card>
						)}

						{/* Features & Key Capabilities */}
						<Card className="p-6 shadow-sm">
							<CardTitle className="mb-4 font-semibold text-base">
								What's Included in this Template
							</CardTitle>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex items-start gap-3 rounded-lg border bg-card p-3.5">
									<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-sm">
											Ready-to-use Layout
										</span>
										<span className="text-muted-foreground text-xs">
											Pre-configured responsive structure
											and layout blocks.
										</span>
									</div>
								</div>

								<div className="flex items-start gap-3 rounded-lg border bg-card p-3.5">
									<Zap className="mt-0.5 size-5 shrink-0 text-primary" />
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-sm">
											Instant Customization
										</span>
										<span className="text-muted-foreground text-xs">
											Easily adapt metadata, theme tokens,
											and data sources.
										</span>
									</div>
								</div>

								<div className="flex items-start gap-3 rounded-lg border bg-card p-3.5">
									<Layers className="mt-0.5 size-5 shrink-0 text-primary" />
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-sm">
											Modular Pipeline
										</span>
										<span className="text-muted-foreground text-xs">
											Built with clean, re-usable SEMOSS
											SDK components.
										</span>
									</div>
								</div>

								<div className="flex items-start gap-3 rounded-lg border bg-card p-3.5">
									<Sparkles className="mt-0.5 size-5 shrink-0 text-warning" />
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-sm">
											Zero Setup Code
										</span>
										<span className="text-muted-foreground text-xs">
											Clone into your workspace and start
											building immediately.
										</span>
									</div>
								</div>
							</div>
						</Card>
					</div>

					{/* Right Column (Sidebar Information) */}
					<div className="flex flex-col gap-6">
						{/* Template Action Box */}
						<Card className="border-primary/20 bg-primary/5 p-6 shadow-sm">
							<CardTitle className="font-semibold text-base">
								Start Building with this Template
							</CardTitle>
							<P className="mt-2 text-muted-foreground text-sm">
								Clicking "Use Template" clones this project
								directly into your personal workspace with
								pre-configured settings.
							</P>
							<Button
								size="lg"
								className="mt-5 w-full gap-2 font-semibold shadow-sm"
								onClick={() => setIsCloneModalOpen(true)}
							>
								<Sparkles className="size-4" />
								Use Template
							</Button>
						</Card>

						{/* Template Metadata Details */}
						<Card className="p-6 shadow-sm">
							<CardTitle className="mb-4 font-semibold text-base">
								Template Information
							</CardTitle>
							<div className="flex flex-col divide-y text-sm">
								<div className="flex items-center justify-between py-2.5">
									<span className="flex items-center gap-2 text-muted-foreground">
										<Layout className="size-4" />
										Project ID
									</span>
									<span className="font-medium font-mono text-xs">
										{id}
									</span>
								</div>

								{template.project_created_by && (
									<div className="flex items-center justify-between py-2.5">
										<span className="flex items-center gap-2 text-muted-foreground">
											<User className="size-4" />
											Created By
										</span>
										<span className="font-medium text-xs">
											{template.project_created_by}
										</span>
									</div>
								)}

								<div className="flex items-center justify-between py-2.5">
									<span className="flex items-center gap-2 text-muted-foreground">
										<Calendar className="size-4" />
										Created Date
									</span>
									<span className="font-medium text-xs">
										{formattedCreatedDate || "N/A"}
									</span>
								</div>

								{formattedEditedDate ? (
									<div className="flex items-center justify-between py-2.5">
										<span className="flex items-center gap-2 text-muted-foreground">
											<Clock className="size-4" />
											Last Edited
										</span>
										<span className="font-medium text-xs">
											{formattedEditedDate}
										</span>
									</div>
								) : null}

								<div className="flex items-center justify-between py-2.5">
									<span className="flex items-center gap-2 text-muted-foreground">
										<Layers className="size-4" />
										Type
									</span>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{template.project_type || "CODE"}
									</Badge>
								</div>

								<div className="flex items-center justify-between py-2.5">
									<span className="flex items-center gap-2 text-muted-foreground">
										<Globe className="size-4" />
										Visibility
									</span>
									<span className="font-medium text-xs capitalize">
										{template.project_global === "true" ||
										template.project_global === "1"
											? "Public"
											: "Private"}
									</span>
								</div>

								{template.user_permission !== undefined && (
									<div className="flex items-center justify-between py-2.5">
										<span className="flex items-center gap-2 text-muted-foreground">
											<Shield className="size-4" />
											Permission Level
										</span>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											Level {template.user_permission}
										</Badge>
									</div>
								)}
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* Clone Project Dialog */}
			{isCloneModalOpen && template && (
				<CloneProjectDialog
					open={isCloneModalOpen}
					project={template}
					onClose={(newAppId) => {
						setIsCloneModalOpen(false);
						if (newAppId) {
							navigate(`/s/${newAppId}`);
						}
					}}
				/>
			)}
		</>
	);
});
