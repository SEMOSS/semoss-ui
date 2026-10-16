import type { ReactElement } from "react";
import { Badge, cn } from "@semoss/ui/next";
import { AUDIT_SEVERITY_LABELS, auditLabel } from "./audit-labels";

/** The dot beside each severity, from routine to the most serious */
const SEVERITY_DOTS: Readonly<Record<string, string>> = {
	LOW: "bg-muted-foreground",
	MEDIUM: "bg-warning",
	HIGH: "bg-destructive",
	CRITICAL: "bg-destructive",
};

export interface AuditSeverityBadgeProps {
	/** The stored severity: LOW, MEDIUM, HIGH or CRITICAL */
	severity: unknown;
}

/** How much an event matters, as a dot in its color beside the word; Critical is filled. */
export function AuditSeverityBadge({
	severity,
}: AuditSeverityBadgeProps): ReactElement {
	const label = auditLabel(AUDIT_SEVERITY_LABELS, severity);
	if (!label) return <span className="text-muted-foreground text-sm">-</span>;
	const isCritical = severity === "CRITICAL";
	return (
		<Badge
			variant={isCritical ? "destructive" : "outline"}
			className="gap-1.5"
		>
			{!isCritical && (
				<span
					className={cn(
						"size-2 rounded-full",
						SEVERITY_DOTS[String(severity)] ??
							"bg-muted-foreground",
					)}
					aria-hidden
				/>
			)}
			{label}
		</Badge>
	);
}
