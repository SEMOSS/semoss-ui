import { CircleHelp as HelpOutlineIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Muted,
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
	contentClassName?: string;
}) => {
	return (
		<div className="base-setting-section flex flex-col gap-1">
			<div className="flex flex-row items-center gap-1">
				<Muted className="w-full">{props.label}</Muted>
				{!!props.description?.length && (
					<Tooltip>
						<TooltipTrigger asChild>
							<HelpOutlineIcon
								style={{
									width: 15,
									height: 15,
									marginLeft: "5px",
								}}
							/>
						</TooltipTrigger>
						<TooltipContent>{props.description}</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div
				className={
					props.contentClassName ||
					"flex w-full flex-row justify-start gap-1"
				}
			>
				{props.children}
			</div>
		</div>
	);
};
