import {
	ChevronRight,
	Copy,
	CopyPlus,
	Info,
	Pencil,
	Trash2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { PromptDeleteModal } from "../../components/prompt/PromptDeleteModal";
import type { Prompt } from "../../components/prompt/prompt.types";
import { PromptModal } from "./PromptModal";

const hashString = (str: string): number => {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) - h + str.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h);
};

const generateGradient = (name: string): string => {
	const base = hashString(name) % 360;
	const hue2 = (base + 35) % 360;
	const hue3 = (base + 70) % 360;
	return `linear-gradient(135deg, hsl(${base} 45% 88%), hsl(${hue2} 40% 84%), hsl(${hue3} 35% 80%))`;
};

const buildInitials = (label: string): string => {
	const tokens = label.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
	const chars = tokens.map((t) => t[0].toUpperCase());
	return chars.slice(0, 3).join("");
};

/**
 * Format a date string to a human-readable "X days/months ago" string
 */
const formatTimeAgo = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	if (diffDays < 1) return "today";
	if (diffDays === 1) return "1 day ago";
	if (diffDays < 30) return `${diffDays} days ago`;
	const diffMonths = Math.floor(diffDays / 30);
	if (diffMonths === 1) return "a month ago";
	if (diffMonths < 12) return `${diffMonths} months ago`;
	const diffYears = Math.floor(diffDays / 365);
	if (diffYears === 1) return "a year ago";
	return `${diffYears} years ago`;
};

export const PromptDetailPage = observer(() => {
	const { promptId } = useParams<{ promptId: string }>();
	const { configStore, monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [versions, setVersions] = useState<Prompt[]>([]);
	const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
	const [showVersions, setShowVersions] = useState(true);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
	const [isSettingActive, setIsSettingActive] = useState(false);

	const currentVersion = versions[selectedVersionIndex] ?? null;
	const latestVersion = versions[0] ?? null;

	const isOwner = useMemo(() => {
		if (!latestVersion) return false;
		return latestVersion.created_by === configStore.store.user.id;
	}, [latestVersion, configStore.store.user.id]);

	const loadPrompt = () => {
		if (!promptId) return;
		monolithStore
			.runQuery(`GetPromptWithVersions(promptId='${promptId}')`)
			.then((response) => {
				const output = response.pixelReturn[0].output as Prompt[];
				if (output && output.length > 0) {
					setVersions(output);
					setSelectedVersionIndex(0);
				}
			});
	};

	useEffect(() => {
		loadPrompt();
	}, [promptId]);

	const selectVersion = (index: number) => {
		setSelectedVersionIndex(index);
	};

	const handleSetAsActive = () => {
		if (!currentVersion || !promptId) return;
		setIsSettingActive(true);
		const promptMap = {
			context: currentVersion.context || "",
			title: currentVersion.title || "",
			intent: currentVersion.intent || "",
			tags: currentVersion.tags || [],
			id: promptId,
		};
		const stringified =
			"UpdatePrompt ( map = [" + JSON.stringify(promptMap) + " ])";
		monolithStore
			.runQuery(stringified)
			.then(() => {
				loadPrompt();
			})
			.finally(() => {
				setIsSettingActive(false);
			});
	};

	if (!currentVersion) {
		return (
			<div className="flex flex-col gap-6">
				<P className="text-muted-foreground">Loading prompt...</P>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col gap-3">
			{/* Breadcrumb */}
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link to="/prompt" className="text-inherit">
								Prompts
							</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator>
						<ChevronRight className="size-3.5" />
					</BreadcrumbSeparator>
					<BreadcrumbItem>
						<BreadcrumbPage>{latestVersion.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* Avatar + Title + ID + Action Buttons */}
			<div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
				{/* Avatar */}
				<div
					className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
					style={{
						background: generateGradient(
							latestVersion.title || "Prompt",
						),
					}}
				>
					<span className="font-semibold text-2xl text-white">
						{buildInitials(latestVersion.title || "Prompt")}
					</span>
				</div>

				{/* Title + ID */}
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h1
						className="font-semibold text-2xl text-foreground leading-normal md:overflow-hidden md:text-ellipsis md:whitespace-nowrap md:text-[30px]"
						title={latestVersion.title}
					>
						{latestVersion.title}
					</h1>
					{promptId && (
						<div className="flex items-center gap-1 text-muted-foreground text-sm">
							<span>{promptId}</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Copy Prompt ID"
										onClick={() => {
											navigator.clipboard.writeText(
												promptId ?? "",
											);
										}}
									>
										<Copy className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Copy Prompt ID</TooltipContent>
							</Tooltip>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end">
					{isOwner && (
						<Button
							variant="ghost"
							className="gap-2 text-destructive hover:bg-transparent hover:text-destructive"
							onClick={() => setIsDeleteModalOpen(true)}
						>
							<Trash2 className="size-4" />
							Delete
						</Button>
					)}
					<Button
						variant="outline"
						className="gap-2"
						onClick={() => setIsDuplicateModalOpen(true)}
					>
						<CopyPlus className="size-4" />
						Duplicate
					</Button>
					{isOwner && (
						<Button
							variant="default"
							className="gap-2"
							onClick={() => setIsEditModalOpen(true)}
						>
							<Pencil className="size-4" />
							Edit
						</Button>
					)}
				</div>
			</div>

			{/* Tags (left) | Published by + Updated (right) */}
			<div className="mt-4 flex w-full flex-col gap-4 md:flex-row md:justify-between">
				<div className="flex flex-1 flex-col gap-4">
					{currentVersion.tags?.length > 0 ? (
						<div className="flex flex-row flex-wrap gap-2 pb-2">
							{currentVersion.tags.map((tag) => (
								<Badge
									key={tag}
									variant="outline"
									className="border-primary text-primary"
								>
									{tag}
								</Badge>
							))}
						</div>
					) : null}
				</div>
				<div className="flex flex-col items-start gap-1 text-left text-muted-foreground text-sm md:items-end md:text-right">
					<span>
						Published by: {latestVersion.created_by || "Unknown"}
					</span>
					<span>
						Updated{" "}
						{latestVersion.date_created
							? new Date(
									latestVersion.date_created,
								).toLocaleString("en-US", {
									month: "long",
									day: "2-digit",
									year: "numeric",
									hour: "numeric",
									minute: "2-digit",
									hour12: true,
								})
							: "N/A"}
					</span>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex gap-6">
				{/* Version Timeline */}
				{versions.length >= 1 && (
					<div className="w-[280px] shrink-0">
						<Collapsible
							open={showVersions}
							onOpenChange={setShowVersions}
						>
							<div className="rounded-lg border bg-card shadow-sm">
								<div className="flex items-center justify-between px-4 py-3">
									<span className="font-semibold text-sm">
										Template Versions
									</span>
									<CollapsibleTrigger asChild>
										<Button variant="ghost" size="sm">
											{showVersions ? "Hide" : "Show"}
										</Button>
									</CollapsibleTrigger>
								</div>
								<CollapsibleContent>
									<div className="border-t" />
									<div className="max-h-[500px] overflow-y-auto px-4 py-3">
										<div className="flex flex-col">
											{versions.map((version, index) => (
												<button
													key={`${version.id}-${version.version ?? index}`}
													type="button"
													className="flex w-full cursor-pointer gap-3 text-left hover:bg-muted/40"
													onClick={() =>
														selectVersion(index)
													}
												>
													{/* Timeline dot + line */}
													<div className="flex flex-col items-center pt-1">
														<div
															className={`size-3.5 shrink-0 rounded-full border-2 ${
																selectedVersionIndex ===
																index
																	? "border-primary bg-primary"
																	: "border-muted-foreground/40 bg-transparent"
															}`}
														/>
														{index <
															versions.length -
																1 && (
															<div
																className="w-0.5 flex-1 bg-border"
																style={{
																	minHeight: 40,
																}}
															/>
														)}
													</div>
													{/* Version info */}
													<div className="pb-4">
														<span
															className={`text-sm ${
																selectedVersionIndex ===
																index
																	? "font-bold"
																	: "font-medium"
															}`}
														>
															Version{" "}
															{(version.version ??
																versions.length -
																	index) + 1}
														</span>
														<div className="text-[11px] text-muted-foreground">
															{formatTimeAgo(
																version.date_created,
															)}
															{version.created_by
																? ` · ${version.created_by}`
																: ""}
														</div>
														{version.intent && (
															<div className="text-[11px] text-muted-foreground">
																{version.intent}
															</div>
														)}
														{version.tags?.length >
															0 && (
															<div className="mt-1 flex flex-wrap gap-1">
																{version.tags.map(
																	(tag) => (
																		<Badge
																			key={
																				tag
																			}
																			variant="outline"
																			className="text-[10px]"
																		>
																			{
																				tag
																			}
																		</Badge>
																	),
																)}
															</div>
														)}
													</div>
												</button>
											))}
										</div>
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					</div>
				)}

				{/* Prompt Content */}
				<div className="flex flex-1 flex-col gap-4">
					{/* Description */}
					<div className="rounded-lg border bg-card p-6 shadow-sm">
						<div className="mb-3">
							<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								Description
							</span>
						</div>
						<P className="whitespace-pre-wrap text-sm leading-relaxed">
							{currentVersion.intent || "No description"}
						</P>
					</div>

					{/* System Prompt */}
					<div className="flex-1 rounded-lg border bg-card p-6 shadow-sm">
						<div className="mb-3 flex items-center justify-between">
							<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								Prompt Context
							</span>
						</div>
						<P className="whitespace-pre-wrap text-sm leading-relaxed">
							{currentVersion.context || "No context provided"}
						</P>
					</div>

					{/* Metadata */}
					<div className="rounded-lg border bg-card p-4 shadow-sm">
						<span className="mb-3 block font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							Metadata
						</span>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="flex flex-col gap-0.5">
								<span className="text-muted-foreground">
									Created by
								</span>
								<span>
									{currentVersion.created_by || "Unknown"}
								</span>
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-muted-foreground">
									Date created
								</span>
								<span>
									{currentVersion.date_created || "Unknown"}
								</span>
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-muted-foreground">
									Visibility
								</span>
								<span>
									{currentVersion.global
										? "Global"
										: "Private"}
								</span>
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-muted-foreground">
									Version
								</span>
								<span>
									{(currentVersion.version ??
										versions.length -
											selectedVersionIndex) + 1}
									{selectedVersionIndex === 0
										? " (Latest)"
										: ""}
								</span>
							</div>
						</div>
					</div>

					{/* Set as Active */}
					{isOwner && selectedVersionIndex > 0 && (
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="default"
								onClick={handleSetAsActive}
								disabled={isSettingActive}
							>
								{isSettingActive
									? "Setting..."
									: "Set as Active"}
							</Button>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="size-4 text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent>
									Creates a new version with this version's
									data as the latest
								</TooltipContent>
							</Tooltip>
						</div>
					)}
				</div>
			</div>

			<PromptDeleteModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				promptId={promptId || ""}
				onDelete={() => navigate("/prompt")}
			/>

			{/* Edit Modal */}
			<PromptModal
				isOpen={isEditModalOpen}
				prompt={promptId || ""}
				onClose={(reload) => {
					setIsEditModalOpen(false);
					if (reload) {
						loadPrompt();
					}
				}}
				mode="Edit"
				initialData={{
					title: currentVersion.title || "",
					context: currentVersion.context || "",
					intent: currentVersion.intent || "",
					tags: currentVersion.tags || [],
					global: currentVersion.global ?? true,
					version:
						currentVersion.version ??
						versions.length - selectedVersionIndex,
				}}
			/>

			{/* Duplicate Modal */}
			<PromptModal
				isOpen={isDuplicateModalOpen}
				onClose={(reload) => {
					setIsDuplicateModalOpen(false);
					if (reload) {
						navigate("/prompt");
					}
				}}
				mode="Add"
				initialData={{
					title: currentVersion.title
						? `${currentVersion.title} (Copy)`
						: "",
					context: currentVersion.context || "",
					intent: currentVersion.intent || "",
					tags: currentVersion.tags || [],
					global: currentVersion.global ?? true,
				}}
			/>
		</div>
	);
});
