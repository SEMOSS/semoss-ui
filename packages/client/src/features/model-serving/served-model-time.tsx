import type { ReactElement } from "react";
import {
	formatDateToRelative,
	formatLocalDateTime,
} from "@semoss/utility/date";

export interface ServedModelTimeProps {
	/** An ISO instant from the backend, such as "2026-10-27T17:00:00Z" */
	value: string;
}

/** A time as "5 minutes ago", with the full local date on hover. */
export function ServedModelTime({ value }: ServedModelTimeProps): ReactElement {
	return (
		<time dateTime={value} title={formatLocalDateTime(value) ?? undefined}>
			{formatDateToRelative(value) ?? value}
		</time>
	);
}
