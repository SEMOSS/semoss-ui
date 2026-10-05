import { CircleHelp as HelpOutlineIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Button,
	Label,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/**
 * Standardized styling for all setting sections
 */

export const BaseSettingSection = (props: {
	label: string;
	children: ReactNode;
	wide?: boolean;
	description?: string;
	/** ID of the control named by this section. */
	htmlFor?: string;
}) => {
	return (
		<div className="base-setting-section flex min-w-0 flex-col gap-1">
			<div className="flex min-w-0 items-center gap-1">
				{props.htmlFor ? (
					<Label
						htmlFor={props.htmlFor}
						className="min-w-0 flex-1 font-medium text-foreground text-xs leading-4"
					>
						{props.label}
					</Label>
				) : (
					<Small className="min-w-0 flex-1 font-medium text-foreground text-xs leading-4">
						{props.label}
					</Small>
				)}
				{!!props.description?.length && (
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="size-6 text-muted-foreground"
								aria-label={`${props.label} help`}
							>
								<HelpOutlineIcon
									className="size-4"
									aria-hidden="true"
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{props.description}</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div className="flex w-full min-w-0 flex-row justify-start gap-1">
				{props.children}
			</div>
		</div>
	);
};
