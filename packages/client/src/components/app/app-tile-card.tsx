import {
	Bookmark,
	BookmarkCheck,
	ExternalLink,
	Info,
	MoreVertical,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	P,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { AppDeleteModal } from "@/components/app";
import { AddAppCloneModal } from "@/components/app/save-app/AddAppCloneModal";
import { formatToDataTestId } from "@/utility";
import type { AppMetadata } from "./app.types";

interface AppTileCardProps {
	app: AppMetadata;
	background?: string;
	onAction?: () => void;
	href?: string;
	isFavorite?: boolean;
	favorite?: (value: boolean) => void;
	appType?: string;
	systemApp?: boolean;
	isDiscoverable?: boolean;
	onDelete?: () => void;
	isLoading?: boolean;
	showSkeleton?: boolean;
	layout?: "fixed" | "responsive";
	variant?: "classic" | "catalog" | "row";
}

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
 * Generate gradient based on app name
 */
const generateGradient = (name: string): string => {
	const base = hashString(name) % 360;
	const hue2 = (base + 35) % 360;
	const hue3 = (base + 70) % 360;
	return `linear-gradient(135deg, hsl(${base} 45% 88%), hsl(${hue2} 40% 84%), hsl(${hue3} 35% 80%))`;
};

/**
 * Build initials from app name
 */
const buildInitials = (label: string): string => {
	const tokens = label.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
	const chars = tokens.map((t) => t[0].toUpperCase());
	return chars.slice(0, 3).join("");
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
 * Extract and normalize tags
 */
const extractTags = (app: AppMetadata): string[] => {
	if (!app.tag) return [];
	return (Array.isArray(app.tag) ? app.tag : [app.tag])
		.filter(Boolean)
		.map((tag) => String(tag));
};

/**
 * Skeleton Card Component
 */
const SkeletonCard = memo(
	({
		cardWidthClass,
		headerHeightClass,
		isCatalog,
	}: {
		cardWidthClass: string;
		headerHeightClass: string;
		isCatalog: boolean;
	}) => (
		<div className={cardWidthClass}>
			<Card className="h-full overflow-hidden p-0">
				<div className={`relative w-full ${headerHeightClass}`}>
					<Skeleton className="h-full w-full" />
					<Skeleton className="-translate-y-1/2 absolute top-1/2 right-2 size-8" />
				</div>
				<CardContent className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-0">
					<Skeleton className="h-6 w-2/3" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					{isCatalog && (
						<>
							<div className="border-t" />
							<Skeleton className="h-4 w-24" />
						</>
					)}
					{!isCatalog && (
						<div className="grid grid-cols-2 gap-3">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
						</div>
					)}
					<div className="flex-1" />
				</CardContent>
				<div className="border-t" />
				<CardFooter className="px-4 py-2">
					<div
						className={`grid w-full gap-2 ${isCatalog ? "grid-cols-2" : "grid-cols-2"}`}
					>
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				</CardFooter>
			</Card>
		</div>
	),
);

SkeletonCard.displayName = "SkeletonCard";

const RowSkeletonCard = memo(
	({ cardWidthClass }: { cardWidthClass: string }) => (
		<div className={`${cardWidthClass} px-4 py-2`}>
			<div className="flex items-center gap-4">
				<div className="h-10 w-10">
					<Skeleton className="h-full w-full rounded-lg" />
				</div>
				<div className="flex flex-1 flex-col gap-2">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-3 w-3/4" />
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-7 w-7" />
							<Skeleton className="h-7 w-7" />
							<Skeleton className="h-7 w-7" />
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
			</div>
		</div>
	),
);

RowSkeletonCard.displayName = "RowSkeletonCard";

/**
 * App Tile Card Component
 */
export const AppTileCard = memo((props: AppTileCardProps) => {
	const {
		app,
		background,
		onAction,
		href = null,
		isFavorite = false,
		favorite,
		appType,
		systemApp = false,
		isDiscoverable = false,
		onDelete,
		isLoading = false,
		showSkeleton = false,
		layout = "fixed",
		variant = "classic",
	} = props;

	const navigate = useNavigate();

	const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [loading, setLoading] = useState(isLoading);

	useEffect(() => {
		setLoading(isLoading);
	}, [isLoading]);

	// Memoized values
	const tags = useMemo(() => extractTags(app), [app]);
	const updatedAgo = useMemo(
		() =>
			formatUpdatedAgo(
				app.project_date_last_edited || app.project_date_created,
			),
		[app.project_date_last_edited, app.project_date_created],
	);
	const updatedLine = systemApp
		? "Updated with platform"
		: updatedAgo || "Updated date unavailable";
	const gradient = useMemo(
		() => generateGradient(app.project_name || appType || "App"),
		[app.project_name, appType],
	);
	const initials = useMemo(
		() => buildInitials(app.project_name || appType || "App"),
		[app.project_name, appType],
	);
	const displayTags = systemApp ? ["SYSTEM"] : tags;

	const showBookmark = !systemApp && !isDiscoverable;
	const showMenu = app.project_created_by !== "SYSTEM";
	const showInfo = app.project_created_by !== "SYSTEM";
	const isCatalog = variant === "catalog";
	const isRow = variant === "row";
	const canEdit = app?.user_permission != null && app.user_permission < 2;

	// Style classes
	const cardWidthClass = isRow
		? "w-full"
		: layout === "responsive"
			? "min-w-[200px] w-full"
			: "min-w-[272px] w-[272px]";
	const headerHeightClass = isCatalog ? "h-[60px]" : "h-[77px]";
	const initialsClass = isCatalog ? "text-3xl" : "text-2xl";
	const headerActionClass = isCatalog
		? "bg-white/15 text-white hover:bg-white/25"
		: "";

	// Handlers
	const handleCardClick = useCallback(() => {
		if (onAction) {
			onAction();
			return;
		}

		if (href) {
			if (!href.startsWith("#")) {
				window.location.assign(href);
				return;
			}
			navigate(href.replace(/^#/, ""));
		}
	}, [href, navigate, onAction]);

	const handleOpenApp = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!href) {
				onAction?.();
				return;
			}
			window.open(href, "_blank", "noopener,noreferrer");
		},
		[href, onAction],
	);

	const handleFavoriteToggle = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			favorite?.(!isFavorite);
		},
		[favorite, isFavorite],
	);

	const handleViewDashboard = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			navigate(`/app/${app.project_id}/dashboard`);
		},
		[navigate, app.project_id],
	);

	const handleCopyId = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				navigator.clipboard.writeText(app.project_id);
				toast.success("App ID copied to clipboard");
			} catch {
				toast.error("Failed to copy App ID");
			}
		},
		[app.project_id],
	);

	const handleClone = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsCloneModalOpen(true);
	}, []);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDeleteModalOpen(true);
	}, []);

	const infoHref = `/app/${app.project_id}`;

	// Show skeleton
	if (loading || showSkeleton) {
		if (isRow) {
			return <RowSkeletonCard cardWidthClass={cardWidthClass} />;
		}
		return (
			<SkeletonCard
				cardWidthClass={cardWidthClass}
				headerHeightClass={headerHeightClass}
				isCatalog={isCatalog}
			/>
		);
	}

	if (isRow) {
		return (
			<div
				className={`${cardWidthClass} flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/40`}
				data-testid={formatToDataTestId(
					`appTileCard-${app.project_name}-row`,
				)}
			>
				<button
					type="button"
					className="flex min-w-0 flex-1 items-center gap-3 text-left"
					onClick={handleCardClick}
				>
					<div
						className="flex h-10 w-10 items-center justify-center rounded-lg"
						style={{ background: background || gradient }}
					>
						<div className="font-semibold text-[11px] text-white">
							{initials}
						</div>
					</div>

					<div className="min-w-0 flex-1">
						<h3 className="truncate font-semibold text-sm">
							{app.project_name}
						</h3>
						<div className="mt-1 text-[11px] text-muted-foreground">
							{updatedLine}
						</div>
						<P className="line-clamp-3 text-muted-foreground text-xs">
							{app.description || "No description available"}
						</P>
						<div className="mt-1 min-h-[16px]">
							{displayTags.length > 0 ? (
								<div className="flex flex-wrap items-center gap-1">
									{displayTags.slice(0, 4).map((tag) => (
										<Badge
											key={`${app.project_id}-${tag}`}
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
						</div>
					</div>
				</button>

				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleOpenApp}
						aria-label="Open app in new tab"
						title={`Open ${app.project_name || "app"} in new tab`}
					>
						<ExternalLink className="size-4" />
					</Button>
					{showInfo && (
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="View app info"
							title={`View info for ${app.project_name || "app"}`}
							asChild
						>
							<Link
								to={infoHref}
								onClick={(event) => event.stopPropagation()}
							>
								<Info className="size-4" />
							</Link>
						</Button>
					)}
					{showBookmark && (
						<Button
							variant="ghost"
							size="icon-sm"
							title={
								isFavorite
									? `Unbookmark ${app.project_name}`
									: `Bookmark ${app.project_name}`
							}
							onClick={handleFavoriteToggle}
							aria-label={
								isFavorite ? "Remove bookmark" : "Add bookmark"
							}
						>
							{isFavorite ? (
								<BookmarkCheck className="size-4" />
							) : (
								<Bookmark className="size-4" />
							)}
						</Button>
					)}
					{showMenu && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={(e) => e.stopPropagation()}
									aria-label="More options"
								>
									<MoreVertical className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleViewDashboard}>
									View Dashboard
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleCopyId}>
									Copy App ID
								</DropdownMenuItem>
								{canEdit && (
									<>
										<DropdownMenuItem onClick={handleClone}>
											Clone This App
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleDelete}
										>
											Delete App
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				<AppDeleteModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					appId={app.project_id}
					onDelete={onDelete}
				/>
				{isCloneModalOpen && (
					<AddAppCloneModal
						open={isCloneModalOpen}
						appId={app.project_id}
						handleClose={() => setIsCloneModalOpen(false)}
					/>
				)}
			</div>
		);
	}

	// Render catalog variant
	if (isCatalog) {
		return (
			<div className={cardWidthClass}>
				<Card
					className="h-full cursor-pointer gap-2 overflow-hidden rounded-xl border bg-card p-0 shadow-sm transition-shadow hover:shadow-md"
					onClick={handleCardClick}
					data-testid={formatToDataTestId(
						`appTileCard-${app.project_name}-tile`,
					)}
				>
					{/* Header with gradient */}
					<div
						className={`relative w-full ${headerHeightClass}`}
						style={{ background: background || gradient }}
					>
						<div
							className={`flex h-full items-center justify-center font-semibold text-white ${initialsClass}`}
						>
							{initials}
						</div>
						<div className="absolute top-3 right-3 flex items-center gap-2">
							{showBookmark && (
								<Button
									variant="ghost"
									size="icon-sm"
									className={headerActionClass}
									title={
										isFavorite
											? `Unbookmark ${app.project_name}`
											: `Bookmark ${app.project_name}`
									}
									onClick={handleFavoriteToggle}
									aria-label={
										isFavorite
											? "Remove bookmark"
											: "Add bookmark"
									}
								>
									{isFavorite ? (
										<BookmarkCheck className="size-4" />
									) : (
										<Bookmark className="size-4" />
									)}
								</Button>
							)}
							{showMenu && (
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
										<DropdownMenuItem
											onClick={handleViewDashboard}
										>
											View Dashboard
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleCopyId}
										>
											Copy App ID
										</DropdownMenuItem>
										{canEdit && (
											<>
												<DropdownMenuItem
													onClick={handleClone}
												>
													Clone This App
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={handleDelete}
												>
													Delete App
												</DropdownMenuItem>
											</>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					</div>

					{/* Content */}
					<CardContent className="flex flex-1 flex-col gap-1.5 px-3 pt-1 pb-0.5">
						<h3 className="mt-1 line-clamp-2 font-semibold text-sm leading-snug">
							{app.project_name}
						</h3>
						<div className="text-[11px] text-muted-foreground">
							{updatedLine}
						</div>
						<P className="line-clamp-3 text-[11px] text-muted-foreground">
							{app.description || "No description available"}
						</P>
						<div className="mt-1 min-h-[16px]">
							{displayTags.length > 0 ? (
								<div className="flex flex-wrap items-center gap-1">
									{displayTags.slice(0, 4).map((tag) => (
										<Badge
											key={`${app.project_id}-${tag}`}
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
						</div>
					</CardContent>

					{/* Footer */}
					<div className="border-t" />
					<CardFooter className="px-3 pt-0.5 pb-3">
						<div className="flex w-full items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className={
									showInfo ? "w-1/2 px-6" : "w-full px-6"
								}
								onClick={handleOpenApp}
								title={`Open ${app.project_name || "app"} in new tab`}
							>
								Open
								<ExternalLink className="size-4" />
							</Button>
							{showInfo && (
								<Button
									variant="outline"
									size="sm"
									className="w-1/2"
									aria-label="View app info"
									title={`View info for ${app.project_name || "app"}`}
									asChild
								>
									<Link
										to={infoHref}
										onClick={(event) =>
											event.stopPropagation()
										}
									>
										Info
										<Info className="size-4" />
									</Link>
								</Button>
							)}
						</div>
					</CardFooter>
				</Card>

				{/* Modals */}
				<AppDeleteModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					appId={app.project_id}
					onDelete={onDelete}
				/>
				{isCloneModalOpen && (
					<AddAppCloneModal
						open={isCloneModalOpen}
						appId={app.project_id}
						handleClose={() => setIsCloneModalOpen(false)}
					/>
				)}
			</div>
		);
	}

	// Render classic variant
	return (
		<div className={cardWidthClass}>
			<Card
				className="h-full cursor-pointer gap-3 overflow-hidden p-0"
				onClick={handleCardClick}
				data-testid={formatToDataTestId(
					`appTileCard-${app.project_name}-tile`,
				)}
			>
				{/* Header */}
				<div
					className="relative h-[77px] w-full"
					style={{ background: background || gradient }}
				>
					<div className="flex h-full items-center justify-center font-semibold text-2xl text-white">
						{initials}
					</div>
					<div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-2">
						{showBookmark && (
							<Button
								variant="ghost"
								size="icon-sm"
								title={
									isFavorite
										? `Unbookmark ${app.project_name}`
										: `Bookmark ${app.project_name}`
								}
								onClick={handleFavoriteToggle}
								aria-label={
									isFavorite
										? "Remove bookmark"
										: "Add bookmark"
								}
							>
								{isFavorite ? (
									<BookmarkCheck className="size-4" />
								) : (
									<Bookmark className="size-4" />
								)}
							</Button>
						)}
						{showMenu && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={(e) => e.stopPropagation()}
										aria-label="More options"
									>
										<MoreVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={handleViewDashboard}
									>
										View Dashboard
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleCopyId}>
										Copy App ID
									</DropdownMenuItem>
									{canEdit && (
										<>
											<DropdownMenuItem
												onClick={handleClone}
											>
												Clone This App
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={handleDelete}
											>
												Delete App
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Content */}
				<CardContent className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-0">
					<h3 className="line-clamp-2 min-h-[46px] font-semibold text-lg leading-snug">
						{app.project_name}
					</h3>
					<P className="line-clamp-2 min-h-[40px] text-muted-foreground text-sm">
						{app.description || "No description available"}
					</P>
					{tags.length > 0 && (
						<div className="group flex h-6 w-full items-center">
							<div className="flex w-full items-center gap-2 overflow-x-hidden whitespace-nowrap group-hover:overflow-x-auto">
								{tags.map((tag) => (
									<Badge
										key={`${app.project_id}-${tag}`}
										variant="secondary"
										className="text-[11px] uppercase"
									>
										{tag}
									</Badge>
								))}
							</div>
						</div>
					)}
					<div className="flex-1" />
				</CardContent>

				{/* Footer */}
				<div className="border-t" />
				<CardFooter className="px-4 py-2">
					<div className="grid w-full grid-cols-2 gap-2">
						<Button
							variant="outline"
							size="sm"
							className={showInfo ? "" : "col-span-2"}
							onClick={handleOpenApp}
						>
							Open
							<ExternalLink className="size-4" />
						</Button>
						{showInfo && (
							<Button variant="outline" size="sm" asChild>
								<Link
									to={infoHref}
									onClick={(event) => event.stopPropagation()}
								>
									Info
								</Link>
							</Button>
						)}
					</div>
				</CardFooter>
			</Card>

			{/* Modals */}
			<AppDeleteModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				appId={app.project_id}
				onDelete={onDelete}
			/>
			{isCloneModalOpen && (
				<AddAppCloneModal
					open={isCloneModalOpen}
					appId={app.project_id}
					handleClose={() => setIsCloneModalOpen(false)}
				/>
			)}
		</div>
	);
});

AppTileCard.displayName = "AppTileCard";
