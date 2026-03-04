import { X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom";
import { Button } from "@semoss/ui/next";

interface PortalModalProps {
	open: boolean;
	onClose: () => void;
	contentId: string;
}

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
		<div className="pointer-events-auto fixed inset-0 z-[1300] flex min-h-screen min-w-full flex-col items-center justify-start overflow-hidden bg-background/95 backdrop-blur-sm">
			<div className="pointer-events-auto relative z-[1400] flex min-w-full flex-col overflow-hidden border border-border bg-card p-6 shadow-2xl">
				<Button
					variant="ghost"
					size="icon"
					aria-label="Close"
					onClick={onClose}
					className="pointer-events-auto absolute top-4 right-4 z-[1500] text-foreground hover:bg-accent hover:text-accent-foreground"
				>
					<X className="size-5" />
				</Button>
				<div id={contentId} />
			</div>
		</div>,
		document.getElementById("root")!,
	);
};
