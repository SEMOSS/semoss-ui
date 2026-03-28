import {
	Bookmark,
	BookmarkCheck,
	ChevronDown,
	ChevronUp,
	LockKeyhole,
	LockKeyholeOpen,
	MoreVertical,
	Star,
	Tag,
	User,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import BRAIN from "@/assets/img/BRAIN.png";
import GOOGLE from "@/assets/img/google.png";
import { ENGINE_IMAGES } from "@/pages/import";
import { formatToDataTestId } from "@/utility";

/**
 * @name findDBImage
 * @params appType & appSubType
 * @returns image link for associated engine
 */
const findDBImage = (appType: string, appSubType: string) => {
	const normalizeEngineKey = (value?: string) =>
		(value || "")
			.trim()
			.replace(/[^A-Za-z0-9]+/g, "_")
			.toUpperCase();
	const typeKey = normalizeEngineKey(appType);
	const subtypeKey = normalizeEngineKey(appSubType);
	const images = ENGINE_IMAGES[typeKey] || [];
	const obj = images.find((ele) => {
		return normalizeEngineKey(ele.name) === subtypeKey;
	});

	if (!obj) {
		return BRAIN;
	}

	return obj.icon;
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

	/** Whether or not the database is viewable by everyone */
	isGlobal?: boolean;

	isFavorite?: boolean;

	isDiscoverable?: boolean;

	isUpvoted?: boolean;

	votes?: string;

	views?: string;

	trending?: string;

	date?: string;

	onClick?: (value: string) => void;

	favorite?: (value: boolean) => void;

	upvote?: (value: boolean) => void;

	global?: (value) => void;
}

export const EngineLandscapeCard = (props: DatabaseCardProps) => {
	const {
		name,
		id,
		tag,
		isFavorite,
		isDiscoverable = false,
		type,
		sub_type,
		date,
		onClick,
		favorite,
	} = props;

	/** Menu toggle state */
	const [open, setOpen] = useState(false);
	/** Whether the row is wide enough to show full tag badges */
	const [showFullTags, setShowFullTags] = useState(true);
	const rowRef = useRef<HTMLDivElement>(null);

	const formattedDate = new Date(date)
		.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
		.replace(",", "");

	const navigate = useNavigate();

	// Observe the row width and collapse tags when there isn't enough space
	useEffect(() => {
		const el = rowRef.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => {
			setShowFullTags(entry.contentRect.width >= 480);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const copyId = (id: string) => {
		try {
			navigator.clipboard.writeText(id);
			toast.success("Successfully copied to clipboard");
		} catch (e) {
			toast.error(e.message);
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

	return (
		<Card
			onClick={() => onClick(id)}
			data-testId={formatToDataTestId(
				`genericEngineCards-${type}-${name}`,
			)}
			className="flex h-auto min-h-[80px] flex-col items-start justify-center gap-4 overflow-hidden rounded-lg border bg-card p-4 shadow-md hover:cursor-pointer"
		>
			<div ref={rowRef} className="flex w-full items-center gap-2.5">
				{/* Engine icon — always visible */}
				<div className="flex size-10 flex-shrink-0 items-center justify-center overflow-hidden bg-muted/30 p-1">
					<img
						src={findDBImage(type, sub_type)}
						alt={name}
						className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
					/>
				</div>

				{/* Name — takes all available space and truncates */}
				<div className="flex min-w-0 flex-1 flex-row items-center gap-2">
					<P className="truncate font-medium" title={name}>
						{name}
					</P>
					{sub_type === "EMBEDDED" && (
						<img
							src={GOOGLE}
							alt="Google"
							className="size-5 flex-shrink-0 object-cover"
						/>
					)}
				</div>

				{/* Tags: full badges when wide, compact count badge when narrow */}
				{tagArray.length > 0 &&
					(showFullTags ? (
						<div className="flex flex-shrink-0 items-center gap-1.5">
							{tagArray.slice(0, 2).map((t) => (
								<Badge key={t} variant="outline" title={t}>
									<span className="max-w-[20ch] truncate px-2 font-semibold text-xs">
										{t}
									</span>
								</Badge>
							))}
							{tagArray.length > 2 && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="cursor-pointer whitespace-nowrap text-muted-foreground text-xs">
											+{tagArray.length - 2}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<span className="max-w-[300px]">
											{tagArray.slice(2).join(", ")}
										</span>
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					) : (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									variant="outline"
									className="flex flex-shrink-0 cursor-pointer items-center gap-1"
									onClick={(e) => e.stopPropagation()}
								>
									<Tag className="size-3" />
									{tagArray.length}
								</Badge>
							</TooltipTrigger>
							<TooltipContent>
								<span className="max-w-[300px]">
									{tagArray.join(", ")}
								</span>
							</TooltipContent>
						</Tooltip>
					))}

				{/* Date + actions — always visible, never pushed out */}
				<div className="flex flex-shrink-0 items-center gap-2">
					<span className="hidden text-foreground text-sm sm:inline">
						{formattedDate}
					</span>
					<div className="flex flex-row items-center gap-1">
						{!isDiscoverable && (
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
							>
								{isFavorite ? (
									<BookmarkCheck className="size-4 text-primary" />
								) : (
									<Bookmark className="size-4" />
								)}
							</Button>
						)}
						<DropdownMenu open={open} onOpenChange={setOpen}>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={(e) => {
										e.stopPropagation();
									}}
								>
									<MoreVertical className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={(event: React.MouseEvent) => {
										copyId(id);
										setOpen(false);
										event.stopPropagation();
									}}
								>
									Copy ID
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={(event: React.MouseEvent) => {
										navigate(`${id}/dashboard`);
										setOpen(false);
										event.stopPropagation();
									}}
								>
									View Dashboard
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
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
		sub_type,
		isUpvoted,
		owner = "N/A",
		votes = "0",
		onClick,
		favorite,
		upvote,
		global,
	} = props;

	return (
		<Card onClick={() => onClick(id)} className="h-full cursor-pointer p-0">
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
									<Badge key={`${id}`} variant="secondary">
										{t}
									</Badge>
								))}
								{tag.length > 2 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="cursor-pointer whitespace-nowrap text-muted-foreground text-xs">
												+{tag.length - 2}
											</span>
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
							<Badge variant="secondary">{tag}</Badge>
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
