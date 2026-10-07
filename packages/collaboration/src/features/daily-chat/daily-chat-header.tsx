import { CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
	Button,
	cn,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@semoss/ui/next";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { BriefContextRail } from "@/features/dashboard/brief-context-rail";
import { BriefViewSwitch } from "@/features/dashboard/brief-view-switch";
import { dashboardTimeZone } from "@/features/dashboard/dashboard-calendar";

interface DailyChatHeaderProps {
	/** Preserve the current draft while switching to Brief and back. */
	threadId: string;
	/** Saved conversation title, replaced by the greeting for a new chat. */
	title: string;
	/** Profile display name used in the new-chat greeting. */
	userName?: string;
	/** Topic currently associated with this conversation. */
	topicId?: string;
	/** Keep the context drawer available when a workbench replaces the rail. */
	isWorkbenchOpen: boolean;
	/** The new-chat page already offers New Session in the sidebar. */
	isNewChat?: boolean;
}

/** Shared chat identity, explicit new chat action, and responsive access to the brief. */
export function DailyChatHeader({
	threadId,
	title,
	userName,
	topicId,
	isWorkbenchOpen,
	isNewChat = false,
}: DailyChatHeaderProps) {
	const location = useLocation();
	const collaboration = useOptionalCollaborationSession();
	const firstName = userName?.trim().split(/\s+/)[0];
	const profile =
		collaboration?.state.liveProfile ?? collaboration?.state.profile;
	const hour = Number(
		new Intl.DateTimeFormat("en-GB", {
			timeZone: dashboardTimeZone(profile?.timezone ?? ""),
			hour: "numeric",
			hourCycle: "h23",
		}).format(new Date()),
	);
	const greeting =
		hour < 12
			? "Good morning"
			: hour < 18
				? "Good afternoon"
				: "Good evening";
	const [isContextOpen, setIsContextOpen] = useState(false);
	return (
		<CollaborationPageHeader
			className="mb-4 lg:mb-8"
			layoutClassName="flex-col lg:flex-row"
			titleClassName={
				isNewChat ? undefined : "[@media(max-height:40rem)]:text-xl"
			}
			title={
				isNewChat
					? `${greeting}${firstName ? `, ${firstName}` : ""}.`
					: title.trim() || "Assistant"
			}
			description={
				isNewChat ? "What would you like to work on?" : undefined
			}
			actions={
				<>
					<Sheet open={isContextOpen} onOpenChange={setIsContextOpen}>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"pointer-coarse:min-h-11",
									!isWorkbenchOpen && "xl:hidden",
								)}
							>
								<CalendarDays aria-hidden="true" />
								<span className="sr-only sm:not-sr-only">
									Your day
								</span>
							</Button>
						</SheetTrigger>
						<SheetContent className="w-full overflow-y-auto sm:max-w-md">
							<SheetHeader>
								<SheetTitle>Your day</SheetTitle>
								<SheetDescription>
									Your meetings, open actions and handled
									work.
								</SheetDescription>
							</SheetHeader>
							<BriefContextRail topicId={topicId} />
						</SheetContent>
					</Sheet>
					{!isNewChat && (
						<Button
							asChild
							variant="outline"
							className="pointer-coarse:min-h-11"
						>
							<Link to="/new" state={null}>
								<Plus aria-hidden="true" />
								New Session
							</Link>
						</Button>
					)}
					<BriefViewSwitch
						view="chat"
						chatPath={location.pathname}
						chatState={{
							sessionId: threadId,
							topicId,
						}}
					/>
				</>
			}
		/>
	);
}
