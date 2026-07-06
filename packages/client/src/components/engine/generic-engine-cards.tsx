import {
	Bookmark,
	BookmarkCheck,
	ChevronDown,
	ChevronUp,
	Copy,
	LockKeyhole,
	LockKeyholeOpen,
	Star,
	Tag,
	Trash2,
	User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Env } from "@semoss/sdk/react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	ButtonGroup,
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import GOOGLE from "@/assets/img/GOOGLE.svg";
import { formatToDataTestId, getTagBadgeStyle } from "@/utility";

const parseUtcDate = (rawDate?: string) => {
	if (!rawDate) {
		return null;
	}

	const trimmedDate = rawDate.trim();
	if (!trimmedDate) {
		return null;
	}

	const normalizedDate = trimmedDate.includes("T")
		? trimmedDate
		: trimmedDate.replace(" ", "T");
	const utcDate = normalizedDate.endsWith("Z")
		? normalizedDate
		: `${normalizedDate}Z`;

	const parsedDate = new Date(utcDate);
	if (Number.isNaN(parsedDate.getTime())) {
		return null;
	}

	return parsedDate;
};

const isProjectType = (engineType?: string) => {
	const normalizedType = (engineType || "").trim().toUpperCase();
	return normalizedType === "PROJECT" || normalizedType === "APP";
};

interface DatabaseCardProps {
	/** Name of the Database */
	name: string;

	/** ID of Database */
	id: string;

	/** Owner of the Database */
	owner: string;

	/** Description of the Database */
	description: string;

	/** Tag of the Database */
	tag?: string[] | string;

	/** Database type */
	type?: string;

	/** Subtype for Icon */
	sub_type?: string;

	/** Optional custom leading icon content */
	customIcon?: ReactNode;

	/** Desktop layout for settings pages: metadata/actions inline on the right */
	desktopInlineMeta?: boolean;

	/** Whether or not the database is viewable by everyone */
	isGlobal?: boolean;

	isFavorite?: boolean;

	hideFavorite?: boolean;

	isDiscoverable?: boolean;

	enableGlobalAction?: boolean;

	isUpvoted?: boolean;

	votes?: string;

	views?: string;

	trending?: string;

	date?: string;

	onClick?: (value: string) => void;
	href?: string;

	onDelete?: () => void;

	favorite?: (value: boolean) => void;

	upvote?: (value: boolean) => void;

	global?: (value?: boolean) => void;
}

export const EngineLandscapeCard = (props: DatabaseCardProps) => {
	const {
		name,
		id,
		tag,
		isFavorite,
		hideFavorite = false,
		isDiscoverable = false,
		enableGlobalAction = false,
		isGlobal,
		type,
		sub_type,
		customIcon,
		desktopInlineMeta = false,
		date,
		onClick,
		href,
		onDelete,
		favorite,
		global,
	} = props;

	/** Whether the row is wide enough to show full tag badges */
	const [showFullTags, setShowFullTags] = useState(true);
	const [rowWidth, setRowWidth] = useState(0);
	const rowRef = useRef<HTMLDivElement>(null);

	const parsedDate = parseUtcDate(date);
	const formattedDate = parsedDate
		? parsedDate
				.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
					timeZone: "UTC",
				})
				.replace(",", "")
		: "N/A";

	// Observe the row width and collapse tags when there isn't enough space
	useEffect(() => {
		const el = rowRef.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => {
			setRowWidth(entry.contentRect.width);
			setShowFullTags(entry.contentRect.width >= 480);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const copyId = (id: string) => {
		try {
			navigator.clipboard.writeText(id);
			toast.success("Successfully copied to clipboard");
		} catch (e: unknown) {
			const message =
				e instanceof Error ? e.message : "Failed to copy ID";
			toast.error(message);
		}
	};

	const tagArray: string[] =
		tag === undefined
			? []
			: Array.isArray(tag)
				? tag.filter(Boolean)
				: tag !== ""
					? [tag]
					: [];
	const hasTags = tagArray.length > 0;
	const hasDate = Boolean(parsedDate);
	const displayId = `id: ${id}`;
	const openHrefInNewTab = () => {
		if (!href) {
			return false;
		}

		window.open(href, "_blank", "noopener,noreferrer");
		return true;
	};

	const handleCardClick = (event: React.MouseEvent) => {
		if (href && (event.ctrlKey || event.metaKey || event.button === 1)) {
			event.preventDefault();
			event.stopPropagation();
			openHrefInNewTab();
			return;
		}

		onClick?.(id);
	};

	const handleCardAuxClick = (event: React.MouseEvent) => {
		if (!href || event.button !== 1) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		openHrefInNewTab();
	};

	const renderTags = (compact = false) => {
		if (!hasTags) {
			return null;
		}

		const compactVisibleCount =
			rowWidth >= 430 ? 2 : rowWidth >= 360 ? 1 : 0;

		if (showFullTags || tagArray.length <= 1) {
			return (
				<div className="flex min-w-0 flex-wrap items-center gap-1.5">
					{tagArray.slice(0, 3).map((t) => (
						<Badge
							key={t}
							variant="outline"
							title={t}
							className={compact ? "h-6" : undefined}
							style={getTagBadgeStyle(t)}
						>
							<span
								className={
									compact
										? "max-w-[18ch] truncate px-1.5 font-semibold text-[11px]"
										: "max-w-[18ch] truncate px-2 font-semibold text-xs"
								}
							>
								{t}
							</span>
						</Badge>
					))}
					{tagArray.length > 3 && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									variant="outline"
									className="flex cursor-pointer items-center gap-1"
								>
									<Tag className="size-3" />
									{tagArray.length - 3}
								</Badge>
							</TooltipTrigger>
							<TooltipContent>
								<span className="max-w-[300px]">
									{tagArray.slice(3).join(", ")}
								</span>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			);
		}

		if (compactVisibleCount > 0) {
			const visibleTags = tagArray.slice(0, compactVisibleCount);
			const hiddenTags = tagArray.slice(compactVisibleCount);

			return (
				<div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
					{visibleTags.map((t) => (
						<Badge
							key={t}
							variant="outline"
							title={t}
							className={compact ? "h-6" : undefined}
							style={getTagBadgeStyle(t)}
						>
							<span
								className={
									compact
										? "max-w-[16ch] truncate px-1.5 font-semibold text-[11px]"
										: "max-w-[16ch] truncate px-2 font-semibold text-xs"
								}
							>
								{t}
							</span>
						</Badge>
					))}
					{hiddenTags.length > 0 ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									variant="outline"
									className="flex cursor-pointer items-center gap-1"
									onClick={(e) => e.stopPropagation()}
								>
									<Tag className="size-3" />
									{hiddenTags.length}
								</Badge>
							</TooltipTrigger>
							<TooltipContent>
								<span className="max-w-[300px]">
									{hiddenTags.join(", ")}
								</span>
							</TooltipContent>
						</Tooltip>
					) : null}
				</div>
			);
		}

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						variant="outline"
						className="flex cursor-pointer items-center gap-1"
						onClick={(e) => e.stopPropagation()}
					>
						<Tag className="size-3" />
						{tagArray.length}
					</Badge>
				</TooltipTrigger>
				<TooltipContent>
					<span className="max-w-[300px]">{tagArray.join(", ")}</span>
				</TooltipContent>
			</Tooltip>
		);
	};

	const renderActions = () => {
		return (
			<div className="flex flex-shrink-0 flex-nowrap items-center gap-1">
				{typeof isGlobal === "boolean" && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								title={
									isGlobal
										? "Global engine"
										: "Private engine"
								}
								onClick={(e) => {
									e.stopPropagation();
									if (enableGlobalAction) {
										global?.(!isGlobal);
									}
								}}
							>
								{isGlobal ? (
									<LockKeyholeOpen className="size-4 text-muted-foreground" />
								) : (
									<LockKeyhole className="size-4 text-muted-foreground" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{isGlobal ? "Global" : "Private"}
						</TooltipContent>
					</Tooltip>
				)}
				{!isDiscoverable && !hideFavorite && (
					<Button
						variant="ghost"
						size="icon-sm"
						title={
							isFavorite
								? `Unbookmark ${name ? name : id}`
								: `Bookmark ${name ? name : id}`
						}
						onClick={(e) => {
							e.stopPropagation();
							favorite?.(isFavorite);
						}}
					>
						{isFavorite ? (
							<BookmarkCheck className="size-4 text-primary" />
						) : (
							<Bookmark className="size-4" />
						)}
					</Button>
				)}
				{onDelete && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								title={
									isProjectType(type)
										? "Delete App"
										: "Delete Engine"
								}
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
							>
								<Trash2 className="size-4 text-destructive" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{isProjectType(type) ? "Delete" : "Delete Engine"}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		);
	};

	return (
		<Card
			onClick={handleCardClick}
			onAuxClick={handleCardAuxClick}
			data-semoss-nav-click={onClick ? "true" : undefined}
			data-testid={formatToDataTestId(
				`genericEngineCards-${type}-${name}`,
			)}
			className="flex h-auto w-full max-w-full flex-col items-start justify-center gap-1.5 overflow-hidden rounded-lg border bg-card p-3 shadow-md hover:cursor-pointer sm:p-3.5"
		>
			<div ref={rowRef} className="flex w-full min-w-0 flex-col gap-1.5">
				<div
					className={`flex w-full min-w-0 items-start gap-2.5 ${
						desktopInlineMeta
							? "sm:items-center"
							: "md:items-center"
					}`}
				>
					<div className="flex min-w-0 flex-1 items-start gap-2.5">
						{/* Engine icon — always visible */}
						<div className="flex size-10 flex-shrink-0 items-center justify-center overflow-hidden bg-transparent p-1">
							{customIcon ? (
								<div className="flex h-full w-full items-center justify-center">
									{customIcon}
								</div>
							) : isProjectType(type) ? (
								<AppCatalogAvatar
									name={name || id}
									className="size-full rounded text-xs"
								/>
							) : (
								<EngineSubtypeIcon
									engineType={type}
									engineSubtype={sub_type}
									alt={name}
									className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
								/>
							)}
						</div>

						{/* Name + ID — takes all available space and truncates */}
						<div className="flex min-w-0 flex-1 flex-col gap-0.5">
							<div className="flex min-w-0 flex-row items-center gap-2">
								<P
									className="truncate font-medium"
									title={name}
								>
									{name}
								</P>
							</div>
							<div className="flex min-w-0 items-center gap-1">
								<P
									className="truncate font-mono text-muted-foreground text-xs"
									title={displayId}
								>
									{displayId}
								</P>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											className="h-5 w-5"
											title="Copy ID"
											onClick={(e) => {
												e.stopPropagation();
												copyId(id);
											}}
										>
											<Copy className="size-3.5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Copy ID</TooltipContent>
								</Tooltip>
							</div>
							{desktopInlineMeta && hasTags && (
								<div className="hidden min-w-0 flex-wrap items-center gap-1 pt-0.5 sm:flex lg:hidden">
									{renderTags(true)}
								</div>
							)}
						</div>
					</div>

					{desktopInlineMeta && (
						<div className="hidden flex-shrink-0 flex-col items-end gap-0.5 sm:flex lg:hidden">
							<span className="whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
								{hasDate ? formattedDate : "N/A"}
							</span>
							{renderActions()}
						</div>
					)}

					{desktopInlineMeta && (
						<div className="hidden flex-shrink-0 items-center gap-3 lg:flex 2xl:hidden">
							<div className="flex items-center justify-center">
								{renderTags(true)}
							</div>
							<div className="flex flex-shrink-0 flex-col items-end gap-0.5">
								<span className="whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
									{hasDate ? formattedDate : "N/A"}
								</span>
								{renderActions()}
							</div>
						</div>
					)}

					{desktopInlineMeta && (
						<div className="hidden flex-shrink-0 items-center gap-3 2xl:flex">
							{renderTags()}
							<span className="whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
								{hasDate ? formattedDate : "N/A"}
							</span>
							{renderActions()}
						</div>
					)}
				</div>

				{hasTags && (
					<div
						className={`flex w-full min-w-0 flex-wrap items-center gap-1.5 pl-[50px] ${
							desktopInlineMeta ? "sm:hidden" : ""
						}`}
					>
						{renderTags()}
					</div>
				)}

				<div
					className={`flex w-full min-w-0 items-center justify-between gap-2 border-border border-t pt-1.5 pl-[50px] ${
						desktopInlineMeta ? "sm:hidden" : ""
					}`}
				>
					<span className="truncate whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
						{hasDate ? formattedDate : "N/A"}
					</span>
					{renderActions()}
				</div>
			</div>
		</Card>
	);
};

export const EngineTileCard = (props: DatabaseCardProps) => {
	const {
		name,
		id,
		description,
		tag,
		isGlobal,
		isFavorite,
		hideFavorite = false,
		sub_type,
		isUpvoted,
		owner = "N/A",
		votes = "0",
		onClick,
		href,
		favorite,
		upvote,
		global,
	} = props;

	const openHrefInNewTab = () => {
		if (!href) {
			return false;
		}

		window.open(href, "_blank", "noopener,noreferrer");
		return true;
	};

	const handleCardClick = (event: React.MouseEvent) => {
		if (href && (event.ctrlKey || event.metaKey || event.button === 1)) {
			event.preventDefault();
			event.stopPropagation();
			openHrefInNewTab();
			return;
		}

		onClick?.(id);
	};

	const handleCardAuxClick = (event: React.MouseEvent) => {
		if (!href || event.button !== 1) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		openHrefInNewTab();
	};

	return (
		<Card
			onClick={handleCardClick}
			onAuxClick={handleCardAuxClick}
			data-semoss-nav-click={onClick ? "true" : undefined}
			className="h-full cursor-pointer p-0"
		>
			<img
				src={`${Env.MODULE}/api/e-${id}/image/download`}
				alt={name || id}
				className="h-[134px] w-full object-cover"
			/>
			<CardHeader>
				<CardTitle>
					<div className="flex flex-row items-center gap-2">
						<P className="font-medium">{name || id}</P>
						{sub_type === "VERTEX" && (
							<img
								src={GOOGLE}
								alt="Google"
								className="size-5 shrink-0 object-cover"
							/>
						)}
					</div>
				</CardTitle>
				<div className="flex items-center justify-center gap-1 self-stretch">
					<Avatar className="size-5">
						<AvatarFallback className="bg-muted">
							<User className="size-3" />
						</AvatarFallback>
					</Avatar>
					<span className="flex flex-1 flex-col justify-center text-muted-foreground text-xs">
						Published by: {owner}
					</span>
				</div>
				{!hideFavorite && (
					<CardAction>
						<Button
							variant="ghost"
							size="icon-sm"
							title={
								isFavorite
									? `Unbookmark ${name ? name : id}`
									: `Bookmark ${name ? name : id}`
							}
							onClick={(e) => {
								e.stopPropagation();
								favorite(isFavorite);
							}}
							aria-label={
								isFavorite
									? `Unfavorite ${name ? name : id}`
									: `Favorite ${name ? name : id}`
							}
						>
							{isFavorite ? (
								<Star className="size-4 fill-primary text-primary" />
							) : (
								<Star className="size-4" />
							)}
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent>
				<P className="line-clamp-3 min-h-[60px] max-w-[350px] whitespace-pre-wrap text-sm">
					{description ? description : "No description available"}
				</P>
				<div className="flex min-w-0 max-w-[260px] flex-shrink-0 items-center gap-1.5 overflow-hidden">
					{tag !== undefined &&
						(Array.isArray(tag) ? (
							<>
								{tag.slice(0, 2).map((t, _i) => (
									<Badge
										key={`${id}`}
										variant="secondary"
										style={getTagBadgeStyle(t)}
									>
										{t}
									</Badge>
								))}
								{tag.length > 2 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Badge
												variant="outline"
												className="flex cursor-pointer items-center gap-1"
											>
												<Tag className="size-3" />
												{tag.length - 2}
											</Badge>
										</TooltipTrigger>
										<TooltipContent>
											<span className="max-w-[300px]">
												{tag.slice(2).join(", ")}
											</span>
										</TooltipContent>
									</Tooltip>
								)}
							</>
						) : tag !== "" ? (
							<Badge
								variant="secondary"
								style={getTagBadgeStyle(tag)}
							>
								{tag}
							</Badge>
						) : null)}
				</div>
			</CardContent>
			<CardFooter className="justify-between">
				<ButtonGroup>
					<Button
						variant="outline"
						size="sm"
						className="border-border text-muted-foreground hover:bg-background"
						title={
							isUpvoted
								? `Downvote ${name ? name : id}`
								: `Upvote ${name ? name : id}`
						}
						onClick={(e) => {
							e.stopPropagation();
							upvote(isUpvoted);
						}}
						aria-label={
							isUpvoted
								? `Downvote ${name ? name : id}`
								: `Upvote ${name ? name : id}`
						}
					>
						{isUpvoted ? (
							<ChevronDown className="size-4" />
						) : (
							<ChevronUp className="size-4" />
						)}
					</Button>
					<div className="flex items-center border border-border border-l-0 bg-background px-3 text-muted-foreground text-sm hover:bg-background">
						{votes}
					</div>
				</ButtonGroup>
				<Button
					variant="ghost"
					size="icon-sm"
					title={
						isGlobal
							? `Make ${name ? name : id} private`
							: `Make ${name ? name : id} public`
					}
					disabled={!global}
					onClick={(e) => {
						e.stopPropagation();
						global(isGlobal);
					}}
					aria-label={
						isGlobal
							? `Make ${name ? name : id} private`
							: `Make ${name ? name : id} public`
					}
				>
					{isGlobal ? (
						<LockKeyholeOpen className="size-4" />
					) : (
						<LockKeyhole className="size-4" />
					)}
				</Button>
			</CardFooter>
		</Card>
	);
};

export interface PlainEngineCardProps {
	/** Name of the Database */
	name: string;

	onClick: () => void;
}

export const PlainEngineCard = (props) => {
	const { id, name, onClick } = props;
	return (
		<Card onClick={onClick} className="h-full cursor-pointer p-0">
			<img
				src={`${Env.MODULE}/api/e-${id}/image/download`}
				alt={name || id}
				className="h-[134px] w-full object-cover"
			/>
			<CardContent className="mt-2 px-4">
				<P className="font-medium">{name ? name : id}</P>
			</CardContent>
		</Card>
	);
};
