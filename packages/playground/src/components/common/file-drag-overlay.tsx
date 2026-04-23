import { FilePlus2 } from "lucide-react";
import { useFileDrag } from "@/contexts";

export const FileDragOverlay = () => {
	const { isDragging } = useFileDrag();

	if (!isDragging) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background/20 backdrop-blur-xs">
			<FilePlus2 className="size-12 text-foreground" />
			<p className="font-medium text-md">Drop files to add to chat</p>
		</div>
	);
};
