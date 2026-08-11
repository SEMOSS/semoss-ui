import { CopyIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Notebook, validateNotebook } from "@semoss/shared";
import {
	Button,
	Code,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { copyToClipboard } from "@/utility/clipboard";
import { BlockHeader } from "./block-header";

interface NotebookPreviewBlockProps {
	/** Raw `.ipynb` JSON from the fenced block. */
	content: string;
	/** True while the message chunk is still streaming (JSON may be incomplete). */
	isLoading?: boolean;
	/** Room store; interactive editing/running requires an active room. */
	room?: RoomStore;
}

/**
 * A chat block that renders a fenced `.ipynb` payload as the interactive shared
 * Notebook (run cells, edit, save to the room). Falls back to a read-only JSON
 * view while streaming, when the JSON can't be parsed, or without a room.
 */
export const NotebookPreviewBlock = ({
	content,
	isLoading,
	room,
}: NotebookPreviewBlockProps) => {
	const { t } = useTranslation("chat");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	// Stable default target for the Notebook's Save action within the room.
	const pathRef = useRef(`chat-notebook-${Date.now()}.ipynb`);

	// Only mount the interactive Notebook once the JSON parses cleanly; while
	// streaming the payload is incomplete, so validation fails and we show JSON.
	const isValidNotebook = useMemo(() => {
		if (isLoading) {
			return false;
		}
		try {
			validateNotebook(content);
			return true;
		} catch {
			return false;
		}
	}, [content, isLoading]);

	const showNotebook = isValidNotebook && !!room && !isRaw;

	return (
		<div className="relative overflow-hidden rounded-md border border-border bg-background">
			<BlockHeader
				label="Notebook"
				isCollapsed={isCollapsed}
				onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
				collapseDisabled={!content}
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
							variant="ghost"
							size="sm"
							disabled={!showNotebook}
							aria-label={
								isExpanded
									? "Collapse notebook height"
									: "Expand notebook height"
							}
							onClick={() => setIsExpanded((prev) => !prev)}
						>
							{isExpanded ? (
								<Minimize2Icon className="size-3" />
							) : (
								<Maximize2Icon className="size-3" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{isExpanded ? "Shrink" : "Expand"}
					</TooltipContent>
				</Tooltip>
				<Button
					className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
					variant="ghost"
					size="sm"
					disabled={!isValidNotebook || !room}
					onClick={() => setIsRaw((prev) => !prev)}
				>
					{isRaw ? "Notebook" : "Raw"}
				</Button>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
							variant="ghost"
							size="sm"
							disabled={!content}
							aria-label="Copy notebook"
							onClick={() =>
								void copyToClipboard(
									content,
									() =>
										toast.success(
											t("notifications.copySuccess"),
										),
									(msg) => toast.error(msg),
								)
							}
						>
							<CopyIcon className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Copy</TooltipContent>
				</Tooltip>
			</BlockHeader>
			{!isCollapsed &&
				(showNotebook ? (
					<div className={isExpanded ? "h-[85vh]" : "h-[60vh]"}>
						<Notebook
							content={content}
							mode={{ type: "INSIGHT" }}
							path={pathRef.current}
						/>
					</div>
				) : (
					<div className="p-3">
						<Code code={content} language="json" />
					</div>
				))}
		</div>
	);
};
