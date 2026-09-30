import { type LucideIcon, SquareArrowOutUpRight, XIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { AppCatalogAvatar } from "../app-catalog-avatar";

/** One row of an `AgentResourceList`. */
export interface AgentResourceListItem {
	/** Stable id, passed back to `onRemove`. */
	id: string;
	/** Display name shown as the row title. */
	title: string;
	/** Secondary line under the title (type, description, etc.). */
	description?: string;
	/**
	 * Icon rendered in the row's media slot. When omitted, the row shows the
	 * catalog avatar (initials plus name-hashed color) for its title.
	 */
	icon?: LucideIcon;
	/** External catalog link. When set, the row shows an open-in-new-tab action. */
	href?: string;
}

export interface AgentResourceListProps {
	/** Rows to render, in order. */
	items: AgentResourceListItem[];
	/** Text shown in place of the list when `items` is empty. */
	emptyLabel: string;
	/** Removes a row. Omit for read-only lists, which hide the remove action. */
	onRemove?: (id: string) => void;
}

/**
 * Responsive grid of compact tiles for the resources attached to an agent
 * (toolboxes, knowledge, skills, prompts, subagents). Shared by every
 * attachment field so they read as one pattern in both the viewer and the
 * editor.
 */
export const AgentResourceList = ({
	items,
	emptyLabel,
	onRemove,
}: AgentResourceListProps) => {
	const { t } = useTranslation("agent");

	if (items.length === 0) {
		return <Muted className="font-normal">{emptyLabel}</Muted>;
	}

	return (
		<ItemGroup className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
			{items.map((item) => {
				const Icon = item.icon;
				return (
					<Item
						key={item.id}
						variant="outline"
						size="sm"
						className="min-w-0 flex-nowrap items-start px-3"
						asChild
					>
						<li>
							{Icon ? (
								<ItemMedia variant="icon">
									<Icon aria-hidden="true" />
								</ItemMedia>
							) : (
								<ItemMedia>
									<AppCatalogAvatar
										name={item.title}
										aria-hidden="true"
										className="size-8 rounded-sm text-xs"
									/>
								</ItemMedia>
							)}
							<ItemContent className="min-w-0 gap-0.5">
								<ItemTitle className="w-full min-w-0">
									<span
										className="truncate"
										title={item.title}
									>
										{item.title}
									</span>
								</ItemTitle>
								{item.description && (
									<ItemDescription
										className="line-clamp-2 text-xs"
										title={item.description}
									>
										{item.description}
									</ItemDescription>
								)}
							</ItemContent>
							<ItemActions className="-me-1.5 -mt-1.5 gap-0">
								{item.href && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												asChild
											>
												<a
													href={item.href}
													target="_blank"
													rel="noopener noreferrer"
													aria-label={t(
														"resource.open",
														{
															name: item.title,
														},
													)}
												>
													<SquareArrowOutUpRight aria-hidden="true" />
												</a>
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("resource.openTooltip")}
										</TooltipContent>
									</Tooltip>
								)}
								{onRemove && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label={t(
													"resource.remove",
													{
														name: item.title,
													},
												)}
												onClick={() =>
													onRemove(item.id)
												}
											>
												<XIcon aria-hidden="true" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("resource.removeTooltip")}
										</TooltipContent>
									</Tooltip>
								)}
							</ItemActions>
						</li>
					</Item>
				);
			})}
		</ItemGroup>
	);
};
