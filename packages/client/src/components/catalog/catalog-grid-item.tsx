import { Calendar, Clock, Copy, MoreVertical, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { formatToDataTestId, getTagBadgeStyle } from "@/utility";
import { formatDateToLocal, formatDateToRelative } from "@/utility/date";

export interface CatalogGridItemProps
	extends React.ComponentProps<typeof Card> {
	/** Display style - list row or grid card */
	variant: "LIST" | "CARD";
	/** Variant specific options */
	options?: {
		LIST?: Record<string, unknown>;
		CARD?: {
			background?: string;
		};
	};
	/** Path to go to */
	path: string;
	/** Display name */
	name: string;
	/** Associated description */
	description: string;
	/** Unique identifier */
	id: string;
	/** Custom icon to display in header */
	icon: ReactNode;
	/** Tags for the item */
	tags: string[];
	/** Date created (UTC timestamp) */
	dateCreated: string;
	/** Date last edited (UTC timestamp) */
	dateLastEdited: string;
	/** Custom actions to render in card action area */
	actions: ReactNode;
	/** Dropdown menu items - if empty, dropdown is hidden */
	menuItems: {
		icon: React.ReactNode;
		label: string;
		onClick: () => void;
		className?: string;
	}[];
}

const copyToClipboard = (text: string) => {
	try {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	} catch {
		toast.error("Failed to copy");
	}
};

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
	return `hsl(${base}, 22%, 72%)`;
};

export const CatalogGridItem = ({
	variant,
	options,
	path,
	name,
	description,
	id,
	icon,
	tags,
	dateCreated,
	dateLastEdited,
	actions,
	menuItems = [],
	className,
	...cardProps
}: CatalogGridItemProps) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const relativeDate = formatDateToRelative(dateLastEdited || dateCreated);

	const cardBackground = options?.CARD?.background;

	const gradient = useMemo(() => generateGradient(name || "Item"), [name]);
	const cardClassName = `${className ?? ""}`.trim();

	if (variant === "LIST") {
		const formattedDateCreated = formatDateToLocal(dateCreated);
		const formattedDateLastEdited = formatDateToLocal(dateLastEdited);
		const showHoverCard = Boolean(
			description || formattedDateCreated || formattedDateLastEdited,
		);

		return (
			<HoverCard openDelay={300}>
				<HoverCardTrigger asChild>
					<Link
						to={path}
						className="group block w-full outline-none"
						data-testid={formatToDataTestId(
							`catalogGridItem-${id}`,
						)}
					>
						<Card
							{...cardProps}
							className={`flex h-auto w-full max-w-full cursor-pointer flex-col items-start justify-center gap-1.5 overflow-hidden rounded-lg p-3.5 hover:shadow-md group-focus:ring group-focus:ring-ring/50 group-focus:ring-inset ${cardClassName}`.trim()}
						>
							<div className="flex w-full min-w-0 items-center gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center overflow-hidden bg-transparent p-1">
									{icon}
								</div>

								<div className="flex min-w-0 flex-1 flex-col gap-0.5">
									<P
										className="truncate font-medium"
										title={name}
									>
										{name}
									</P>
									<div className="flex min-w-0 items-center gap-1">
										<div className="flex items-center gap-1 truncate text-muted-foreground text-xs">
											<span>ID:</span>
											<span className="truncate">
												{id}
											</span>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon-sm"
														className="h-5 w-5"
														onClick={(event) => {
															event.preventDefault();
															event.stopPropagation();
															copyToClipboard(id);
														}}
													>
														<Copy className="size-3.5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Copy ID
												</TooltipContent>
											</Tooltip>
										</div>
									</div>
								</div>

								{tags && tags.length > 0 && (
									<div className="flex shrink-0 flex-wrap items-center gap-1.5">
										{tags.slice(0, 3).map((tag) => (
											<Badge
												key={tag}
												variant="outline"
												title={tag}
												style={getTagBadgeStyle(tag)}
											>
												<span className="max-w-[18ch] truncate px-2 font-semibold text-xs">
													{tag}
												</span>
											</Badge>
										))}
										{tags.length > 3 && (
											<Tooltip>
												<TooltipTrigger asChild>
													<Badge
														variant="outline"
														className="flex cursor-pointer items-center gap-1"
													>
														<Tag className="size-3" />
														{tags.length - 3}
													</Badge>
												</TooltipTrigger>
												<TooltipContent>
													<span className="max-w-[300px]">
														{tags
															.slice(3)
															.join(", ")}
													</span>
												</TooltipContent>
											</Tooltip>
										)}
									</div>
								)}

								<span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">
									{relativeDate || ""}
								</span>

								<div className="flex items-center gap-1">
									{actions}
									{menuItems.length > 0 && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={(event) => {
														event.preventDefault();
														event.stopPropagation();
													}}
												>
													<MoreVertical className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{menuItems.map((item) => {
													return (
														<DropdownMenuItem
															key={item.label}
															className={
																item.className
															}
															onClick={(
																event,
															) => {
																event.preventDefault();
																event.stopPropagation();
																item.onClick();
															}}
														>
															{item.icon}
															{item.label}
														</DropdownMenuItem>
													);
												})}
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>
							</div>
						</Card>
					</Link>
				</HoverCardTrigger>
				{showHoverCard && (
					<HoverCardContent
						className="w-80"
						align="start"
						sideOffset={8}
					>
						<div className="flex flex-col gap-2">
							<P className="font-semibold">{name}</P>

							{description && (
								<P className="text-muted-foreground text-sm leading-relaxed">
									{description}
								</P>
							)}

							{(formattedDateCreated ||
								formattedDateLastEdited) && (
								<div className="flex flex-col gap-1 border-t pt-3">
									{formattedDateCreated && (
										<div className="flex items-center gap-1 text-muted-foreground text-xs">
											<Calendar className="size-3.5" />
											<span>Created:</span>
											<span className="text-foreground">
												{formattedDateCreated}
											</span>
										</div>
									)}
									{formattedDateLastEdited && (
										<div className="flex items-center gap-1 text-muted-foreground text-xs">
											<Clock className="size-3.5" />
											<span>Updated:</span>
											<span className="text-foreground">
												{formattedDateLastEdited}
											</span>
										</div>
									)}
								</div>
							)}
						</div>
					</HoverCardContent>
				)}
			</HoverCard>
		);
	}

	return (
		<Link
			to={path}
			className="group block w-full outline-none"
			data-testid={formatToDataTestId(`catalogGridItem-${id}`)}
		>
			<Card
				{...cardProps}
				className={`flex h-full cursor-pointer flex-col gap-0 overflow-hidden p-0 hover:shadow-md group-focus:ring group-focus:ring-ring/50 group-focus:ring-inset ${cardClassName}`.trim()}
			>
				<CardHeader
					className="relative flex h-18 w-full items-center justify-center pt-4"
					style={{ backgroundColor: cardBackground || gradient }}
				>
					{icon ? (
						<div className="flex h-full w-full items-center justify-center">
							{icon}
						</div>
					) : null}
				</CardHeader>

				<CardContent className="flex flex-1 flex-col gap-2 p-4">
					<P className="truncate font-medium" title={name}>
						{name}
					</P>

					{description ? (
						<P className="line-clamp-2 min-h-[40px] text-muted-foreground text-sm">
							{description}
						</P>
					) : null}

					{tags && tags.length > 0 && (
						<div className="mt-auto">
							<div className="flex min-w-0 flex-wrap items-center gap-1.5">
								{tags.slice(0, 2).map((tag) => (
									<Badge
										key={tag}
										variant="outline"
										title={tag}
										style={getTagBadgeStyle(tag)}
									>
										<span className="max-w-[18ch] truncate px-2 font-semibold text-xs">
											{tag}
										</span>
									</Badge>
								))}
								{tags.length > 2 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Badge
												variant="outline"
												className="flex cursor-pointer items-center gap-1"
											>
												<Tag className="size-3" />
												{tags.length - 2}
											</Badge>
										</TooltipTrigger>
										<TooltipContent>
											<span className="max-w-[300px]">
												{tags.slice(2).join(", ")}
											</span>
										</TooltipContent>
									</Tooltip>
								)}
							</div>
						</div>
					)}
				</CardContent>

				<div className="flex items-center justify-between border-t px-4 py-2">
					<span className="text-muted-foreground text-xs">
						{relativeDate || ""}
					</span>

					<div className="flex items-center gap-1">
						{actions}
						{menuItems.length > 0 && (
							<DropdownMenu
								open={menuOpen}
								onOpenChange={setMenuOpen}
							>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={(event) => {
											event.preventDefault();
											event.stopPropagation();
										}}
									>
										<MoreVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{menuItems.map((item) => {
										return (
											<DropdownMenuItem
												key={item.label}
												className={item.className}
												onClick={(event) => {
													event.preventDefault();
													event.stopPropagation();
													setMenuOpen(false);
													item.onClick();
												}}
											>
												{item.icon}
												{item.label}
											</DropdownMenuItem>
										);
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</Card>
		</Link>
	);
};
