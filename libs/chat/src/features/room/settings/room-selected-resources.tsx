import { PlusIcon, XIcon } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPConfig } from "@semoss/shared";
import {
	Badge,
	Button,
	H4,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { isRemovableToolbox, listRoomTools } from "../../tools/mcp/mcp-utils";

/** Props for {@link RoomSelectedResources}. */
interface RoomSelectedResourcesProps {
	/** The room's own selected knowledge, never the entire catalog. */
	items: MCPConfig[];
	/** The knowledge the room's agent brings, listed first and never removable. */
	agentItems: MCPConfig[];
	/** Locks adding and removing, as while a turn is running. */
	disabled: boolean;
	/** Opens the knowledge picker. */
	onAdd: () => void;
	/** Removes one selection from this room. */
	onRemove: (item: MCPConfig) => void;
}

/** The room's selected knowledge, with conversation-scoped removal and explicit ownership. */
export function RoomSelectedResources({
	items,
	agentItems,
	disabled,
	onAdd,
	onRemove,
}: RoomSelectedResourcesProps) {
	const { t } = useTranslation(["room", "common"]);
	const id = useId();
	const agentIds = new Set(agentItems.map((item) => item.id));
	const shown = listRoomTools(items, agentItems);
	return (
		<section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H4 id={id} className="flex items-center gap-2 text-base">
					{t("room:form.knowledgeLabel")}
					<Badge variant="secondary">{shown.length}</Badge>
				</H4>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					onClick={onAdd}
				>
					<PlusIcon aria-hidden="true" />
					{t("room:menuKnowledge.addKnowledge")}
				</Button>
			</div>
			{shown.length === 0 ? (
				<Muted>{t("room:settings.noKnowledge")}</Muted>
			) : (
				<ul className="divide-y divide-border">
					{shown.map((item) => {
						// Knowledge from the agent or the room's own setup cannot be removed here.
						const isFromAgent = agentIds.has(item.id);
						const isInherited =
							isFromAgent || !isRemovableToolbox(item);
						return (
							<li
								key={item.id}
								className="flex items-center gap-3 py-2"
							>
								<div className="min-w-0 flex-1 space-y-1">
									<span className="block break-words text-sm">
										{item.name || item.id}
									</span>
									{isInherited && (
										<>
											<Badge variant="outline">
												{t(
													isFromAgent
														? "common:badges.fromAgent"
														: "room:settings.fromRoom",
												)}
											</Badge>
											<Muted className="text-xs">
												{t(
													"room:settings.inheritedSelection",
												)}
											</Muted>
										</>
									)}
								</div>
								{!isInherited && (
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												disabled={disabled}
												aria-label={t(
													"room:settings.removeSelection",
													{
														name:
															item.name ||
															item.id,
													},
												)}
												onClick={() => onRemove(item)}
											>
												<XIcon aria-hidden="true" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t(
												"room:settings.removeSelection",
												{ name: item.name || item.id },
											)}
										</TooltipContent>
									</Tooltip>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
