import {
	CircleCheck,
	CircleQuestionMark,
	CircleX,
	ShieldX,
	TriangleAlert,
} from "lucide-react";
import type { ReactElement } from "react";
import { Badge } from "@semoss/ui/next";
import { AUDIT_STATUS_LABELS, auditLabel } from "./audit-labels";

export interface AuditStatusBadgeProps {
	/** The stored outcome: SUCCESS, FAILURE, DENIED or ERROR */
	status: unknown;
}

/** How an event ended, as an icon in its status color beside the word. */
export function AuditStatusBadge({
	status,
}: AuditStatusBadgeProps): ReactElement {
	const label = auditLabel(AUDIT_STATUS_LABELS, status) || "Unknown";
	return (
		<Badge variant="outline" className="gap-1">
			{status === "SUCCESS" ? (
				<CircleCheck className="size-3.5 text-success" aria-hidden />
			) : status === "DENIED" ? (
				<ShieldX className="size-3.5 text-destructive" aria-hidden />
			) : status === "FAILURE" ? (
				<CircleX className="size-3.5 text-destructive" aria-hidden />
			) : status === "ERROR" ? (
				<TriangleAlert
					className="size-3.5 text-destructive"
					aria-hidden
				/>
			) : (
				<CircleQuestionMark
					className="size-3.5 text-muted-foreground"
					aria-hidden
				/>
			)}
			{label}
		</Badge>
	);
}
