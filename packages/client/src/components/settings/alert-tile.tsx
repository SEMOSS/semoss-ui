import type { ReactNode } from "react";
import { P } from "@semoss/ui/next";

interface AlertTileProps {
	/** Icon shown before the title */
	icon: ReactNode;

	/** Name of the setting */
	title: string;

	/** What the setting does */
	description: string;

	/** Control that changes the setting, such as a switch or a button */
	action: ReactNode;

	/** Whether the tile keeps a fixed height and maximum width, as in a column */
	setBounds?: boolean;

	/** Test id of the tile */
	testId?: string;
}

/**
 * One setting as a tile: its icon, title and description, with the control
 * that changes it on the right.
 */
export const AlertTile = ({
	icon,
	title,
	description,
	action,
	setBounds,
	testId,
}: AlertTileProps) => (
	<div
		className={`flex w-full flex-1 items-start gap-4 self-stretch rounded-xl border border--card-foreground p-4 bg-card${setBounds ? "h-[104px] max-w-[600px]" : "h-full"}
			`}
		data-testid={testId}
	>
		<div className="flex flex-1 items-start gap-2">
			<span className="h-5 w-5 text-secondary-foreground [&_svg]:h-5 [&_svg]:w-5">
				{icon}
			</span>
			<div>
				<P className="font-medium">{title}</P>
				<P className="text-muted-foreground text-sm">{description}</P>
			</div>
		</div>
		<div className="pr-2">{action}</div>
	</div>
);
