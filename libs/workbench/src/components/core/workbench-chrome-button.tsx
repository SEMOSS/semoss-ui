import type { ComponentType } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "./workbench.constants";

interface WorkbenchChromeButtonProps {
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
 * owned the sizes; nothing owned the button, so twenty-seven files each kept
 * their own copy and drifted on `aria-label` and `disabled`.
 *
 * A control that is not a button — a select, a dialog trigger — composes its
 * own thing; this is only for the common case.
 */
export const WorkbenchChromeButton = ({
	icon: Icon,
	label,
	onClick,
	disabled,
	tooltip,
	className,
	"data-testid": testId,
}: WorkbenchChromeButtonProps) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<Button
				data-testid={testId}
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
			>
				<Icon aria-hidden className={WORKBENCH_STYLES.chromeIcon} />
			</Button>
		</TooltipTrigger>
		<TooltipContent>{tooltip ?? label}</TooltipContent>
	</Tooltip>
);
