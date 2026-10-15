import type { LucideIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** Props for {@link ConnectorIconButton}. */
export interface ConnectorIconButtonProps {
	/** The button's icon. */
	icon: LucideIcon;
	/** What the button does, shown as its tooltip. */
	label: string;
	/**
	 * The button's accessible name, when the tooltip alone does not say which
	 * item it acts on. Defaults to the label.
	 */
	ariaLabel?: string;
	/** Runs on click. */
	onClick: () => void;
	/** Stops the button from being used. */
	disabled?: boolean;
	/**
	 * Ignores clicks while keeping the button focusable, for work that is
	 * running, so focus is not lost when it starts.
	 */
	isInactive?: boolean;
	/** Spins the icon, for a refresh that is running. */
	isSpinning?: boolean;
	/** Mirror navigation arrows in right-to-left interfaces. */
	isDirectional?: boolean;
}

/** A small icon button with a tooltip, for a viewer's toolbars. */
export const ConnectorIconButton = ({
	icon: Icon,
	label,
	ariaLabel,
	onClick,
	disabled = false,
	isInactive = false,
	isSpinning = false,
	isDirectional = false,
}: ConnectorIconButtonProps) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label={ariaLabel ?? label}
				disabled={disabled}
				className="size-8 shrink-0 rounded-sm aria-disabled:opacity-50 [@media(pointer:coarse)]:size-9"
				aria-disabled={isInactive || undefined}
				onClick={isInactive ? undefined : onClick}
			>
				<Icon
					aria-hidden
					className={cn(
						isSpinning && "motion-safe:animate-spin",
						isDirectional && "rtl:rotate-180",
					)}
				/>
			</Button>
		</TooltipTrigger>
		<TooltipContent>{label}</TooltipContent>
	</Tooltip>
);
