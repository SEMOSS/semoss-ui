import type { LucideIcon } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface ModelChatActionButtonProps {
	/** What the button does, as its accessible name and its tooltip. */
	label: string;
	/** The button's icon. */
	icon: LucideIcon;
	/** Runs the action. */
	onClick: () => void;
	/** Whether the action is unavailable. */
	disabled?: boolean;
}

/**
 * An icon-only action on a model chat message, named in a tooltip.
 *
 * @name ModelChatActionButton
 * @return The action button.
 */
export const ModelChatActionButton = ({
	label,
	icon: Icon,
	onClick,
	disabled,
}: ModelChatActionButtonProps) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label={label}
				disabled={disabled}
				onClick={onClick}
			>
				<Icon className="size-3.5" aria-hidden />
			</Button>
		</TooltipTrigger>
		<TooltipContent>{label}</TooltipContent>
	</Tooltip>
);
