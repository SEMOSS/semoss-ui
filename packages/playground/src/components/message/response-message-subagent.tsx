import { CheckIcon, HourglassIcon, XCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import type { AgentRunStatusValue } from "@semoss/sdk";
import { cn, Spinner } from "@semoss/ui/next";
import type { ResponseMessageStore } from "@/stores";
import type { PixelMessageSubagentPart } from "@/types";

export const getSubagentState = (
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

interface ResponseMessageSubagentProps {
	message: ResponseMessageStore;
	part: PixelMessageSubagentPart;
}

/**
 * A spawned subagent, styled to match the "large" ask-mode tool card. Click
 * opens a sidebar panel with its response/error -- see RoomSubagent. No
 * cancel action -- see agent-harness.ts's item.kind === "subagent" handling
 * for what's actually tracked.
 */
export const ResponseMessageSubagent: React.FC<ResponseMessageSubagentProps> =
	observer(({ message, part }) => {
		const { t } = useTranslation("tool");
		const { room } = message;
		const { subagent } = part;
		const state = getSubagentState(subagent.status, subagent, t);
		const nodeId = `subagent--${subagent.id}`;
		const isActive = room.isSidebarNodeSelected(nodeId);

		const handleClick = () => {
			room.addSidebarNode(nodeId, {
				type: "tab",
				name: subagent.alias || t("subagent.title"),
				component: "room-subagent",
				config: { subagentId: subagent.id },
				enableClose: true,
			});
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
	});
