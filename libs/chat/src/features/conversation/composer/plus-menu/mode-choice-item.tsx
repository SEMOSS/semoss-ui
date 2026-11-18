import { BotIcon, MessageCircleIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import { useComposer } from "../use-composer";

/**
 * The plus menu's Chat and Agent choice, after a separator. Only a new chat
 * whose saved agent leaves the mode to the user offers it.
 */
export const ModeChoiceItem = () => {
	const { t } = useTranslation("room");
	const {
		agent,
		isAgentMode,
		isBusy,
		closeMenu,
		switchToChat,
		switchToAgent,
	} = useComposer();
	if (agent.kind !== "saved" || !agent.withModeChoice) {
		return null;
	}

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuRadioGroup
				aria-label={`${t("modes.ask")} / ${t("modes.agent")}`}
				value={isAgentMode ? "agent" : "chat"}
			>
				<DropdownMenuRadioItem
					value="chat"
					disabled={isBusy}
					onSelect={() => {
						switchToChat?.();
						closeMenu();
					}}
				>
					<MessageCircleIcon aria-hidden="true" />
					{t("modes.ask")}
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem
					value="agent"
					disabled={isBusy}
					onSelect={() => {
						switchToAgent();
						closeMenu();
					}}
				>
					<BotIcon aria-hidden="true" />
					{t("modes.agent")}
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</>
	);
};
