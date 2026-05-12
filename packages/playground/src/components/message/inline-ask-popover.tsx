import { MessageSquareIcon, SendIcon } from "lucide-react";
import {
	type KeyboardEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Button,
	Input,
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@semoss/ui/next";
import {
	type ActiveSelectionInfo,
	clearBrowserSelection,
	formatInlineAskPair,
	paintHighlight,
} from "@/utility";
import "./inline-ask.css";

const HIGHLIGHT_NAME = "inline-ask";

interface InlineAskPopoverProps {
	selection: ActiveSelectionInfo;
	onClose: () => void;
	appendToMainInput: (text: string) => void;
}

export const InlineAskPopover: React.FC<InlineAskPopoverProps> = ({
	selection,
	onClose,
	appendToMainInput,
}) => {
	const [showInput, setShowInput] = useState(false);
	const [question, setQuestion] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Paint a custom highlight while the popover is mounted. CSS Custom
	// Highlight API renders independently of the native selection, so the
	// highlight survives the focus shift when the input mounts.
	useEffect(
		() => paintHighlight(HIGHLIGHT_NAME, selection.range),
		[selection.range],
	);

	// Auto-focus the input
	useEffect(() => {
		if (showInput) inputRef.current?.focus();
	}, [showInput]);

	// Stable virtual anchor for Radix; reads the live rect from the captured Range.
	const virtualRef = useMemo(
		() => ({
			current: {
				getBoundingClientRect: () =>
					selection.range.getBoundingClientRect(),
			},
		}),
		[selection.range],
	);

	const submit = () => {
		const trimmed = question.trim();
		if (!trimmed) return;
		appendToMainInput(formatInlineAskPair(selection.text, trimmed));
		clearBrowserSelection();
		onClose();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	return (
		<Popover open onOpenChange={(open) => !open && onClose()}>
			<PopoverAnchor virtualRef={virtualRef} />
			<PopoverContent
				side="top"
				align="center"
				sideOffset={8}
				className="w-auto max-w-[480px] rounded-lg border border-border bg-background p-1 shadow-md"
				onOpenAutoFocus={(e) => {
					if (!showInput) e.preventDefault();
				}}
			>
				{showInput ? (
					<div className="flex items-center gap-1">
						<Input
							ref={inputRef}
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask about the highlighted text…"
							className="h-8 w-72 border-0 text-sm shadow-none focus-visible:ring-0"
							aria-label="Question about the highlighted text"
						/>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							disabled={!question.trim()}
							onClick={submit}
							aria-label="Send"
						>
							<SendIcon className="size-3.5" />
						</Button>
					</div>
				) : (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="h-8 gap-1.5 px-2.5 font-medium text-sm"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => setShowInput(true)}
					>
						<MessageSquareIcon className="size-3.5" />
						Ask inline
					</Button>
				)}
			</PopoverContent>
		</Popover>
	);
};
