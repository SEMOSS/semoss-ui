import {
	Bookmark,
	BookmarkCheck,
	ChevronDown,
	ChevronUp,
	LockKeyhole,
	LockKeyholeOpen,
	MoreVertical,
	Star,
	User,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
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
	const obj = ENGINE_IMAGES[appType]?.find((ele) => ele.name === appSubType);

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
	const [openTags, setOpenTags] = useState(false);
	const formattedDate = new Date(date)
		.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
		.replace(",", "");

	const navigate = useNavigate();

	const copyId = (id: string) => {
		try {
			navigator.clipboard.writeText(id);
			toast.success("Successfully copied to clipboard");
		} catch (e) {
			toast.error(e.message);
		}
	};
	return (
		<Card
			onClick={() => onClick(id)}
			data-testId={formatToDataTestId(
				`genericEngineCards-${type}-${name}`,
			)}
			className="flex h-[80px] flex-col items-start justify-center gap-4 rounded-lg border bg-card p-4 shadow-md hover:cursor-pointer"
		>
			<div className="flex h-8 items-center gap-2.5 self-stretch">
				<div className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-card">
					<img
						src={findDBImage(type, sub_type)}
						alt={name}
						className="size-full object-cover"
					/>
				</div>
				<div className="flex flex-1 flex-row items-center justify-between gap-1.5">
					<div className="flex flex-col justify-center">
						<div className="flex flex-row items-center gap-2">
							<P
								className="max-w-[240px] truncate font-medium"
								title={name}
							>
								{name}
							</P>

							{sub_type === "EMBEDDED" && (
								<img
									src={GOOGLE}
									alt="Google"
									className="size-5 shrink-0 object-cover"
								/>
							)}
						</div>
					</div>
					<div className="flex min-w-0 max-w-[260px] flex-shrink-0 items-center gap-1.5 overflow-hidden">
						{Array.isArray(tag) &&
							tag.slice(0, 2).map((t, i) => (
								<Badge
									key={`${id}`}
									variant="outline"
									title={t}
								>
									<span className="max-w-[20ch] truncate px-2 font-semibold text-xs">
										{t}
									</span>
								</Badge>
							))}

						{Array.isArray(tag) && tag.length > 2 && (
							<Popover open={openTags} onOpenChange={setOpenTags}>
								<PopoverTrigger asChild>
									<ul
										className="cursor-pointer whitespace-nowrap text-muted-foreground text-xs"
										onMouseEnter={() => setOpenTags(true)}
										onMouseLeave={() => setOpenTags(false)}
									>
										+{tag.length - 2}
									</ul>
								</PopoverTrigger>

								<PopoverContent
									className="flex max-w-[220px] flex-wrap gap-1"
									onMouseEnter={() => setOpenTags(true)}
									onMouseLeave={() => setOpenTags(false)}
								>
									{tag.slice(2).map((t, i) => (
										<Badge
											key={`${id}`}
											variant="outline"
											className="max-w-[120px] shrink truncate"
										>
											{t}
										</Badge>
									))}
								</PopoverContent>
							</Popover>
						)}
					</div>
				</div>
				<div className="flex flex-1 items-center justify-end gap-2">
					<span className="text-foreground text-sm">
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
					{Array.isArray(tag) &&
						tag.slice(0, 2).map((t, i) => (
							<Badge key={`${id}`} variant="secondary">
								{t}
							</Badge>
						))}

					{Array.isArray(tag) && tag.length > 2 && (
						<Popover>
							<PopoverTrigger asChild>
								<span className="cursor-pointer whitespace-nowrap text-muted-foreground text-xs">
									+{tag.length - 2}
								</span>
							</PopoverTrigger>

							<PopoverContent className="flex max-w-[220px] flex-wrap gap-1">
								{tag.slice(2).map((t, i) => (
									<Badge
										key={`${id}`}
										variant="outline"
										className="max-w-[120px] shrink truncate"
									>
										{t}
									</Badge>
								))}
							</PopoverContent>
						</Popover>
					)}
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
