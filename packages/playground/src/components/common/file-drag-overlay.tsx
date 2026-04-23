import { UploadCloudIcon } from "lucide-react";
import { useFileDrag } from "@/contexts";

export const FileDragOverlay = () => {
	const { isDragging } = useFileDrag();

	if (!isDragging) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-3 rounded-xl border-2 border-primary border-dashed bg-background px-12 py-8 shadow-xl">
				<UploadCloudIcon className="size-10 text-primary" />
				<p className="font-semibold text-base">Drop files to attach</p>
				<p className="text-muted-foreground text-sm">
					Release to add files to your message
				</p>
			</div>
		</div>
	);
};
