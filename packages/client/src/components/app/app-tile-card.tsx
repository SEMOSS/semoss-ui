import {
	Bookmark,
	BookmarkCheck,
	Copy,
	ExternalLink,
	Info,
	MoreVertical,
	Tag,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
import { AppDeleteModal } from "@/components/app/app-delete-modal";
import { AddAppCloneModal } from "@/components/app/save-app/add-app-clone-modal";
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId, getTagBadgeStyle } from "@/utility";
import type { AppMetadata } from "./app.types";

export type AppTileCardEntityType = "app" | "skill" | "agent";

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
	variant?: "classic" | "catalog" | "row" | "fillerCard";
	onCloneComplete?: (appId?: string) => void;
	cardImgSrc?: string;
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
	return `hsl(${base}, 22%, 72%)`;
};

const generateInitialsColor = (name: string): string => {
	const base = hashString(name) % 360;
	return `hsl(${base}, 28%, 28%)`;
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
		<div
			className={`${cardWidthClass} rounded-lg border bg-card px-4 py-3 shadow-sm`}
		>
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
		onCloneComplete,
		cardImgSrc,
	} = props;

	const navigate = useNavigate();

	const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [loading, setLoading] = useState(isLoading);
	const [showRightTags, setShowRightTags] = useState(true);
	const [rightVisibleTagCount, setRightVisibleTagCount] = useState(0);
	const [bottomVisibleTagCount, setBottomVisibleTagCount] = useState(0);
	const [gridVisibleTagCount, setGridVisibleTagCount] = useState(0);
	const rowRef = useRef<HTMLDivElement>(null);
	const leftContentRef = useRef<HTMLButtonElement>(null);
	const leftTextRef = useRef<HTMLDivElement>(null);
	const rightMetaRef = useRef<HTMLDivElement>(null);
	const rightInfoRef = useRef<HTMLDivElement>(null);
	const tagMeasureRef = useRef<HTMLDivElement>(null);
	const gridTagsRef = useRef<HTMLDivElement>(null);
	const gridTagMeasureRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setLoading(isLoading);
	}, [isLoading]);

	// Memoized values
	const displayName = app.project_display_name || app.project_name;
	const displayId = `id: ${app.project_id}`;
	const tags = useMemo(() => extractTags(app), [app]);
	const descriptionText = (app.description || "").trim();
	const hasDescription = descriptionText.length > 0;
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
		() => generateGradient(displayName || appType || "App"),
		[displayName, appType],
	);
	const initials = useMemo(
		() => buildInitials(displayName || appType || "App"),
		[displayName, appType],
	);
	const initialsColor = useMemo(
		() => generateInitialsColor(displayName || appType || "App"),
		[displayName, appType],
	);
	const displayTags = useMemo(
		() => (systemApp ? ["SYSTEM"] : tags),
		[systemApp, tags],
	);

	const showBookmark = !systemApp && !isDiscoverable;
	const showMenu = app.project_created_by !== "SYSTEM";
	const isCatalog = variant === "catalog";
	const isRow = variant === "row";
	const isFillerCard = variant === "fillerCard";
	const canEdit = app?.user_permission != null && app.user_permission < 2;

	const entityType: AppTileCardEntityType =
		appType === "SKILL"
			? "skill"
			: appType === "WORKSPACE"
				? "agent"
				: "app";

	const showInfo =
		app.project_created_by !== "SYSTEM" && entityType === "app";

	// Style classes
	const cardWidthClass = isRow
		? "w-full"
		: layout === "responsive"
			? "min-w-[200px] w-full"
			: "min-w-[272px] w-[272px]";
	const headerHeightClass = isCatalog ? "h-[72px]" : "h-[77px]";
	const headerActionClass = isCatalog
		? "bg-white/15 text-white hover:bg-white/25"
		: "";

	useEffect(() => {
		if (!isRow) return;
		const rowEl = rowRef.current;
		const leftEl = leftContentRef.current;
		const leftTextEl = leftTextRef.current;
		const rightEl = rightMetaRef.current;
		const rightInfoEl = rightInfoRef.current;
		const measureEl = tagMeasureRef.current;
		if (
			!rowEl ||
			!leftEl ||
			!leftTextEl ||
			!rightEl ||
			!rightInfoEl ||
			!measureEl
		) {
			return;
		}

		const recompute = () => {
			const leftRect = leftEl.getBoundingClientRect();
			const rightRect = rightEl.getBoundingClientRect();
			const isStacked = rightRect.top - leftRect.top > 24;
			const measureNodes = Array.from(
				measureEl.querySelectorAll<HTMLElement>(
					"[data-tag-measure='true']",
				),
			);
			const tagWidths = measureNodes.map((node) =>
				Math.ceil(node.offsetWidth),
			);
			const overflowNode = measureEl.querySelector<HTMLElement>(
				"[data-tag-overflow-measure='true']",
			);
			const nameNode = measureEl.querySelector<HTMLElement>(
				"[data-name-measure='true']",
			);
			const idNode = measureEl.querySelector<HTMLElement>(
				"[data-id-measure='true']",
			);
			const overflowWidth = Math.ceil(overflowNode?.offsetWidth ?? 0);
			const nameWidth = Math.ceil(nameNode?.offsetWidth ?? 0);
			const idWidth = Math.ceil(idNode?.offsetWidth ?? 0);

			const fitCount = (availableWidth: number) => {
				if (availableWidth <= 0 || tagWidths.length === 0) return 0;
				let used = 0;
				let count = 0;
				for (const width of tagWidths) {
					const next = count === 0 ? width : used + 4 + width;
					if (next <= availableWidth) {
						used = next;
						count += 1;
					} else {
						break;
					}
				}
				return count;
			};

			const usedTagWidth = (count: number) => {
				if (count <= 0) return 0;
				return tagWidths
					.slice(0, count)
					.reduce(
						(total, width, index) =>
							total + (index > 0 ? 4 : 0) + width,
						0,
					);
			};

			const fitCountWithOverflow = (availableWidth: number) => {
				if (availableWidth <= 0 || tagWidths.length === 0) return 0;
				let visible = fitCount(availableWidth);
				if (visible >= tagWidths.length) return tagWidths.length;
				while (visible > 0) {
					const hidden = tagWidths.length - visible;
					const overflowNeeded =
						hidden > 0 ? (visible > 0 ? 4 : 0) + overflowWidth : 0;
					if (
						usedTagWidth(visible) + overflowNeeded <=
						availableWidth
					) {
						return visible;
					}
					visible -= 1;
				}
				return 0;
			};

			if (tagWidths.length === 0) {
				setShowRightTags(false);
				setRightVisibleTagCount(0);
				setBottomVisibleTagCount(0);
				return;
			}

			if (isStacked) {
				const bottomCount = fitCountWithOverflow(
					Math.max(0, leftTextEl.clientWidth - 14),
				);
				setShowRightTags(false);
				setRightVisibleTagCount(0);
				setBottomVisibleTagCount(bottomCount);
				return;
			}

			const rightBaseWidth = Math.ceil(rightInfoEl.offsetWidth);
			const rowContentWidth = Math.max(0, rowEl.clientWidth - 32);
			const rightBadgeCount = Math.min(displayTags.length, 2);
			const rightBadgeWidths = tagWidths.slice(0, rightBadgeCount);
			const rightOverflowCount = Math.max(
				0,
				displayTags.length - rightBadgeCount,
			);
			const rightTagsWidth = rightBadgeWidths.reduce(
				(total, width, index) => total + (index > 0 ? 4 : 0) + width,
				0,
			);
			const rightOverflowWidth =
				rightOverflowCount > 0
					? (rightTagsWidth > 0 ? 4 : 0) + overflowWidth
					: 0;
			const requiredRightTagWidth = rightTagsWidth + rightOverflowWidth;
			const textRequired = Math.max(nameWidth, idWidth + 30);
			const requiredLeftWidth = Math.min(
				620,
				40 + 12 + Math.max(160, textRequired) + 8,
			);
			const canFitRight =
				requiredRightTagWidth > 0 &&
				rowContentWidth >=
					requiredLeftWidth +
						rightBaseWidth +
						requiredRightTagWidth +
						12;

			if (canFitRight) {
				setShowRightTags(true);
				setRightVisibleTagCount(rightBadgeCount);
				setBottomVisibleTagCount(0);
				return;
			}

			const bottomCount = fitCountWithOverflow(
				Math.max(0, leftTextEl.clientWidth - 14),
			);
			setShowRightTags(false);
			setRightVisibleTagCount(0);
			setBottomVisibleTagCount(bottomCount);
		};

		const observer = new ResizeObserver(() => {
			recompute();
		});
		observer.observe(rowEl);
		observer.observe(leftEl);
		observer.observe(leftTextEl);
		observer.observe(rightEl);
		observer.observe(measureEl);
		recompute();
		return () => observer.disconnect();
	}, [isRow, displayTags]);

	useEffect(() => {
		if (!isCatalog) return;
		const tagsEl = gridTagsRef.current;
		const measureEl = gridTagMeasureRef.current;
		if (!tagsEl || !measureEl) return;

		const recompute = () => {
			const tagNodes = Array.from(
				measureEl.querySelectorAll<HTMLElement>(
					"[data-grid-tag-measure='true']",
				),
			);
			const tagWidths = tagNodes.map((node) =>
				Math.ceil(node.offsetWidth),
			);
			const overflowNode = measureEl.querySelector<HTMLElement>(
				"[data-grid-tag-overflow-measure='true']",
			);
			const overflowWidth = Math.ceil(overflowNode?.offsetWidth ?? 0);
			const availableWidth = Math.max(0, tagsEl.clientWidth);

			if (tagWidths.length === 0 || availableWidth <= 0) {
				setGridVisibleTagCount(0);
				return;
			}

			const usedTagWidth = (count: number) => {
				if (count <= 0) return 0;
				return tagWidths
					.slice(0, count)
					.reduce(
						(total, width, index) =>
							total + (index > 0 ? 4 : 0) + width,
						0,
					);
			};

			let visible = 0;
			for (let i = 0; i < tagWidths.length; i++) {
				const nextWidth =
					(i === 0 ? 0 : usedTagWidth(i)) +
					(i > 0 ? 4 : 0) +
					tagWidths[i];
				if (nextWidth <= availableWidth) {
					visible = i + 1;
				} else {
					break;
				}
			}

			if (visible >= tagWidths.length) {
				setGridVisibleTagCount(tagWidths.length);
				return;
			}

			while (visible > 0) {
				const hiddenCount = tagWidths.length - visible;
				const overflowNeeded =
					hiddenCount > 0 ? (visible > 0 ? 4 : 0) + overflowWidth : 0;
				if (usedTagWidth(visible) + overflowNeeded <= availableWidth) {
					break;
				}
				visible -= 1;
			}

			setGridVisibleTagCount(Math.max(0, visible));
		};

		const observer = new ResizeObserver(() => {
			recompute();
		});
		observer.observe(tagsEl);
		observer.observe(measureEl);
		recompute();
		return () => observer.disconnect();
	}, [isCatalog]);

	// Handlers
	const openHrefInNewTab = useCallback((): boolean => {
		if (!href) {
			return false;
		}

		window.open(href, "_blank", "noopener,noreferrer");
		return true;
	}, [href]);

	const handleCardClick = useCallback(
		(e?: React.MouseEvent) => {
			if (e && href && (e.ctrlKey || e.metaKey || e.button === 1)) {
				e.preventDefault();
				e.stopPropagation();
				openHrefInNewTab();
				return;
			}

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
		},
		[href, navigate, onAction, openHrefInNewTab],
	);

	const handleCardAuxClick = useCallback(
		(e: React.MouseEvent) => {
			if (!href || e.button !== 1) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();
			openHrefInNewTab();
		},
		[href, openHrefInNewTab],
	);

	const handleOpenApp = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!openHrefInNewTab()) {
				onAction?.();
			}
		},
		[onAction, openHrefInNewTab],
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

	const handleCloneModalClose = useCallback(
		(clonedAppId?: string) => {
			setIsCloneModalOpen(false);
			if (clonedAppId) {
				onCloneComplete?.(clonedAppId);
			}
		},
		[onCloneComplete],
	);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDeleteModalOpen(true);
	}, []);

	const infoHref = `/app/${app.project_id}`;

	const dropdownMenuContent = (
		<DropdownMenuContent align="end">
			<DropdownMenuItem onClick={handleViewDashboard}>
				View Dashboard
			</DropdownMenuItem>
			{canEdit && (
				<>
					{entityType !== "agent" && (
						<DropdownMenuItem onClick={handleClone}>
							Clone {entityType === "skill" ? "Skill" : "App"}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={handleDelete}>
						Delete{" "}
						{entityType === "skill"
							? "Skill"
							: entityType === "agent"
								? "Agent"
								: "App"}
					</DropdownMenuItem>
				</>
			)}
		</DropdownMenuContent>
	);

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
		const tagsToShowRight =
			showRightTags && rightVisibleTagCount > 0
				? displayTags.slice(0, rightVisibleTagCount)
				: [];
		const rightOverflowCount = showRightTags
			? Math.max(0, displayTags.length - rightVisibleTagCount)
			: 0;
		const tagsToShowBottom =
			!showRightTags && displayTags.length > 0
				? displayTags.slice(
						0,
						Math.max(
							0,
							Math.min(bottomVisibleTagCount, displayTags.length),
						),
					)
				: [];
		const bottomOverflowCount = !showRightTags
			? Math.max(0, displayTags.length - tagsToShowBottom.length)
			: 0;

		return (
			<div
				ref={rowRef}
				className={`${cardWidthClass} relative rounded-lg border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md`}
				data-testid={formatToDataTestId(
					`appTileCard-${displayName}-row`,
				)}
			>
				<div
					ref={tagMeasureRef}
					aria-hidden
					className="-left-[9999px] pointer-events-none invisible absolute top-0"
				>
					<div className="flex items-center gap-1">
						{displayTags.map((tag) => (
							<Badge
								key={`${app.project_id}-measure-${tag}`}
								data-tag-measure="true"
								variant="secondary"
								style={getTagBadgeStyle(tag)}
							>
								{tag}
							</Badge>
						))}
						<Badge
							data-tag-overflow-measure="true"
							variant="outline"
							className="flex items-center gap-1"
						>
							<Tag className="size-3" />
							{Math.max(0, displayTags.length - 2)}
						</Badge>
					</div>
					<span
						data-name-measure="true"
						className="whitespace-nowrap font-medium text-[15px] leading-tight"
					>
						{displayName}
					</span>
					<span
						data-id-measure="true"
						className="whitespace-nowrap text-muted-foreground text-xs"
					>
						{displayId}
					</span>
				</div>

				<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					{/* biome-ignore lint/a11y/useSemanticElements: cannot use <button> here — contains an interactive <Button> child, nested buttons are invalid HTML */}
					<div
						ref={leftContentRef}
						role="button"
						tabIndex={0}
						className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
						onClick={handleCardClick}
						onAuxClick={handleCardAuxClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ")
								handleCardClick();
						}}
					>
						<div
							className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
							style={{ background: background || gradient }}
						>
							<div
								className="font-semibold text-xs"
								style={{ color: initialsColor }}
							>
								{initials}
							</div>
						</div>

						<div ref={leftTextRef} className="min-w-0 flex-1">
							<h3 className="truncate font-medium text-[15px] leading-tight">
								{displayName}
							</h3>
							<div className="mt-1 flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
								<span className="truncate">{displayId}</span>
								<Button
									variant="ghost"
									size="icon-sm"
									className="h-6 w-6"
									onClick={handleCopyId}
									aria-label="Copy app ID"
									title="Copy app ID"
								>
									<Copy className="size-3.5" />
								</Button>
							</div>

							{tagsToShowBottom.length > 0 ||
							bottomOverflowCount > 0 ? (
								<div className="mt-2 flex min-w-0 items-center gap-1 overflow-hidden">
									{tagsToShowBottom.map((tag) => (
										<Badge
											key={`${app.project_id}-left-${tag}`}
											variant="secondary"
											style={getTagBadgeStyle(tag)}
										>
											{tag}
										</Badge>
									))}
									{bottomOverflowCount > 0 ? (
										<Badge
											variant="outline"
											className="flex items-center gap-1"
										>
											<Tag className="size-3" />
											{bottomOverflowCount}
										</Badge>
									) : null}
								</div>
							) : null}

							{hasDescription ? (
								<P className="mt-2 line-clamp-3 text-muted-foreground text-sm">
									{descriptionText}
								</P>
							) : null}
						</div>
					</div>

					<div
						ref={rightMetaRef}
						className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center md:gap-3"
					>
						{tagsToShowRight.length > 0 ? (
							<div className="flex flex-wrap items-center gap-1">
								{tagsToShowRight.map((tag) => (
									<Badge
										key={`${app.project_id}-right-${tag}`}
										variant="secondary"
										style={getTagBadgeStyle(tag)}
									>
										{tag}
									</Badge>
								))}
							</div>
						) : null}
						{rightOverflowCount > 0 ? (
							<Badge
								variant="outline"
								className="flex items-center gap-1"
							>
								<Tag className="size-3" />
								{rightOverflowCount}
							</Badge>
						) : null}
						<div
							ref={rightInfoRef}
							className="flex flex-col gap-2 md:items-end"
						>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								{updatedLine}
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={handleOpenApp}
									aria-label="Open app in new tab"
									title={`Open ${displayName || "app"} in new tab`}
								>
									<ExternalLink className="size-4" />
								</Button>
								{showInfo && (
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="View app info"
										title={`View info for ${displayName || "app"}`}
										asChild
									>
										<Link
											to={infoHref}
											onClick={(event) =>
												event.stopPropagation()
											}
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
												? `Unbookmark ${displayName}`
												: `Bookmark ${displayName}`
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
												onClick={(e) =>
													e.stopPropagation()
												}
												aria-label="More options"
											>
												<MoreVertical className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										{dropdownMenuContent}
									</DropdownMenu>
								)}
							</div>
						</div>
					</div>
				</div>

				<AppDeleteModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					appId={app.project_id}
					appName={displayName}
					onDelete={onDelete}
					entityType={entityType}
				/>
				{isCloneModalOpen && (
					<AddAppCloneModal
						open={isCloneModalOpen}
						appId={app.project_id}
						handleClose={handleCloneModalClose}
						entityType={entityType}
					/>
				)}
			</div>
		);
	}

	// Render catalog variant
	if (isCatalog) {
		const safeGridVisibleCount = Math.min(
			Math.max(0, gridVisibleTagCount),
			displayTags.length,
		);
		const gridVisibleTags = displayTags.slice(0, safeGridVisibleCount);
		const gridHiddenTagCount = Math.max(
			0,
			displayTags.length - safeGridVisibleCount,
		);

		return (
			<div className={cardWidthClass}>
				<Card
					className="h-full cursor-pointer gap-2 overflow-hidden rounded-xl border bg-card p-0 shadow-sm transition-shadow hover:shadow-md"
					onClick={handleCardClick}
					onAuxClick={handleCardAuxClick}
					data-testid={formatToDataTestId(
						`appTileCard-${displayName}-tile`,
					)}
				>
					{/* Header with gradient */}
					<div
						className={`relative w-full ${headerHeightClass}`}
						style={{ background: background || gradient }}
					>
						<div
							className="flex h-full items-center justify-center font-semibold text-base"
							style={{ color: initialsColor }}
						>
							{initials}
						</div>
						<div className="-translate-y-1/2 absolute top-1/2 right-3 flex items-center gap-2">
							{showBookmark && (
								<Button
									variant="ghost"
									size="icon-sm"
									className={headerActionClass}
									title={
										isFavorite
											? `Unbookmark ${displayName}`
											: `Bookmark ${displayName}`
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
									{dropdownMenuContent}
								</DropdownMenu>
							)}
						</div>
					</div>

					{/* Content */}
					<div
						className="flex flex-1 flex-col"
						style={{
							backgroundColor: "var(--color-background-primary)",
						}}
					>
						<div
							ref={gridTagMeasureRef}
							aria-hidden
							className="-left-[9999px] pointer-events-none invisible absolute top-0"
						>
							<div className="flex items-center gap-1">
								{displayTags.map((tag) => (
									<Badge
										key={`${app.project_id}-grid-measure-${tag}`}
										data-grid-tag-measure="true"
										variant="secondary"
										style={getTagBadgeStyle(tag)}
									>
										{tag}
									</Badge>
								))}
								<Badge
									data-grid-tag-overflow-measure="true"
									variant="outline"
									className="flex shrink-0 items-center gap-1"
								>
									<Tag className="size-3" />
									{displayTags.length}
								</Badge>
							</div>
						</div>
						<CardContent className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
							<h3 className="line-clamp-2 font-medium text-[13px] leading-snug">
								{displayName}
							</h3>
							<div
								className="text-[11px]"
								style={{
									color: "var(--color-text-tertiary)",
								}}
							>
								{updatedLine}
							</div>
							{hasDescription ? (
								<P className="line-clamp-3 text-muted-foreground text-xs">
									{descriptionText}
								</P>
							) : null}
							{displayTags.length > 0 ? (
								<div
									ref={gridTagsRef}
									className="mt-1 flex min-h-[16px] min-w-0 items-center gap-1 overflow-hidden"
								>
									{gridVisibleTags.map((tag) => (
										<Badge
											key={`${app.project_id}-${tag}`}
											variant="secondary"
											style={getTagBadgeStyle(tag)}
										>
											{tag}
										</Badge>
									))}
									{gridHiddenTagCount > 0 ? (
										<Badge
											variant="outline"
											className="flex shrink-0 items-center gap-1"
										>
											<Tag className="size-3" />
											{gridHiddenTagCount}
										</Badge>
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
									className={
										showInfo
											? "h-auto w-1/2 px-0 py-1.5 text-xs"
											: "h-auto w-full px-0 py-1.5 text-xs"
									}
									onClick={handleOpenApp}
									title={`Open ${displayName || "app"} in new tab`}
								>
									Open
									<ExternalLink className="size-4" />
								</Button>
								{showInfo && (
									<Button
										variant="outline"
										size="sm"
										className="h-auto w-1/2 px-0 py-1.5 text-xs"
										aria-label="View app info"
										title={`View info for ${displayName || "app"}`}
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
					</div>
				</Card>

				{/* Modals */}
				<AppDeleteModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					appId={app.project_id}
					appName={displayName}
					onDelete={onDelete}
					entityType={entityType}
				/>
				{isCloneModalOpen && (
					<AddAppCloneModal
						open={isCloneModalOpen}
						appId={app.project_id}
						handleClose={handleCloneModalClose}
						entityType={entityType}
					/>
				)}
			</div>
		);
	}

	if (isFillerCard) {
		return (
			<div className="w-full">
				<Card
					className="relative h-full min-h-[184px] cursor-pointer overflow-hidden rounded-xl border bg-card p-0 shadow-sm"
					onClick={handleCardClick}
					onAuxClick={handleCardAuxClick}
					data-testid={formatToDataTestId(
						`appTileCard-${displayName}-filler`,
					)}
				>
					<div className="flex h-full flex-row">
						{/* Left content */}
						<div className="flex w-1/2 flex-col p-4">
							<div className="flex items-start justify-between">
								<h3 className="font-semibold text-lg">
									{displayName}
								</h3>
								{displayTags.length > 0 && (
									<Badge
										variant="secondary"
										className="background-color-[var(--muted-foreground)] text-[12px]"
										style={getTagBadgeStyle(displayTags[0])}
									>
										{displayTags[0]}
									</Badge>
								)}
							</div>

							{hasDescription ? (
								<P className="my-2 line-clamp-3 text-muted-foreground text-sm">
									{descriptionText}
								</P>
							) : (
								<P className="mt-2 text-muted-foreground text-sm">
									No description available
								</P>
							)}

							<div className="mt-auto flex items-center gap-3">
								<Button
									variant="default"
									size="sm"
									className="flex items-center gap-2"
									onClick={(e) => {
										e.stopPropagation();
										handleOpenApp(e);
									}}
								>
									Open
									<ExternalLink className="size-4" />
								</Button>
							</div>
						</div>

						{/* Right illustration - fills right half on md+ and sits below on small */}
						<div className="relative w-1/2">
							<div className="absolute inset-0 h-full w-full overflow-hidden">
								<img
									src={cardImgSrc}
									alt={`${displayName} illustration`}
									className={`absolute inset-0 h-full w-full transform object-cover object-right`}
								/>
							</div>
						</div>
					</div>
				</Card>
			</div>
		);
	}

	// Render classic variant
	return (
		<div className={cardWidthClass}>
			<Card
				className="h-full cursor-pointer gap-3 overflow-hidden p-0"
				onClick={handleCardClick}
				onAuxClick={handleCardAuxClick}
				data-testid={formatToDataTestId(
					`appTileCard-${displayName}-tile`,
				)}
			>
				{/* Header */}
				<div
					className="relative h-[77px] w-full"
					style={{ background: background || gradient }}
				>
					<div
						className="flex h-full items-center justify-center font-semibold text-2xl"
						style={{ color: initialsColor }}
					>
						{initials}
					</div>
					<div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-2">
						{showBookmark && (
							<Button
								variant="ghost"
								size="icon-sm"
								title={
									isFavorite
										? `Unbookmark ${displayName}`
										: `Bookmark ${displayName}`
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
								{dropdownMenuContent}
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Content */}
				<CardContent className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-0">
					<h3 className="line-clamp-2 min-h-[46px] font-semibold text-lg leading-snug">
						{displayName}
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
										style={getTagBadgeStyle(tag)}
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
				appName={displayName}
				onDelete={onDelete}
			/>
			{isCloneModalOpen && (
				<AddAppCloneModal
					open={isCloneModalOpen}
					appId={app.project_id}
					handleClose={handleCloneModalClose}
				/>
			)}
		</div>
	);
});

AppTileCard.displayName = "AppTileCard";
