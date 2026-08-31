import { cn, Spinner } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";

export interface RoomGeneratingIndicatorProps {
	/** Whether to show the spinner + label. The div always reserves its
	 * height, so toggling this never changes the page height. */
	active: boolean;
}

export const RoomGeneratingIndicator = ({
	active,
}: RoomGeneratingIndicatorProps) => {
	const { loadingMessage } = useLoadingMessage(active);

	return (
		<div
			className={cn(
				"ms-2 flex h-10 items-center gap-2 text-muted-foreground text-sm",
				!active && "invisible",
			)}
		>
			<Spinner className="size-4" />
			<span>{loadingMessage}</span>
		</div>
	);
};
