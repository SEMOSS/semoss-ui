import { cn } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import { TypewriterText } from "../common/typewriter-text";

export interface RoomGeneratingIndicatorProps {
	/** Whether to show the label. The div always reserves its height, so
	 * toggling this never changes the page height. */
	active: boolean;

	/**
	 * Fixed text to show instead of the rotating loading messages — e.g.
	 * prompting the user to complete a tool waiting on their input.
	 */
	overrideMessage?: string;
}

export const RoomGeneratingIndicator = ({
	active,
	overrideMessage,
}: RoomGeneratingIndicatorProps) => {
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
