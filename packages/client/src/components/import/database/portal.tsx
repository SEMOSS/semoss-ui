import { Close } from "@mui/icons-material";
import type React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom";
import { Box, IconButton, styled } from "@semoss/ui";

interface PortalModalProps {
	open: boolean;
	onClose: () => void;
	contentId: string;
}

const Overlay = styled(Box)(({ theme }) => ({
	position: "fixed",
	zIndex: 1300,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	minWidth: "100vw",
	height: "100vh",
	backgroundColor: "rgba(0,0,0,0.8)",
	display: "flex",
	flexDirection: "column",
	justifyContent: "flex-start",
	alignItems: "center",
	overflow: "none",
	pointerEvents: "auto",
}));

const Content = styled(Box)(({ theme }) => ({
	position: "relative",
	backgroundColor: theme.palette.background.paper,
	zIndex: 1400,
	boxShadow: theme.shadows[5],
	overflow: "none",
	padding: theme.spacing(3),
	boxSizing: "border-box",
	display: "flex",
	flexDirection: "column",
	minWidth: "100vw",
}));

const CloseBtn = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	top: theme.spacing(2),
	right: theme.spacing(2),
	color: theme.palette.text.primary,
	zIndex: 1500,
	pointerEvents: "auto",
}));

export const PortalModal: React.FC<PortalModalProps> = ({
	open,
	onClose,
	contentId,
}) => {
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, onClose]);

	if (!open) return null;

	return ReactDOM.createPortal(
		<Overlay sx={{ pointerEvents: "auto" }}>
			<Content sx={{ pointerEvents: "auto" }}>
				<CloseBtn aria-label="Close" onClick={onClose}>
					<Close />
				</CloseBtn>
				<div id={contentId} />
			</Content>
		</Overlay>,
		document.getElementById("root")!,
	);
};
