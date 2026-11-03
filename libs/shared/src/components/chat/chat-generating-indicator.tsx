import { cn } from "@semoss/ui/next";
import { useLoadingMessage } from "../../hooks/use-loading-message";
import { TypewriterText } from "./typewriter-text";

export interface ChatGeneratingIndicatorProps {
	/** Whether to show the label. The div always reserves its height, so
	 * toggling this never changes the page height. */
	active: boolean;

	/**
	 * Fixed text to show instead of the rotating loading messages, such as a
	 * prompt to complete a tool waiting on the user's input.
	 */
	overrideMessage?: string;
}

/** The line under a chat that says the reply is on its way while nothing else shows it. */
export const ChatGeneratingIndicator = ({
	active,
	overrideMessage,
}: ChatGeneratingIndicatorProps) => {
	const { loadingMessage } = useLoadingMessage(active && !overrideMessage);

	return (
		<div
			className={cn(
				"flex h-10 items-center text-muted-foreground text-sm",
				!active && "invisible",
			)}
		>
			<TypewriterText
				text={overrideMessage ?? loadingMessage}
				className={cn(!overrideMessage && "animate-pulse")}
			/>
		</div>
	);
};
