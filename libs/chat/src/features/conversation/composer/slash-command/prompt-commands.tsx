import { TextQuoteIcon } from "lucide-react";
import { useComposer } from "../composer.context";
import { SlashCommand } from "./slash-command";

/** The "/" menu's Prompts group: each prompt the chat offers, which sends it. */
export const PromptCommands = () => {
	const { prompts, runPrompt } = useComposer();

	return prompts.map((prompt) => (
		<SlashCommand
			key={prompt.id}
			name={`prompt-${prompt.id}`}
			group="prompts"
			label={prompt.title}
			description={prompt.intent}
			keywords={prompt.tags}
			icon={<TextQuoteIcon />}
			isLockedWhileBusy
			onSelect={() => runPrompt(prompt)}
		/>
	));
};
