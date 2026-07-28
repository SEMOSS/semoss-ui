import { getStatusClasses } from "./automation-editor-utils";
import { StatusIcon } from "./status-icon";

export function StatusBadge({ status }: { status: string }) {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-[11px] ${getStatusClasses(status)}`}
		>
			<StatusIcon status={status} className="h-3 w-3" />
			{status}
		</span>
	);
}
