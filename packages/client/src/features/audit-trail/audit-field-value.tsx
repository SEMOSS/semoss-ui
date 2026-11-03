import type { ReactElement } from "react";
import { JsonViewer } from "@semoss/shared";
import { MultilineCode, P } from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import {
	type AuditEvent,
	type AuditEventColumn,
	formatAuditTime,
	formatAuditValue,
} from "@/api/audit-trail";
import {
	AUDIT_CATEGORY_LABELS,
	AUDIT_TARGET_LABELS,
	auditLabel,
} from "./audit-labels";

const TIME_COLUMNS: AuditEventColumn[] = ["EVENT_TIME", "EVENT_OCCURRED_TIME"];

/** Fields shown as their label rather than the stored value */
const LABELED_COLUMNS: Partial<
	Record<AuditEventColumn, Readonly<Record<string, string>>>
> = {
	CATEGORY: AUDIT_CATEGORY_LABELS,
	TARGET_TYPE: AUDIT_TARGET_LABELS,
};

export interface AuditFieldValueProps {
	/** The field */
	column: AuditEventColumn;
	/** Its recorded value */
	value: AuditEvent[AuditEventColumn] | undefined;
	/** Show the value as a block, as a JSON tree when it is a JSON object */
	isCode: boolean;
}

/**
 * One recorded value of an audit event: a time in UTC, a label, a JSON tree, or
 * text. Values are rendered as text, never as HTML.
 */
export function AuditFieldValue({
	column,
	value,
	isCode,
}: AuditFieldValueProps): ReactElement {
	if (isCode) {
		const parsed =
			typeof value === "string" ? tryParseJson(value) : undefined;
		return parsed !== null && typeof parsed === "object" ? (
			<div className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-2">
				<JsonViewer value={parsed} />
			</div>
		) : (
			<MultilineCode className="block whitespace-pre-wrap break-words bg-muted text-foreground text-sm">
				{formatAuditValue(value ?? null)}
			</MultilineCode>
		);
	}
	const labels = LABELED_COLUMNS[column];
	return (
		<P className="break-words text-sm">
			{TIME_COLUMNS.includes(column)
				? formatAuditTime(value ?? null)
				: labels
					? auditLabel(labels, value)
					: String(value)}
		</P>
	);
}
