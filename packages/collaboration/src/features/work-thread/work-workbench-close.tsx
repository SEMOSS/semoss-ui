import { ArrowLeft, PanelRightClose } from "lucide-react";
import type { Ref } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface WorkWorkbenchCloseProps {
	/** Show the return action when the workbench fills the workspace. */
	isFullWidth: boolean;
	/** Focus destination when entering a full-width workbench. */
	buttonRef: Ref<HTMLButtonElement>;
	/** Conceal the workbench without discarding its panels. */
	onClose: () => void;
}

/** Fixed trailing control in the workbench's top border. */
export function WorkWorkbenchClose({
	isFullWidth,
	buttonRef,
	onClose,
}: WorkWorkbenchCloseProps) {
	const label = isFullWidth ? "Back to conversation" : "Close workbench";
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					ref={buttonRef}
					type="button"
					variant="ghost"
					size={isFullWidth ? "sm" : "icon-sm"}
					className={cn(
						"shrink-0 text-muted-foreground",
						isFullWidth
							? "h-11 gap-2 px-2 text-xs md:h-7"
							: "size-7",
					)}
					aria-label={label}
					onClick={onClose}
				>
					{isFullWidth ? (
						<ArrowLeft aria-hidden="true" className="size-3.5" />
					) : (
						<PanelRightClose
							aria-hidden="true"
							className="size-3.5"
						/>
					)}
					{isFullWidth && "Back to conversation"}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
