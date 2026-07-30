import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";

export interface StatusIconProps {
	/** Run/node status to render an icon for */
	status: string;
	/** Additional className applied to the rendered icon */
	className?: string;
}

export function StatusIcon({ status, className }: StatusIconProps) {
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
