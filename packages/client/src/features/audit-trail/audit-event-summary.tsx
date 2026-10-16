import type { ReactElement } from "react";
import type { AuditEvent } from "@/api/audit-trail";
import {
	auditText,
	describeAuditAction,
	describeAuditEvent,
} from "./audit-labels";

export interface AuditEventSummaryProps {
	/** The event to describe; a resource owner's view has fewer fields */
	event: Partial<AuditEvent>;
}

/**
 * What happened: the event's name, then what a denied request tried or the
 * action when it differs from the event, and the stored event type, which is
 * what the Event type filter matches.
 */
export function AuditEventSummary({
	event,
}: AuditEventSummaryProps): ReactElement {
	const label =
		describeAuditEvent(event.EVENT_TYPE, event.ACTION, event.STATUS) ||
		"Not recorded";
	const action = describeAuditAction(event.EVENT_TYPE, event.ACTION);
	const eventType = auditText(event.EVENT_TYPE);
	return (
		<span className="flex min-w-0 flex-col">
			<span className="truncate font-medium text-sm" title={label}>
				{label}
			</span>
			{action ? (
				<span
					className="truncate text-muted-foreground text-xs"
					title={action}
				>
					{event.STATUS === "DENIED" ? `Tried ${action}` : action}
				</span>
			) : null}
			{eventType ? (
				<code className="truncate text-muted-foreground text-xs">
					{eventType}
				</code>
			) : null}
		</span>
	);
}
