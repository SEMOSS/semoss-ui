import { BotIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem, DropdownMenuSeparator } from "@semoss/ui/next";
import { getAgentLabel } from "../../../tools/mcp/mcp-utils";
import { useComposer } from "../use-composer";

/**
 * The plus menu's agent picker item, after a separator, named for the agent
 * the chat runs. Only a new chat offers it: an open room keeps its agent.
 */
export const ChooseAgentItem = () => {
	const { t } = useTranslation("room");
	const { agent, options, isAgentMode, isBusy, openPicker } = useComposer();
	if (agent.kind === "fixed") {
		return null;
	}
	const agentName = getAgentLabel({
		workspace: options.workspace,
		isAgentMode: isAgentMode,
		defaultAgentLabel: t("modes.defaultAgent"),
	});

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				disabled={isBusy}
				onSelect={() => openPicker("AGENT")}
			>
				<BotIcon aria-hidden="true" />
				<span className="min-w-0 whitespace-normal break-words">
					{agentName
						? t("modes.selectedAgent", { name: agentName })
						: t("menuWorkspace.selectAgent")}
				</span>
			</DropdownMenuItem>
		</>
	);
};
