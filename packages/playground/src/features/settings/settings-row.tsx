import type { ReactNode } from "react";
import { Label, Muted } from "@semoss/ui/next";

/** Props for {@link SettingsRow}. */
export interface SettingsRowProps {
	/** What the setting is called. */
	label: string;
	/** Id of the label, for a control that names itself with `aria-labelledby`. */
	labelId?: string;
	/** Id of the control, for a control the label points at with `htmlFor`. */
	controlId?: string;
	/** A line under the label saying what the setting does. */
	description?: string;
	/** The control that changes the setting. */
	children: ReactNode;
}

/**
 * One setting: its name and description on the start side, its control on the
 * end side, with a divider between rows.
 */
export const SettingsRow = ({
	label,
	labelId,
	controlId,
	description,
	children,
}: SettingsRowProps) => (
	<div className="flex min-w-0 items-center gap-4 border-border border-b py-4 last:border-b-0">
		<div className="flex min-w-0 flex-1 flex-col gap-0.5">
			<Label id={labelId} htmlFor={controlId} className="font-normal">
				{label}
			</Label>
			{description ? <Muted>{description}</Muted> : null}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);
