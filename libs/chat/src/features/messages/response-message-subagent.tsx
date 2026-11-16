import { CheckIcon, HourglassIcon, XCircleIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { AgentRunStatusValue } from "@semoss/sdk";
import { cn, Spinner } from "@semoss/ui/next";
import type { PixelMessageSubagentPart } from "../../types";
import { ROOM_PANEL_TYPES } from "../room/room-sidebar";
import { useSidebarPanelActive } from "../workbench/use-sidebar-panel-active";
import type { ResponseMessageStore } from "./response-message.store";

/**
 * How a subagent's card shows its status.
 *
 * @param status - The subagent's run status.
 * @param subagent - The subagent, whose error a failed card shows.
 * @param t - The `tool` namespace's translate function.
 * @returns The card's icon, its icon's classes, its status line, and its
 * background class.
 */
export const getSubagentCardState = (
	status: AgentRunStatusValue,
	subagent: PixelMessageSubagentPart["subagent"],
	t: ReturnType<typeof useTranslation<"tool">>["t"],
) => {
	switch (status) {
		case "COMPLETED":
			return {
				icon: <CheckIcon className="size-5" />,
				iconClassName: "bg-primary/10 text-primary",
				subtext: t("status.completed"),
				background: "bg-sidebar" as const,
			};
		case "FAILED":
			return {
				icon: <XCircleIcon className="size-5" />,
				iconClassName: "bg-muted text-muted-foreground",
				subtext: subagent.error || t("status.failed"),
				background: "bg-background" as const,
			};
		case "CANCELLED":
			return {
				icon: <XCircleIcon className="size-5" />,
				iconClassName: "bg-muted text-muted-foreground",
				subtext: t("status.cancelled"),
				background: "bg-background" as const,
			};
		case "INPUT_REQUIRED":
			return {
				icon: <HourglassIcon className="size-5" />,
				iconClassName: "bg-muted text-muted-foreground",
				subtext: t("status.waitingForInput"),
				background: "bg-background" as const,
			};
		default:
			// SUBMITTED, RUNNING
			return {
				icon: <Spinner />,
				iconClassName: "bg-muted text-muted-foreground",
				subtext: t("status.running"),
				background: "bg-background" as const,
			};
	}
};

/** Props for {@link ResponseMessageSubagent}. */
interface ResponseMessageSubagentProps {
	/** The response the subagent was spawned from. */
	message: ResponseMessageStore;
	/** The response's subagent part. */
	part: PixelMessageSubagentPart;
}

/**
 * A spawned subagent, styled to match the "large" ask-mode tool card. Click
 * opens a sidebar panel with its response/error -- see RoomSubagent. No
 * cancel action -- see agent-harness.ts's item.kind === "subagent" handling
 * for what's actually tracked.
 */
export const ResponseMessageSubagent = ({
	message,
	part,
}: ResponseMessageSubagentProps) => {
	const { t } = useTranslation("tool");
	const { room } = message;
	const { subagent } = part;
	const state = getSubagentCardState(subagent.status, subagent, t);
	const panelConfig = { subagentId: subagent.id };
	const isActive = useSidebarPanelActive(
		room,
		ROOM_PANEL_TYPES.SUBAGENT,
		panelConfig,
	);

	/** Open the subagent's panel in the sidebar. */
	const handleClick = () => {
		room.openSidebarPanel(
			ROOM_PANEL_TYPES.SUBAGENT,
			panelConfig,
			subagent.alias || t("subagent.title"),
		);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"flex items-center gap-3 rounded-lg border border-border p-2 text-start hover:bg-accent",
				state.background,
				isActive && "border-primary",
			)}
		>
			<div
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-sm",
					state.iconClassName,
				)}
			>
				{state.icon}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span
					className="truncate font-medium text-foreground text-sm"
					title={subagent.alias || t("subagent.title")}
				>
					{subagent.alias || t("subagent.title")}
				</span>
				<span
					className="truncate text-muted-foreground text-sm"
					title={state.subtext}
				>
					{state.subtext}
				</span>
			</div>
		</button>
	);
};
