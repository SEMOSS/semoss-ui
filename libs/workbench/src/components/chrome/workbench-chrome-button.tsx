import type { ComponentType } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../../constants/workbench.constants";

interface WorkbenchChromeButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** The glyph. Sized by the button, so pass the component, not an element. */
	icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	/** Accessible name, and the tooltip unless `tooltip` overrides it. */
	label: string;
	onClick: () => void;
	disabled?: boolean;
	/** Tooltip text, when it should say more than the accessible name. */
	tooltip?: string;
	/** Extra classes, for a control that needs to sit differently. */
	className?: string;
	/** Stable test selector. */
	"data-testid"?: string;
}

/**
 * An icon button in a panel's chrome — the tab strip, or the header row over an
 * open border body.
 *
 * This is the shape every chrome control was writing by hand: a `Tooltip` around
 * a ghost `Button` at `chromeButton` size, muted until hovered, with an
 * `aria-hidden` glyph at `chromeIcon` size inside. `WORKBENCH_STYLES` already
 * owned the sizes; nothing owned the button, so each control kept its own copy
 * and drifted on `aria-label` and `disabled`. Every panel control now comes
 * from here — reach for it before writing a `Tooltip` in a control again.
 *
 * A control that is not a button — a select, a dialog trigger, a button that
 * needs the click event itself — composes its own thing; this is only for the
 * common case. The shell's own chrome (tabs, rails, border slots) is not a
 * panel control and keeps its own markup.
 */
export const WorkbenchChromeButton = ({
	icon: Icon,
	label,
	onClick,
	disabled,
	tooltip,
	className,
	...otherProps
}: WorkbenchChromeButtonProps) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<Button
				variant="ghost"
				size="icon-sm"
				className={cn(
					"flex-none text-muted-foreground",
					WORKBENCH_STYLES.chromeButton,
					className,
				)}
				disabled={disabled}
				aria-label={label}
				onClick={onClick}
				{...otherProps}
			>
				<Icon aria-hidden className={WORKBENCH_STYLES.chromeIcon} />
			</Button>
		</TooltipTrigger>
		<TooltipContent>{tooltip ?? label}</TooltipContent>
	</Tooltip>
);
