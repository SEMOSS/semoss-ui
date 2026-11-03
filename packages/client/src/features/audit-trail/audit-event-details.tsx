import { PanelRightOpen } from "lucide-react";
import { useId } from "react";
import {
	Button,
	H3,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	type AuditEvent,
	type AuditEventColumn,
	formatAuditTime,
} from "@/api/audit-trail";
import { AuditEventSummary } from "./audit-event-summary";
import { AuditFieldValue } from "./audit-field-value";
import { AuditIdentity } from "./audit-identity";
import { auditText } from "./audit-labels";
import { AuditSeverityBadge } from "./audit-severity-badge";
import { AuditStatusBadge } from "./audit-status-badge";
import { AuditTarget } from "./audit-target";

interface FieldGroup {
	/** The section's heading */
	title: string;
	/** Values are JSON or long text, shown as a block */
	isCode?: boolean;
	/** Only admins see the section; a resource owner's view leaves it out */
	isAdminOnly?: boolean;
	/** The fields of the section, with their labels */
	fields: [AuditEventColumn, string][];
}

const GROUPS: FieldGroup[] = [
	{
		title: "Event",
		fields: [
			["EVENT_ID", "Event ID"],
			["EVENT_TIME", "Recorded (UTC)"],
			["EVENT_OCCURRED_TIME", "Occurred (UTC)"],
			["ACTION", "Action"],
			["CATEGORY", "Category"],
		],
	},
	{
		title: "Resource",
		fields: [
			["TARGET_ID", "Target ID"],
			["PROJECT_ID", "Project ID"],
			["ENGINE_ID", "Engine ID"],
			["INSIGHT_ID", "Insight ID"],
			["ROOM_ID", "Room ID"],
		],
	},
	{
		title: "Changes and details",
		isCode: true,
		fields: [
			["OLD_VALUE", "Previous value"],
			["NEW_VALUE", "New value"],
			["DETAILS", "Details"],
		],
	},
	{
		title: "Failure",
		isAdminOnly: true,
		fields: [
			["ERROR_CODE", "Error code"],
			["ERROR_MESSAGE", "Error message"],
		],
	},
	{
		title: "Request",
		isAdminOnly: true,
		fields: [
			["SESSION_ID_HASH", "Session ID hash"],
			["REQUEST_ID", "Request ID"],
			["IP_ADDR", "IP address"],
			["USER_AGENT", "User agent"],
			["HTTP_METHOD", "HTTP method"],
			["REQUEST_PATH", "Request path"],
			["HTTP_STATUS", "HTTP status"],
		],
	},
	{
		title: "Source and integrity",
		isAdminOnly: true,
		fields: [
			["SOURCE_APP", "Source application"],
			["SOURCE_MODULE", "Source module"],
			["SOURCE_CLASS", "Source class"],
			["HASH_PREVIOUS", "Previous event hash"],
			["HASH_CURRENT", "Event hash"],
		],
	},
];

/** Whether an event recorded a value for the field */
function isRecorded(value: AuditEvent[AuditEventColumn] | undefined): boolean {
	return value !== null && value !== undefined && value !== "";
}

/**
 * The fields of a section the event recorded, leaving out the time it occurred
 * when it is the time it was recorded.
 */
function recordedFields(
	group: FieldGroup,
	event: Partial<AuditEvent>,
): [AuditEventColumn, string][] {
	return group.fields.filter(
		([column]) =>
			isRecorded(event[column]) &&
			!(
				column === "EVENT_OCCURRED_TIME" &&
				event.EVENT_OCCURRED_TIME === event.EVENT_TIME
			),
	);
}

export interface AuditEventDetailsProps {
	/** Complete admin event or reduced resource-owner projection. */
	event: Partial<AuditEvent>;
	/** Omit administrative request, source, and failure diagnostics. */
	resourceScoped?: boolean;
}

/**
 * Inspect an event in a focus-managed, dismissible sheet: what happened and
 * how it ended, who did it and whom it was for, what it was on, and every
 * other field the event recorded.
 */
export const AuditEventDetails = ({
	event,
	resourceScoped = false,
}: AuditEventDetailsProps) => {
	const descriptionId = useId();
	const groups = GROUPS.filter(
		(group) => !resourceScoped || !group.isAdminOnly,
	)
		.map((group) => ({ group, fields: recordedFields(group, event) }))
		.filter(({ fields }) => fields.length > 0);
	return (
		<Sheet>
			<Tooltip>
				<TooltipTrigger asChild>
					<SheetTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="text-muted-foreground hover:text-foreground"
							aria-label={`View details for event ${event.EVENT_ID}`}
						>
							<PanelRightOpen aria-hidden="true" />
						</Button>
					</SheetTrigger>
				</TooltipTrigger>
				<TooltipContent side="left" sideOffset={4}>
					View details
				</TooltipContent>
			</Tooltip>
			<SheetContent
				className="w-full sm:max-w-xl"
				aria-describedby={descriptionId}
			>
				<SheetHeader className="pr-12">
					<SheetTitle>Audit event details</SheetTitle>
					<SheetDescription>
						<span id={descriptionId}>
							{formatAuditTime(event.EVENT_TIME ?? null)} (UTC)
						</span>
					</SheetDescription>
				</SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto px-4">
					<div className="flex flex-col gap-6 pb-4">
						<section className="flex flex-col gap-3 rounded-md border p-3">
							<AuditEventSummary event={event} />
							<div className="flex flex-wrap gap-2">
								<AuditStatusBadge status={event.STATUS} />
								<AuditSeverityBadge severity={event.SEVERITY} />
							</div>
						</section>
						<section className="grid gap-4 sm:grid-cols-2">
							<div className="flex min-w-0 flex-col gap-2">
								<H3 className="font-medium text-base">Actor</H3>
								<AuditIdentity
									id={auditText(event.ACTOR_USER_ID)}
									type={auditText(event.ACTOR_USER_TYPE)}
									name={auditText(event.ACTOR_USER_NAME)}
									isAdmin={event.ACTOR_IS_ADMIN === true}
								/>
							</div>
							<div className="flex min-w-0 flex-col gap-2">
								<H3 className="font-medium text-base">
									Affected user
								</H3>
								<AuditIdentity
									id={auditText(event.SUBJECT_USER_ID)}
									type={auditText(event.SUBJECT_USER_TYPE)}
									name={auditText(event.SUBJECT_USER_NAME)}
									emptyLabel="No one"
								/>
							</div>
						</section>
						<section className="flex flex-col gap-2">
							<H3 className="font-medium text-base">On</H3>
							<AuditTarget event={event} />
						</section>
						{groups.map(({ group, fields }) => (
							<section
								key={group.title}
								className="flex flex-col gap-2"
							>
								<H3 className="font-medium text-base">
									{group.title}
								</H3>
								<dl
									className={
										group.isCode
											? "flex flex-col gap-4"
											: "grid gap-x-4 gap-y-3 sm:grid-cols-2"
									}
								>
									{fields.map(([column, label]) => (
										<div key={column} className="min-w-0">
											<dt className="text-muted-foreground text-sm">
												{label}
											</dt>
											<dd className="mt-1 min-w-0">
												<AuditFieldValue
													column={column}
													value={event[column]}
													isCode={Boolean(
														group.isCode,
													)}
												/>
											</dd>
										</div>
									))}
								</dl>
							</section>
						))}
					</div>
				</div>
				<SheetFooter>
					<SheetClose asChild>
						<Button type="button" variant="outline">
							Close details
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
};
