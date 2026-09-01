import { Sparkles, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	cn,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatToDataTestId, getTagBadgeStyle } from "@/utility";
import { formatDateToLocal } from "@/utility/date";

export interface TemplateCardProps extends React.ComponentProps<typeof Card> {
	/** Unique template / project ID */
	id?: string;
	/** Path of the template */
	path: string;
	/** Display name */
	name: string;
	/** Associated description */
	description: string;
	/** Image URL */
	image: string;
	/** Date last edited (UTC timestamp) */
	dateLastEdited: string;
	/** Tags for the item */
	tags: string[];
	/** Callback when "Use Template" action is clicked directly on card */
	onUseTemplate?: (id: string) => void;
}

export const TemplateCard = ({
	path,
	name,
	description,
	id = "",
	dateLastEdited,
	tags,
	image,
	className,
	onUseTemplate,
	...cardProps
}: TemplateCardProps) => {
	const localDate = formatDateToLocal(dateLastEdited);

	return (
		<Link
			to={path}
			className="group block w-full outline-none"
			data-testid={formatToDataTestId(`TemplateCard-${id}`)}
		>
			<Card
				{...cardProps}
				className={cn(
					"flex h-full cursor-pointer flex-col gap-0 overflow-hidden p-0 transition-all hover:shadow-md group-focus:ring-2 group-focus:ring-ring/50 group-focus:ring-inset",
					className,
				)}
			>
				{/* Large visual header / cover banner */}
				<div className="relative h-48 w-full overflow-hidden border-b bg-muted">
					{image ? (
						<img
							src={image}
							alt={name}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/30">
							<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-40 dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
							<AppCatalogAvatar
								name={name}
								className="size-16 rounded-xl text-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
							/>
						</div>
					)}

					<div className="absolute top-2.5 right-2.5">
						<Badge
							variant="secondary"
							className="bg-background/90 font-medium text-xs backdrop-blur-sm"
						>
							Template
						</Badge>
					</div>
				</div>

				<CardContent className="flex flex-1 flex-col gap-2.5 p-4">
					<P
						className="line-clamp-1 font-semibold text-base"
						title={name}
					>
						{name}
					</P>

					<P className="line-clamp-2 min-h-[40px] text-muted-foreground text-sm">
						{description ||
							"No description provided for this template."}
					</P>

					{tags && tags.length > 0 && (
						<div className="mt-auto pt-1">
							<div className="flex min-w-0 flex-wrap items-center gap-1.5">
								{tags.slice(0, 2).map((tag) => (
									<Badge
										key={tag}
										variant="outline"
										title={tag}
										style={getTagBadgeStyle(tag)}
									>
										<span className="max-w-[18ch] truncate px-1.5 font-medium text-xs">
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

				<div className="flex items-center justify-between border-t px-4 py-2.5">
					<span className="text-muted-foreground text-xs">
						{localDate || "Recently updated"}
					</span>

					{onUseTemplate && (
						<Button
							size="sm"
							variant="default"
							className="h-8 gap-1.5 px-3 text-xs"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onUseTemplate(id);
							}}
						>
							<Sparkles className="size-3.5" />
							Use Template
						</Button>
					)}
				</div>
			</Card>
		</Link>
	);
};
