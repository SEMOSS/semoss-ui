import { BotIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { cn, ScrollArea } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { getSubagentState } from "@/components/message/response-message-subagent";
import { useRoom } from "@/contexts";

/** Which subagent a panel is showing. `subagentId` is what dedupes it. */
export interface RoomSubagentParams {
	subagentId: string;
}

/**
 * A spawned subagent's status, alias and result.
 *
 * Looks the subagent up live off the room's history (see
 * `RoomStore.getSubagentPart`) so it stays in sync while open. No drill-in into
 * the subagent's own turns yet.
 */
const RoomSubagentPanel = observer(
	({ config }: WorkbenchPanelProps<RoomSubagentParams>) => {
		const room = useRoom();
		const { t } = useTranslation("tool");
		const subagent = config?.subagentId
			? room.getSubagentPart(config.subagentId)
			: undefined;

		if (!subagent) {
			return (
				<div className="p-4 text-muted-foreground text-sm">
					{t("subagent.notFound")}
				</div>
			);
		}

		const state = getSubagentState(subagent.status, subagent, t);
		const body =
			subagent.status === "COMPLETED"
				? subagent.resultPreview || t("subagent.noResult")
				: subagent.status === "FAILED"
					? subagent.error || state.subtext
					: state.subtext;

		return (
			<ScrollArea className="h-full w-full">
				<div className="flex flex-col gap-4 p-4">
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"flex size-9 shrink-0 items-center justify-center rounded-sm",
								state.iconClassName,
							)}
						>
							{state.icon}
						</div>
						<div className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-foreground text-sm">
								{subagent.alias || t("subagent.title")}
							</span>
							<span className="text-muted-foreground text-xs">
								{subagent.id}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<span className="font-medium text-foreground text-xs">
							{t("form.result")}
						</span>
						<p className="whitespace-pre-wrap text-muted-foreground text-sm">
							{body}
						</p>
					</div>
				</div>
			</ScrollArea>
		);
	},
);

/** One spawned subagent's status and result. */
export const ROOM_SUBAGENT_PANEL: WorkbenchPanelConfig<RoomSubagentParams> = {
	name: "Subagent",
	icon: ({ className }) => <BotIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.subagentId === b.subagentId,
	content: RoomSubagentPanel,
};
