import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { getStatusClasses } from "./workflow-editor-utils";

export function StatusIcon({
	status,
	className,
}: {
	status: string;
	className?: string;
}) {
	if (status === "RUNNING" || status === "running") {
		return <Loader2 className={`animate-spin ${className ?? ""}`} />;
	}

	if (
		status === "FAILED" ||
		status === "INTERRUPTED" ||
		status === "CANCELLED" ||
		status === "error"
	) {
		return <XCircle className={className} />;
	}

	if (status === "SUCCESS" || status === "success") {
		return <CheckCircle2 className={className} />;
	}

	return <Clock3 className={className} />;
}

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
