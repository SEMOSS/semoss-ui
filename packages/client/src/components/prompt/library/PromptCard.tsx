import { Copy, ExternalLink, Info, MoreVertical } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	P,
	toast,
} from "@semoss/ui/next";
import { PromptModal } from "../../../pages/prompt/PromptModal";
import { PromptDeleteModal } from "../PromptDeleteModal";
import type { Prompt } from "../prompt.types";

/**
 * Hash string to number for gradient generation
 */
const hashString = (str: string): number => {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) - h + str.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h);
};

/**
 * Generate gradient based on prompt title
 */
const generateGradient = (name: string): string => {
	const base = hashString(name) % 360;
	return `hsl(${base}, 22%, 72%)`;
};

const generateInitialsColor = (name: string): string => {
	const base = hashString(name) % 360;
	return `hsl(${base}, 28%, 28%)`;
};

/**
 * Format a UTC timestamp as "Updated X days/months/years ago"
 */
const formatUpdatedAgo = (dateString?: string | null): string | null => {
	if (!dateString) return null;
	const normalized = /[zZ]$|[+-]\d{2}:\d{2}$/.test(dateString)
		? dateString
		: `${dateString}Z`;
	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) return null;
	const now = Date.now();
	const diffMs = Math.max(0, now - parsed.getTime());
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays <= 0) {
		return "Updated today";
	}

	if (diffDays < 30) {
		return `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
	}

	if (diffDays < 365) {
		const months = Math.floor(diffDays / 30);
		return `Updated ${months} month${months === 1 ? "" : "s"} ago`;
	}

	const years = Math.floor(diffDays / 365);
	return `Updated ${years} year${years === 1 ? "" : "s"} ago`;
};

/**
 * Build initials from prompt title
 */
const buildInitials = (label: string): string => {
	const tokens = label.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
	const chars = tokens.map((t) => t[0].toUpperCase());
	return chars.slice(0, 3).join("");
};

interface PromptCardProps {
	prompt: Prompt;
	onClick: (p: Prompt) => void;
	variant?: "catalog" | "row";
	isOwner?: boolean;
	onDelete?: (p: Prompt) => void;
}

export const PromptCard = (props: PromptCardProps) => {
	const {
		prompt,
		onClick,
		variant = "catalog",
		isOwner = false,
		onDelete,
	} = props;

	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [promptModalMode, setPromptModalMode] = useState<
		"Edit" | "Add" | null
	>(null);

	const gradient = useMemo(
		() => generateGradient(prompt.title || prompt.id || "Prompt"),
		[prompt.id, prompt.title],
	);

	const initialsColor = useMemo(
		() => generateInitialsColor(prompt.title || prompt.id || "Prompt"),
		[prompt.id, prompt.title],
	);

	const initials = useMemo(
		() => buildInitials(prompt.title || "Prompt"),
		[prompt.title],
	);

	const displayTags = useMemo(
		() => (prompt.tags ? prompt.tags.slice().sort() : []),
		[prompt.tags],
	);

	const updatedLine = useMemo(
		() =>
			formatUpdatedAgo(prompt.date_created) || "Updated date unavailable",
		[prompt.date_created],
	);

	const handleCardClick = useCallback(() => {
		onClick(prompt);
	}, [onClick, prompt]);

	const handleInfoOpen = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsInfoOpen(true);
	}, []);

	const handleCopyId = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				navigator.clipboard.writeText(prompt.id);
				toast.success("Prompt ID copied to clipboard");
			} catch {
				toast.error("Failed to copy Prompt ID");
			}
		},
		[prompt.id],
	);

	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setPromptModalMode("Edit");
	}, []);

	const handleOpenNewTab = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			window.open(
				`#/prompt/${prompt.id}`,
				"_blank",
				"noopener,noreferrer",
			);
		},
		[prompt.id],
	);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDeleteModalOpen(true);
	}, []);

	const handleDuplicate = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setPromptModalMode("Add");
	}, []);

	const headerActionClass = "bg-white/15 text-white hover:bg-white/25";

	// Row variant
	if (variant === "row") {
		return (
			<>
				<div className="w-full rounded-lg border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
					<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
						<button
							type="button"
							className="flex min-w-0 flex-1 items-start gap-3 text-left"
							onClick={handleCardClick}
						>
							<div
								className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
								style={{ background: gradient }}
							>
								<div
									className="font-semibold text-xs"
									style={{ color: initialsColor }}
								>
									{initials}
								</div>
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="truncate font-medium text-[15px] leading-tight">
									{prompt.title}
								</h3>
								<div className="mt-1 flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
									<span className="truncate">
										{prompt.id}
									</span>
									<Button
										variant="ghost"
										size="icon-sm"
										className="h-6 w-6"
										onClick={handleCopyId}
										aria-label="Copy prompt ID"
										title="Copy prompt ID"
									>
										<Copy className="size-3.5" />
									</Button>
								</div>
								{prompt.intent ? (
									<P className="mt-2 line-clamp-3 text-muted-foreground text-sm">
										{prompt.intent}
									</P>
								) : null}
							</div>
						</button>

						<div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
							{displayTags.length > 0 ? (
								<div className="flex flex-wrap items-center gap-1">
									{displayTags.slice(0, 2).map((tag) => (
										<Badge
											key={`${prompt.id}-${tag}`}
											variant="secondary"
											className="text-[10px] uppercase"
										>
											{tag}
										</Badge>
									))}
									{displayTags.length > 2 ? (
										<span className="text-[10px] text-muted-foreground">
											+{displayTags.length - 2}
										</span>
									) : null}
								</div>
							) : null}
							<div className="flex flex-col gap-2 md:items-end">
								<div
									className="text-xs"
									style={{
										color: "var(--color-text-tertiary)",
									}}
								>
									{updatedLine}
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={handleOpenNewTab}
										aria-label="Open prompt in new tab"
										title={`Open ${prompt.title || "prompt"} in new tab`}
									>
										<ExternalLink className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="View prompt info"
										title={`View info for ${prompt.title || "prompt"}`}
										onClick={handleInfoOpen}
									>
										<Info className="size-4" />
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={(e) =>
													e.stopPropagation()
												}
												aria-label="More options"
											>
												<MoreVertical className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={handleCopyId}
											>
												Copy Prompt ID
											</DropdownMenuItem>
											{isOwner && (
												<DropdownMenuItem
													onClick={handleEdit}
												>
													Edit Prompt
												</DropdownMenuItem>
											)}
											<DropdownMenuItem
												onClick={handleDuplicate}
											>
												Duplicate Prompt
											</DropdownMenuItem>
											{isOwner && (
												<DropdownMenuItem
													onClick={handleDelete}
												>
													Delete Prompt
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Info Modal */}
				<Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
					<DialogContent
						className="sm:max-w-md"
						onClick={(e) => e.stopPropagation()}
					>
						<DialogHeader>
							<DialogTitle>{prompt.title}</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-3 text-sm">
							{prompt.created_by && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Created by
									</span>
									<span>{prompt.created_by}</span>
								</div>
							)}
							{prompt.date_created && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Date created
									</span>
									<span>{prompt.date_created}</span>
								</div>
							)}
							{prompt.id && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Prompt ID
									</span>
									<span className="max-w-[200px] truncate font-mono text-xs">
										{prompt.id}
									</span>
								</div>
							)}
							{prompt.tags?.length > 0 && (
								<div className="flex flex-col gap-1.5">
									<span className="text-muted-foreground">
										Tags
									</span>
									<div className="flex flex-wrap gap-1">
										{prompt.tags
											.slice()
											.sort()
											.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="text-xs uppercase"
												>
													{tag}
												</Badge>
											))}
									</div>
								</div>
							)}
							{prompt.context && (
								<div className="flex flex-col gap-1.5">
									<span className="text-muted-foreground">
										Context
									</span>
									<P className="text-xs">{prompt.context}</P>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>

				<PromptDeleteModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					promptId={prompt.id}
					onDelete={() => onDelete?.(prompt)}
				/>

				<PromptModal
					isOpen={promptModalMode !== null}
					prompt={promptModalMode === "Edit" ? prompt.id : undefined}
					onClose={(reload) => {
						setPromptModalMode(null);
						if (reload) {
							window.location.reload();
						}
					}}
					mode={promptModalMode || "Add"}
					initialData={{
						title:
							promptModalMode === "Add"
								? prompt.title
									? `${prompt.title} (Copy)`
									: ""
								: prompt.title || "",
						context: prompt.context || "",
						intent: prompt.intent || "",
						tags: prompt.tags || [],
						global: prompt.global ?? true,
						...(promptModalMode === "Edit"
							? { version: prompt.version }
							: {}),
					}}
				/>
			</>
		);
	}

	// Catalog variant (grid)
	return (
		<div className="w-full min-w-[200px]">
			<Card
				className="h-full cursor-pointer gap-2 overflow-hidden rounded-xl border bg-card p-0 shadow-sm transition-shadow hover:shadow-md"
				onClick={handleCardClick}
			>
				{/* Header with gradient */}
				<div
					className="relative h-[72px] w-full"
					style={{ background: gradient }}
				>
					<div
						className="flex h-full items-center justify-center font-semibold text-base"
						style={{ color: initialsColor }}
					>
						{initials}
					</div>
					<div className="-translate-y-1/2 absolute top-1/2 right-3 flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									className={headerActionClass}
									onClick={(e) => e.stopPropagation()}
									aria-label="More options"
								>
									<MoreVertical className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleCopyId}>
									Copy Prompt ID
								</DropdownMenuItem>
								{isOwner && (
									<DropdownMenuItem onClick={handleEdit}>
										Edit Prompt
									</DropdownMenuItem>
								)}
								<DropdownMenuItem onClick={handleDuplicate}>
									Duplicate Prompt
								</DropdownMenuItem>
								{isOwner && (
									<DropdownMenuItem onClick={handleDelete}>
										Delete Prompt
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Content */}
				<div
					className="flex flex-1 flex-col"
					style={{
						backgroundColor: "var(--color-background-primary)",
					}}
				>
					<CardContent className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
						<h3 className="line-clamp-2 font-medium text-[13px] leading-snug">
							{prompt.title}
						</h3>
						<div
							className="text-[11px]"
							style={{
								color: "var(--color-text-tertiary)",
							}}
						>
							{updatedLine}
						</div>
						{prompt.intent ? (
							<P className="line-clamp-3 text-muted-foreground text-xs">
								{prompt.intent}
							</P>
						) : null}
						{displayTags.length > 0 ? (
							<div className="mt-auto flex min-w-0 flex-wrap items-center gap-1 overflow-hidden">
								{displayTags.slice(0, 4).map((tag) => (
									<Badge
										key={`${prompt.id}-${tag}`}
										variant="secondary"
										className="text-[10px] uppercase"
									>
										{tag}
									</Badge>
								))}
								{displayTags.length > 4 ? (
									<span className="text-[10px] text-muted-foreground">
										+{displayTags.length - 4}
									</span>
								) : null}
							</div>
						) : null}
					</CardContent>

					{/* Footer */}
					<div className="border-t" />
					<CardFooter className="px-3 pt-0.5 pb-3">
						<div className="flex w-full items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="h-auto w-1/2 px-0 py-1.5 text-xs"
								onClick={handleOpenNewTab}
								title={`Open ${prompt.title || "prompt"} in new tab`}
							>
								Open
								<ExternalLink className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-auto w-1/2 px-0 py-1.5 text-xs"
								aria-label="View prompt info"
								title={`View info for ${prompt.title || "prompt"}`}
								onClick={handleInfoOpen}
							>
								Info
								<Info className="size-4" />
							</Button>
						</div>
					</CardFooter>
				</div>
			</Card>

			{/* Info Modal */}
			<Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
				<DialogContent
					className="sm:max-w-md"
					onClick={(e) => e.stopPropagation()}
				>
					<DialogHeader>
						<DialogTitle>{prompt.title}</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3 text-sm">
						{prompt.created_by && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Created by
								</span>
								<span>{prompt.created_by}</span>
							</div>
						)}
						{prompt.date_created && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Date created
								</span>
								<span>{prompt.date_created}</span>
							</div>
						)}
						{prompt.id && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Prompt ID
								</span>
								<span className="max-w-[200px] truncate font-mono text-xs">
									{prompt.id}
								</span>
							</div>
						)}
						{prompt.tags?.length > 0 && (
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground">
									Tags
								</span>
								<div className="flex flex-wrap gap-1">
									{prompt.tags
										.slice()
										.sort()
										.map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
												className="text-xs uppercase"
											>
												{tag}
											</Badge>
										))}
								</div>
							</div>
						)}
						{prompt.context && (
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground">
									Context
								</span>
								<P className="text-xs">{prompt.context}</P>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<PromptDeleteModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				promptId={prompt.id}
				onDelete={() => onDelete?.(prompt)}
			/>

			<PromptModal
				isOpen={promptModalMode !== null}
				prompt={promptModalMode === "Edit" ? prompt.id : undefined}
				onClose={(reload) => {
					setPromptModalMode(null);
					if (reload) {
						window.location.reload();
					}
				}}
				mode={promptModalMode || "Add"}
				initialData={{
					title:
						promptModalMode === "Add"
							? prompt.title
								? `${prompt.title} (Copy)`
								: ""
							: prompt.title || "",
					context: prompt.context || "",
					intent: prompt.intent || "",
					tags: prompt.tags || [],
					global: prompt.global ?? true,
					...(promptModalMode === "Edit"
						? { version: prompt.version }
						: {}),
				}}
			/>
		</div>
	);
};
