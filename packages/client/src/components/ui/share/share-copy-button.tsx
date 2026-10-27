import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";

/** How long the button shows a check after a copy */
const COPIED_RESET_MS = 2000;

export interface ShareCopyButtonProps {
	/** The text the button copies */
	text: string;
	/** The button's name and tooltip, such as "Copy link" */
	label: string;
	/** Shown in the toast after a copy, such as "Copied the link" */
	successMessage: string;
	/** data-testid of the button */
	testId: string;
}

/**
 * An icon button beside a share field that copies the field's text. Its icon
 * turns into a check for a moment after a copy.
 */
export const ShareCopyButton = ({
	text,
	label,
	successMessage,
	testId,
}: ShareCopyButtonProps) => {
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		if (!isCopied) {
			return;
		}
		const timer = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
		return () => clearTimeout(timer);
	}, [isCopied]);

	const handleCopy = () =>
		copyTextToClipboard(text, {
			onSuccess: () => {
				setIsCopied(true);
				toast.success(successMessage);
			},
			onError: (message) => toast.error(message),
		});

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="icon"
					aria-label={label}
					onClick={() => void handleCopy()}
					data-testid={testId}
				>
					{isCopied ? <Check aria-hidden /> : <Copy aria-hidden />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{isCopied ? "Copied" : label}</TooltipContent>
		</Tooltip>
	);
};
