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

interface RoomSelectedResourcesProps {
	/** Selected values for exactly one section, never the entire catalog. */
	items: MCPConfig[];
	type: "KNOWLEDGE" | "TOOLBOX";
	disabled: boolean;
	onAdd: () => void;
	onRemove: (item: MCPConfig) => void;
}

/** Visible selections with conversation-scoped removal and explicit ownership. */
export function RoomSelectedResources({
	items,
	type,
	disabled,
	onAdd,
	onRemove,
}: RoomSelectedResourcesProps) {
	const { t } = useTranslation(["room", "common"]);
	const id = useId();
	return (
		<section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H4 id={id} className="flex items-center gap-2 text-base">
					{t(
						type === "KNOWLEDGE"
							? "room:form.knowledgeLabel"
							: "room:studio.tools",
					)}
					<Badge variant="secondary">{items.length}</Badge>
				</H4>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					onClick={onAdd}
				>
					<PlusIcon aria-hidden="true" />
					{t(
						type === "KNOWLEDGE"
							? "room:menuKnowledge.addKnowledge"
							: "room:menuToolbox.addToolbox",
					)}
				</Button>
			</div>
			{items.length === 0 ? (
				<Muted>
					{t(
						type === "KNOWLEDGE"
							? "room:settings.noKnowledge"
							: "room:settings.noTools",
					)}
				</Muted>
			) : (
				<ul className="divide-y divide-border">
					{items.map((item) => {
						const inherited =
							item.fromWorkspace ||
							item.fromRoom ||
							item.type === "ROOM";
						return (
							<li
								key={item.id}
								className="flex items-center gap-3 py-2"
							>
								<div className="min-w-0 flex-1 space-y-1">
									<span className="block break-words text-sm">
										{item.name || item.id}
									</span>
									{inherited && (
										<>
											<Badge variant="outline">
												{t(
													item.fromWorkspace
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
								{!inherited && (
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
