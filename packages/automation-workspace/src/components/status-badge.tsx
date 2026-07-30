import { getStatusClasses } from "../domain/automation-display";
import { StatusIcon } from "./status-icon";

export interface StatusBadgeProps {
	/** Run/node status to render (e.g. RUNNING, SUCCESS, FAILED) */
	status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-[11px] ${getStatusClasses(status)}`}
		>
			<StatusIcon status={status} className="h-3 w-3" />
			{status}
		</span>
	);
}
