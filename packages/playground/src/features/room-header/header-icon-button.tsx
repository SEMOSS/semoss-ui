import type { ComponentProps } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useIsMobile,
} from "@semoss/ui/next";

/** How long the pointer rests on a header icon before its tooltip shows. */
const HEADER_TOOLTIP_DELAY = 500;

type HeaderIconButtonProps = ComponentProps<typeof Button> & {
	/** The button's accessible name, also shown as its tooltip. */
	label: string;
};

/**
 * An icon button in the room header with its name as a tooltip, sized up for
 * touch on mobile. It passes other props and its ref to the button, so a menu
 * trigger can wrap it with `asChild`.
 */
export const HeaderIconButton = ({
	label,
	className,
	children,
	...props
}: HeaderIconButtonProps) => {
	const isMobile = useIsMobile();
	return (
		<Tooltip delayDuration={HEADER_TOOLTIP_DELAY}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size={isMobile ? "icon-lg" : "icon-sm"}
					aria-label={label}
					className={cn(
						"shrink-0 text-muted-foreground",
						isMobile && "min-h-11 min-w-11",
						className,
					)}
					{...props}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent
				side="bottom"
				sideOffset={6}
				collisionPadding={8}
				arrow={false}
			>
				{label}
			</TooltipContent>
		</Tooltip>
	);
};
