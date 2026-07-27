import { MessageSquareTextIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@semoss/ui";
import { sendToActiveChat } from "../chat-imperative";

interface SelectionAnchor {
	text: string;
	top: number;
	left: number;
}

export interface SelectionChatButtonProps {
	/**
	 * Label rendered inside the button.
	 * @default "Send to chat"
	 */
	label?: ReactNode;
	/**
	 * Icon rendered to the left of the label. Pass `null` to hide it.
	 * @default <MessageSquareTextIcon />
	 */
	icon?: ReactNode;
	/**
	 * Extra classes merged onto the button element. The default pill styling
	 * is always applied first; use this to override colours, padding, etc.
	 */
	className?: string;
	/** z-index for the floating button. @default 9999 */
	zIndex?: number;
	/**
	 * Handles the selected text instead of sending it to the active chat.
	 * Useful when the consumer needs to open or create a chat first.
	 */
	onSelect?: (text: string) => void | Promise<void>;
}

/**
 * Drop this anywhere inside your app (it needs no context). Whenever the
 * user highlights text on the page a floating button appears above the
 * selection. Clicking it calls `onSelect` when provided; otherwise the active
 * ChatProvider's session receives the message through `sendToActiveChat`.
 *
 * Uses `onMouseDown` + `preventDefault` so the selection isn't cleared by
 * the click before the text is captured.
 */
export const SelectionChatButton = ({
	label = "Send to chat",
	icon = <MessageSquareTextIcon className="size-3.5" />,
	className,
	zIndex = 9999,
	onSelect,
}: SelectionChatButtonProps) => {
	const [anchor, setAnchor] = useState<SelectionAnchor | null>(null);

	useEffect(() => {
		const handleSelectionChange = () => {
			const sel = window.getSelection();
			const text = sel?.toString().trim();

			if (!text || !sel?.rangeCount) {
				setAnchor(null);
				return;
			}

			const rect = sel.getRangeAt(0).getBoundingClientRect();
			if (!rect.width && !rect.height) {
				setAnchor(null);
				return;
			}

			setAnchor({
				text,
				top: rect.top - 40,
				left: rect.left + rect.width / 2,
			});
		};

		document.addEventListener("selectionchange", handleSelectionChange);
		return () =>
			document.removeEventListener(
				"selectionchange",
				handleSelectionChange,
			);
	}, []);

	if (!anchor) return null;

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		const text = anchor.text;
		setAnchor(null);
		window.getSelection()?.removeAllRanges();
		void (onSelect ? onSelect(text) : sendToActiveChat(text));
	};

	return (
		<button
			type="button"
			onMouseDown={handleMouseDown}
			style={{
				position: "fixed",
				top: anchor.top,
				left: anchor.left,
				transform: "translateX(-50%)",
				zIndex,
			}}
			className={cn(
				"flex items-center gap-1.5 rounded-full border border-border bg-popover px-3 py-1.5 font-medium text-popover-foreground text-xs shadow-md hover:bg-accent",
				className,
			)}
		>
			{icon}
			{label}
		</button>
	);
};
