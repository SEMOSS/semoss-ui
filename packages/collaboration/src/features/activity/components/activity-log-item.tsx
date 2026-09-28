import { ArrowUpRight, ChevronRight, Mail, MessageSquare } from "lucide-react";
import { useId, useState } from "react";
import {
	Badge,
	Button,
	P,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@semoss/ui/next";
import type { ActivityLogEntry } from "../types/activity-log";
import {
	activityNeedsUser,
	activityStatusLabel,
	formatActivityDate,
} from "../utils/activity-log-entries";

interface ActivityLogItemProps {
	/** Available metadata for one message or room summary. */
	entry: ActivityLogEntry;
	/** Opens an existing room; inspecting an item does not create one. */
	onOpenRoom: (roomId: string) => void;
}

/** A compact activity row with the complete record in an accessible detail sheet. */
export function ActivityLogItem({ entry, onOpenRoom }: ActivityLogItemProps) {
	const [isOpen, setIsOpen] = useState(false);
	const descriptionId = useId();
	const SourceIcon = entry.source === "Email" ? Mail : MessageSquare;
	const status = activityStatusLabel(entry);
	const date = entry.receivedAt ?? entry.updatedAt;
	const details = [
		{ label: "ID", value: entry.id },
		{ label: "Topic", value: entry.topic },
		{ label: "Source", value: entry.source },
		{
			label: "Sender",
			value: entry.sender
				? `${entry.sender.name} (${entry.sender.type})`
				: null,
		},
		{ label: "Sender ID", value: entry.sender?.id },
		{ label: "Processing agent", value: entry.agent?.name },
		{ label: "Agent ID", value: entry.agent?.id },
		{ label: "Received", value: formatActivityDate(entry.receivedAt) },
		{ label: "Thread ID", value: entry.threadId },
		{ label: "Processed", value: formatActivityDate(entry.processedAt) },
		{
			label: "Hibernate",
			value:
				entry.isHibernating === null
					? null
					: entry.isHibernating
						? "Yes"
						: "No",
		},
		{
			label: "Deleted",
			value:
				entry.isDeleted === null
					? null
					: entry.isDeleted
						? "Yes"
						: "No",
		},
		{ label: "Room ID", value: entry.roomId ?? "Not linked to a room" },
		{ label: "Last updated", value: formatActivityDate(entry.updatedAt) },
	];

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					aria-label={`View activity: ${entry.topic}`}
					className="h-auto min-h-11 w-full items-start justify-start gap-2 whitespace-normal px-2 py-3 text-left"
				>
					<SourceIcon
						aria-hidden="true"
						className="mt-1 size-4 shrink-0 text-muted-foreground"
					/>
					<span className="min-w-0 flex-1 space-y-1">
						<span className="block break-words font-medium text-sm">
							{entry.topic}
						</span>
						<span className="block break-words font-normal text-muted-foreground text-xs">
							{entry.source} ·{" "}
							{entry.sender?.name ??
								(entry.agent
									? `Agent: ${entry.agent.name}`
									: "Sender not provided")}
						</span>
						<span className="block break-words font-normal text-muted-foreground text-xs">
							{entry.receivedAt ? "Received" : "Updated"}{" "}
							{formatActivityDate(date)}
						</span>
						<Badge
							variant={
								activityNeedsUser(entry)
									? "outline"
									: "secondary"
							}
							className="mt-1 whitespace-normal text-left"
						>
							{status}
						</Badge>
					</span>
					<ChevronRight
						aria-hidden="true"
						className="mt-1 size-4 shrink-0 text-muted-foreground"
					/>
				</Button>
			</SheetTrigger>
			<SheetContent
				aria-describedby={descriptionId}
				className="w-full gap-0 sm:max-w-md [&>button]:size-8 [&>button]:p-2"
			>
				<SheetHeader className="border-border border-b p-6 pr-16">
					<SheetTitle className="break-words">
						{entry.topic}
					</SheetTitle>
					<SheetDescription>
						<span id={descriptionId}>Activity details</span>
					</SheetDescription>
					<Badge variant="secondary" className="mt-2 w-fit">
						{status}
					</Badge>
				</SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-6">
					{entry.preview && (
						<P className="mb-6 whitespace-pre-wrap break-words text-sm">
							{entry.preview}
						</P>
					)}
					<dl className="space-y-4">
						{details.map(({ label, value }) => (
							<div key={label} className="min-w-0">
								<dt className="text-muted-foreground text-xs">
									{label}
								</dt>
								<dd className="mt-1 break-words text-sm">
									{value || "Not provided"}
								</dd>
							</div>
						))}
					</dl>
				</div>
				{entry.roomId && (
					<SheetFooter className="border-border border-t p-4">
						<Button
							type="button"
							className="min-h-11"
							onClick={() => {
								if (!entry.roomId) return;
								setIsOpen(false);
								onOpenRoom(entry.roomId);
							}}
						>
							Open room
							<ArrowUpRight aria-hidden="true" />
						</Button>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
