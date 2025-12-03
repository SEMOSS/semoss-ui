import { useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Modal, styled } from "@semoss/ui";
import { useRootStore } from "@/hooks";
import { FileManager } from "./FileManager";

const PageContainer = styled(Box)({
	width: "100%",
	height: "100vh",
	overflow: "hidden",
});

const OverlayContainer = styled(Modal)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backdropFilter: "rgba(0, 0, 0, 0.5)",
	"& .MuiDialog-paper": {
    width: "600px",
    maxWidth: "none",   
  },
}));

const LoadingOverlay = styled(Box)({
	position: "fixed",
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: "rgba(0, 0, 0, 0.3)",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	zIndex: 9999,
});

const LoadingText = styled(Box)(({ theme }) => ({
	color: theme.palette.common.white,
	fontSize: "18px",
	fontWeight: 500,
	fontFamily: "Inter, sans-serif",
}));

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
		<PageContainer>
			<FileManager
				appId={engineId || ""}
				insightId={insightId}
				setLoading={setIsLoading}
				openOverlay={handleOpenOverlay}
				closeOverlay={handleCloseOverlay}
			/>

			{/* Render overlay if present */}
			{overlayComponent && (
				<OverlayContainer open={true} onClose={handleCloseOverlay} maxWidth="lg">
					{overlayComponent()}
				</OverlayContainer>
			)}

			{/* Optional: Loading indicator */}
			{isLoading && (
				<LoadingOverlay>
					<LoadingText>Loading...</LoadingText>
				</LoadingOverlay>
			)}
		</PageContainer>
	);
};
