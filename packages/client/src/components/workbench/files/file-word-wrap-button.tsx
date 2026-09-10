import { WrapTextIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toggleCodeEditorWordWrap,
	useCodeEditorWordWrap,
} from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";

/**
 * Word-wrap toggle for a file editor's chrome.
 *
 * The preference is shared by every editor, so this subscribes to it directly
 * rather than reading the panel's `value` — a chrome control renders in its own
 * subtree and would otherwise show a stale flag.
 */
export const FileWordWrapButton: FC = () => {
	const wordWrap = useCodeEditorWordWrap();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					data-testid="file-word-wrap-button"
					variant="ghost"
					size="icon-sm"
					className={cn(
						"flex-none",
						wordWrap ? "text-foreground" : "text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
					aria-label="Toggle word wrap"
					aria-pressed={wordWrap}
					onClick={() => toggleCodeEditorWordWrap()}
				>
					<WrapTextIcon
						aria-hidden
						className={WORKBENCH_STYLES.chromeIcon}
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{wordWrap ? "Disable word wrap" : "Enable word wrap"}
			</TooltipContent>
		</Tooltip>
	);
};
