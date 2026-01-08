import { useState } from "react";
import { useParams } from "react-router-dom";
import { FileManager } from "@/components/engine-workspace/FileManager";
import { useRootStore } from "@/hooks";

export const EngineFileManagerPage = () => {
	const { engineId } = useParams<{ engineId: string }>();
	const [isLoading, setIsLoading] = useState(false);
	const [overlayComponent, setOverlayComponent] = useState<
		(() => JSX.Element) | null
	>(null);
	const { configStore } = useRootStore();

	const insightId = configStore.store.insightID;

	const handleOpenOverlay = (component: () => JSX.Element) => {
		setOverlayComponent(() => component);
	};

	const handleCloseOverlay = () => {
		setOverlayComponent(null);
	};

	return (
		<div className="h-screen w-full overflow-hidden">
			<FileManager
				engineId={engineId || ""}
				insightId={insightId}
				setLoading={setIsLoading}
				openOverlay={handleOpenOverlay}
				closeOverlay={handleCloseOverlay}
			/>

			{/* Render overlay if present */}
			{overlayComponent && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={handleCloseOverlay}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							handleCloseOverlay();
						}
					}}
				>
					<div
						role="document"
						className="w-[600px] max-w-none rounded-lg bg-white p-4 shadow-lg"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						{overlayComponent()}
					</div>
				</div>
			)}

			{isLoading && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
					<div className="font-medium text-lg text-white">
						Loading...
					</div>
				</div>
			)}
		</div>
	);
};
