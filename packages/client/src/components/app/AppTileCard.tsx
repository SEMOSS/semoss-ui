import dayjs from "dayjs";
import {
	Bookmark,
	BookmarkCheck,
	ExternalLink,
	MoreVertical,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
	Small,
	toast,
} from "@semoss/ui/next";
import { AppDeleteModal } from "@/components/app";
import { AddAppCloneModal } from "@/components/app/save-app/AddAppCloneModal";
import { formatToDataTestId, removeUnderscores } from "@/utility";
import type { AppMetadata } from "./app.types";

interface AppTileCardProps {
	/**
	 * App
	 */
	app: AppMetadata;

	/**
	 * Background
	 */
	background?: string;

	/**
	 * Action that is triggered when clicked
	 * aop - current selected app
	 */
	onAction?: () => void;

	/**
	 * Link to navigate to
	 */
	href?: string;

	/**
	 * is app favorited
	 */
	isFavorite?: boolean;

	/**
	 * toggle favorite bookmark
	 */
	favorite?: (value: boolean) => void;

	/**
	 * type of app to match image
	 */
	appType?: string;

	/**
	 * is the app a default system app
	 */
	systemApp?: boolean;

	/**
	 * Show bookmark
	 */
	isDiscoverable?: boolean;

	/**
	 * Action triggered when deleted
	 */
	onDelete?: () => void;

	/**
	 * Whether the card is loading (shows skeleton)
	 */
	isLoading?: boolean;
	/**
	 * Whether to show the skeleton loader
	 */
	showSkeleton?: boolean;

	/**
	 * Layout sizing for the card container
	 */
	layout?: "fixed" | "responsive";
}

export const AppTileCard = (props: AppTileCardProps) => {
	const {
		app,
		onAction = () => null,
		href = null,
		isFavorite,
		favorite,
		appType,
		systemApp,
		isDiscoverable = false,
		onDelete,
		isLoading,
		showSkeleton,
		layout = "fixed",
	} = props;

	const navigate = useNavigate();

	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isAppDeleteModalOpen, setIsAppDeleteModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(Boolean(isLoading));
	}, [isLoading]);

	const tags = app.tag
		? (Array.isArray(app.tag) ? app.tag : [app.tag]).filter(Boolean)
		: [];
	const showBookmark = !systemApp && !isDiscoverable;
	const showMenu = app.project_created_by !== "SYSTEM";
	const showInfo = app.project_created_by !== "SYSTEM";

	const navigateApp = (appId: string) => {
		if (!appId) {
			return;
		}
		navigate(`/app/${appId}`);
	};

	const copyProjectId = (projectId: string) => {
		try {
			navigator.clipboard.writeText(projectId);
			toast.success("Successfully copied to clipboard");
		} catch {
			toast.error("Unable to copy to clipboard");
		}
	};

	// --- Gradient avatar logic (from ModelTileCard) ---
	function hashString(str: string): number {
		let h = 0;
		for (let i = 0; i < str.length; i++) {
			h = (h << 5) - h + str.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}

	function pickGradient(name: string): string {
		const base = hashString(name) % 360;
		const hue2 = (base + 35) % 360;
		const hue3 = (base + 70) % 360;
		return `linear-gradient(135deg, hsl(${base} 45% 88%), hsl(${hue2} 40% 84%), hsl(${hue3} 35% 80%))`;
	}

	function buildInitials(label: string): string {
		const tokens = label.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
		const chars = tokens.map((t) => t[0]);
		return chars.slice(0, 3).join("");
	}

	const createdDate = useMemo(() => {
		const d = dayjs(app.project_date_created);
		if (!d.isValid()) {
			return null;
		}

		return d.format("MMM D, YYYY");
	}, [app.project_date_created]);

	const lastEditedDate = useMemo(() => {
		const d = dayjs(app.project_date_last_edited);
		if (!d.isValid()) {
			return null;
		}

		return d.format("MMM D, YYYY");
	}, [app.project_date_last_edited]);

	const cardWidthClass =
		layout === "responsive"
			? "min-w-[240px] w-full"
			: "min-w-[322px] w-[322px]";

	if ((loading && isLoading) || showSkeleton) {
		return (
			<div className={cardWidthClass}>
				<Card className="h-full overflow-hidden p-0">
					<div className="relative h-[77px] w-full">
						<Skeleton className="h-full w-full" />
						<Skeleton className="-translate-y-1/2 absolute top-1/2 right-2 size-8" />
					</div>
					<CardContent className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-0">
						<Skeleton className="h-6 w-2/3" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<div className="grid grid-cols-2 gap-3">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
						</div>
						<Skeleton className="h-6 w-full" />
						<div className="flex-1" />
					</CardContent>
					<div className="border-t" />
					<CardFooter className="px-4 py-2">
						<div className="grid w-full grid-cols-2 gap-2">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className={cardWidthClass}>
			<Card
				className="h-full cursor-pointer gap-3 overflow-hidden p-0"
				onClick={() => {
					if (href) {
						navigate(href.replace(/^#/, ""));
					}
				}}
				data-testid={formatToDataTestId(
					`appTileCard-${app.project_name}-tile`,
				)}
			>
				<div
					className="relative h-[77px] w-full"
					style={{
						background:
							props.background ||
							pickGradient(app.project_name || appType || "App"),
					}}
				>
					<div className="flex h-full items-center justify-center font-semibold text-2xl text-white">
						{buildInitials(app.project_name || appType || "App")}
					</div>
					<div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-2">
						{showBookmark ? (
							<Button
								variant="ghost"
								size="icon-sm"
								title={
									isFavorite
										? `Unbookmark ${app.project_name ?? ""}`
										: `Bookmark ${app.project_name ?? ""}`
								}
								onClick={(e) => {
									e.stopPropagation();
									favorite?.(!isFavorite);
								}}
							>
								{isFavorite ? (
									<BookmarkCheck className="size-4" />
								) : (
									<Bookmark className="size-4" />
								)}
							</Button>
						) : null}
						{showMenu ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={(event) => {
											event.stopPropagation();
											navigate(
												`/app/${app.project_id}/dashboard`,
											);
										}}
									>
										View Dashboard
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(event) => {
											event.stopPropagation();
											copyProjectId(app.project_id);
										}}
									>
										Copy App ID
									</DropdownMenuItem>
									{app?.user_permission &&
										app.user_permission < 2 && (
											<DropdownMenuItem
												onClick={(event) => {
													event.stopPropagation();
													setIsUploadOpen(true);
												}}
											>
												Clone This App
											</DropdownMenuItem>
										)}
									{app?.user_permission &&
										app.user_permission < 2 && (
											<DropdownMenuItem
												onClick={(event) => {
													event.stopPropagation();
													setIsAppDeleteModalOpen(
														true,
													);
												}}
											>
												Delete App
											</DropdownMenuItem>
										)}
								</DropdownMenuContent>
							</DropdownMenu>
						) : null}
					</div>
				</div>
				<CardContent className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-0">
					<div className="line-clamp-2 min-h-[46px] font-semibold text-lg leading-snug">
						{removeUnderscores(app.project_name)}
					</div>
					<P className="line-clamp-2 min-h-[40px] text-muted-foreground text-sm">
						{app.description
							? app.description
							: "No description available"}
					</P>
					{(createdDate || lastEditedDate) && (
						<div className="grid min-h-[44px] grid-cols-2 gap-3">
							{createdDate && (
								<div className="flex flex-col gap-1">
									<Small className="text-muted-foreground uppercase">
										Published
									</Small>
									<div className="font-medium text-sm">
										{createdDate}
									</div>
								</div>
							)}
							{lastEditedDate && (
								<div className="flex flex-col gap-1">
									<Small className="text-muted-foreground uppercase">
										Last Edited
									</Small>
									<div className="font-medium text-sm">
										{lastEditedDate}
									</div>
								</div>
							)}
						</div>
					)}
					{tags.length > 0 ? (
						<div className="group flex h-6 w-full items-center">
							<div className="flex w-full items-center gap-2 overflow-x-hidden whitespace-nowrap group-hover:overflow-x-auto">
								{tags.map((tag) => (
									<Badge
										key={`${app.project_id}-${tag}`}
										variant="secondary"
										className="text-[11px] uppercase"
									>
										{String(tag)}
									</Badge>
								))}
							</div>
						</div>
					) : null}
					<div className="flex-1" />
				</CardContent>
				<div className="border-t" />
				<CardFooter className="px-4 py-2">
					<div className="grid w-full grid-cols-2 gap-2">
						<Button
							variant="outline"
							size="sm"
							className={showInfo ? "" : "col-span-2"}
							onClick={(e) => {
								e.stopPropagation();
								if (!href) {
									onAction();
									return;
								}
								window.open(
									href,
									"_blank",
									"noopener,noreferrer",
								);
							}}
						>
							Open
							<ExternalLink className="size-4" />
						</Button>
						{showInfo ? (
							<Button
								variant="outline"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									navigateApp(app.project_id);
								}}
							>
								Info
							</Button>
						) : null}
					</div>
				</CardFooter>
			</Card>
			<AppDeleteModal
				isOpen={isAppDeleteModalOpen}
				onClose={() => {
					setIsAppDeleteModalOpen(false);
				}}
				appId={app.project_id}
				onDelete={() => {
					onDelete?.();
				}}
			/>
			{isUploadOpen ? (
				<AddAppCloneModal
					open={isUploadOpen}
					appId={app.project_id}
					handleClose={() => {
						setIsUploadOpen(false);
					}}
				/>
			) : null}
		</div>
	);
};
