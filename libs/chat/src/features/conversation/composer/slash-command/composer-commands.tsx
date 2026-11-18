import {
	BookOpenIcon,
	BotIcon,
	ChevronsDownUpIcon,
	HammerIcon,
	MessageCircleIcon,
	PaperclipIcon,
	SparklesIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { useChatConfig } from "../../../chat/config/use-chat-config";
import { useFileDrop } from "../../attachments/file-drop.context";
import { canChooseAgentMode } from "../agent-mode-choice";
import { useComposer } from "../use-composer";
import { SlashCommand } from "./slash-command";

/**
 * The "/" menu's Chat group: attach files, open the knowledge, toolbox, and
 * agent pickers, switch a new chat's mode, and compact an open room.
 */
export const ComposerCommands = () => {
	const { t } = useTranslation("room");
	const { theme } = useChatConfig();
	const { openFilePicker } = useFileDrop();
	const {
		isNewChat,
		isAgentMode,
		agent,
		openPicker,
		switchToAgent,
		switchToChat,
		compact,
	} = useComposer();
	// an open room's mode is fixed at creation; a new chat's follows the theme
	const canSwitchMode = isNewChat && canChooseAgentMode(theme.featureFlags);
	/** A command's name and description, from `slash.commands.<id>`. */
	const text = (id: string) => ({
		name: id,
		label: t(`slash.commands.${id}.label`),
		description: t(`slash.commands.${id}.description`),
	});

	return (
		<>
			<SlashCommand
				{...text("attach")}
				group="chat"
				icon={<PaperclipIcon />}
				keywords={["file", "document", "upload"]}
				onSelect={openFilePicker}
			/>
			<SlashCommand
				{...text("knowledge")}
				group="chat"
				icon={<BookOpenIcon />}
				onSelect={() => openPicker("KNOWLEDGE")}
			/>
			<SlashCommand
				{...text("toolbox")}
				group="chat"
				icon={<HammerIcon />}
				onSelect={() => openPicker("TOOLBOX")}
			/>
			{agent.kind !== "fixed" && (
				<SlashCommand
					{...text("agent")}
					group="chat"
					icon={<BotIcon />}
					onSelect={() => openPicker("AGENT")}
				/>
			)}
			{canSwitchMode && !isAgentMode && (
				<SlashCommand
					{...text("agent-harness")}
					group="chat"
					icon={<SparklesIcon />}
					keywords={["harness", "agent mode"]}
					onSelect={switchToAgent}
				/>
			)}
			{canSwitchMode && isAgentMode && switchToChat && (
				<SlashCommand
					{...text("chat-mode")}
					group="chat"
					icon={<MessageCircleIcon />}
					onSelect={switchToChat}
				/>
			)}
			{compact && (
				<SlashCommand
					{...text("compact")}
					group="chat"
					icon={<ChevronsDownUpIcon />}
					isLockedWhileBusy
					onSelect={compact}
				/>
			)}
		</>
	);
};
