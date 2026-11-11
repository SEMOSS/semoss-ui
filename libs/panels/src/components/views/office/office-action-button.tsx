import type { LucideIcon } from "lucide-react";
import { type Ref, useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";

interface OfficeActionButtonProps {
	/** Accessible command name, also shown in the tooltip. */
	label: string;
	icon: LucideIcon;
	disabled?: boolean;
	/** Restores focus to the command after a host-owned workflow closes. */
	buttonRef?: Ref<HTMLButtonElement>;
	/** A public editor operation; rejected operations remain visible to the user. */
	onAction: () => unknown;
}

/** A compact command that retains the canvas selection on pointer activation. */
export const OfficeActionButton = ({
	label,
	icon: Icon,
	disabled,
	buttonRef,
	onAction,
}: OfficeActionButtonProps) => {
	const [isRunning, setIsRunning] = useState(false);
	const handleClick = async (): Promise<void> => {
		setIsRunning(true);
		try {
			await onAction();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		} finally {
			setIsRunning(false);
		}
	};
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					ref={buttonRef}
					type="button"
					size="icon-sm"
					variant="ghost"
					aria-label={label}
					disabled={disabled || isRunning}
					onMouseDown={(event) => event.preventDefault()}
					onClick={() => void handleClick()}
				>
					<Icon aria-hidden="true" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
};
