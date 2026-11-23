import type { ReactNode } from "react";
import {
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	Muted,
} from "@semoss/ui/next";

// design-lint-disable-next-line arbitrary-size -- the expanded graph fills the whole window
const EXPANDED_CANVAS_CLASS =
	"h-dvh max-h-dvh w-screen max-w-none gap-0 rounded-none border-0 p-4 sm:max-w-none";

/** Props for {@link ExpandedCanvasDialog}. */
interface ExpandedCanvasDialogProps {
	/** The dialog's name, for screen readers */
	title: string;
	/** The height the graph had in the page, kept by the placeholder there */
	placeholderClassName: string;
	/**
	 * Runs on Escape before the dialog closes, so the page closes its own
	 * panel first; returns whether it handled Escape, which keeps the view
	 * expanded
	 */
	onEscape: () => boolean;
	/** Collapses the graph back into the page */
	onCollapse: () => void;
	/** The graph, with its toolbar and drawer */
	children: ReactNode;
}

/**
 * An expanded dependency graph (see `useExpandableCanvas`): a placeholder
 * where the graph was in the page, and the graph in a full-window `Dialog`.
 * Escape goes to the page first, then collapses. The admin Ontology and the
 * Ontology tab share it.
 */
export const ExpandedCanvasDialog = ({
	title,
	placeholderClassName,
	onEscape,
	onCollapse,
	children,
}: ExpandedCanvasDialogProps) => (
	<>
		<div
			className={cn(
				"flex items-center justify-center rounded-lg border",
				placeholderClassName,
			)}
		>
			<Muted>The ontology is expanded.</Muted>
		</div>
		<Dialog
			open={true}
			onOpenChange={(open) => {
				if (!open) {
					onCollapse();
				}
			}}
		>
			<DialogContent
				showCloseButton={false}
				className={EXPANDED_CANVAS_CLASS}
				onEscapeKeyDown={(event) => {
					if (onEscape()) {
						event.preventDefault();
					}
				}}
			>
				<DialogTitle className="sr-only">{title}</DialogTitle>
				<DialogDescription className="sr-only">
					The ontology, expanded to fill the window
				</DialogDescription>
				{children}
			</DialogContent>
		</Dialog>
	</>
);
