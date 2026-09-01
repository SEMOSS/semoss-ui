import { cn } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import { TypewriterText } from "../common/typewriter-text";

export interface RoomGeneratingIndicatorProps {
	/** Whether to show the label. The div always reserves its height, so
	 * toggling this never changes the page height. */
	active: boolean;
}

export const RoomGeneratingIndicator = ({
	active,
}: RoomGeneratingIndicatorProps) => {
	const { loadingMessage } = useLoadingMessage(active);

	return (
		<div
			className={cn(
				"flex h-10 items-center text-muted-foreground text-sm",
				!active && "invisible",
			)}
		>
			<TypewriterText text={loadingMessage} className="animate-pulse" />
		</div>
	);
};
