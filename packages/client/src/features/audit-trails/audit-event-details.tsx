import { useId } from "react";
import {
	Button,
	H3,
	MultilineCode,
	P,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@semoss/ui/next";
import {
	type AuditEvent,
	type AuditEventColumn,
	formatAuditTime,
	formatAuditValue,
} from "@/api/audit-trails";

const TIME_COLUMNS: AuditEventColumn[] = ["EVENT_TIME", "EVENT_OCCURRED_TIME"];

const GROUPS: {
	title: string;
	/** Render values as preformatted JSON/text blocks. */
	code?: boolean;
	fields: [AuditEventColumn, string][];
}[] = [
	{
		title: "Event",
		fields: [
			["EVENT_ID", "Event ID"],
			["EVENT_TIME", "Recorded (UTC)"],
			["EVENT_OCCURRED_TIME", "Occurred (UTC)"],
			["EVENT_TYPE", "Event type"],
			["ACTION", "Action"],
			["STATUS", "Status"],
			["CATEGORY", "Category"],
			["SEVERITY", "Severity"],
		],
	},
	{
		title: "Actor",
		fields: [
			["ACTOR_USER_NAME", "Actor name"],
			["ACTOR_USER_ID", "Actor user ID"],
			["ACTOR_USER_TYPE", "Actor type"],
			["ACTOR_IS_ADMIN", "Actor is admin"],
		],
	},
	{
		title: "Affected user",
		fields: [
			["SUBJECT_USER_NAME", "Affected user name"],
			["SUBJECT_USER_ID", "Affected user ID"],
			["SUBJECT_USER_TYPE", "Affected user type"],
		],
	},
	{
		title: "Request",
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
		title: "Resource",
		fields: [
			["TARGET_TYPE", "Target type"],
			["TARGET_NAME", "Target name"],
			["TARGET_ID", "Target ID"],
			["PROJECT_ID", "Project ID"],
			["ENGINE_ID", "Engine ID"],
			["INSIGHT_ID", "Insight ID"],
			["ROOM_ID", "Room ID"],
		],
	},
	{
		title: "Changes and details",
		code: true,
		fields: [
			["OLD_VALUE", "Previous value"],
			["NEW_VALUE", "New value"],
			["DETAILS", "Details"],
		],
	},
	{
		title: "Failure",
		fields: [
			["ERROR_CODE", "Error code"],
			["ERROR_MESSAGE", "Error message"],
		],
	},
	{
		title: "Source and integrity",
		fields: [
			["SOURCE_APP", "Source application"],
			["SOURCE_MODULE", "Source module"],
			["SOURCE_CLASS", "Source class"],
			["HASH_PREVIOUS", "Previous event hash"],
			["HASH_CURRENT", "Event hash"],
		],
	},
];

interface AuditEventDetailsProps {
	/** Complete event returned by the existing backend. */
	event: AuditEvent;
}

/** Inspect all event fields with a focus-managed, dismissible details sheet. */
export const AuditEventDetails = ({ event }: AuditEventDetailsProps) => {
	const descriptionId = useId();
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-label={`View details for event ${event.EVENT_ID}`}
				>
					View details
				</Button>
			</SheetTrigger>
			<SheetContent
				className="w-full sm:max-w-xl"
				aria-describedby={descriptionId}
			>
				<SheetHeader className="pr-12">
					<SheetTitle>Audit event details</SheetTitle>
					<SheetDescription>
						<span id={descriptionId}>
							Recorded action, actor, affected user, request,
							resource, changes, and failure details.
						</span>
					</SheetDescription>
				</SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto px-4">
					<div className="flex flex-col gap-6 pb-4">
						{GROUPS.map((group) => (
							<section
								key={group.title}
								className="flex flex-col gap-2"
							>
								<H3 className="font-medium text-base">
									{group.title}
								</H3>
								<dl className="flex flex-col gap-4">
									{group.fields.map(([column, label]) => (
										<div key={column} className="min-w-0">
											<dt className="text-muted-foreground text-sm">
												{label}
											</dt>
											<dd className="mt-1 min-w-0">
												{group.code &&
												event[column] !== null &&
												event[column] !== "" ? (
													<MultilineCode className="block whitespace-pre-wrap break-words bg-muted text-foreground text-sm">
														{formatAuditValue(
															event[column],
														)}
													</MultilineCode>
												) : (
													<P className="break-words text-sm">
														{TIME_COLUMNS.includes(
															column,
														)
															? formatAuditTime(
																	event[
																		column
																	],
																)
															: String(
																	event[
																		column
																	] ?? "—",
																)}
													</P>
												)}
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
