import { ArrowRight, Inbox, Search } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router";
import {
	Button,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { sessionsPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import type { ActivityLogEntry } from "../types/activity-log";
import {
	activityEntriesFromSessions,
	activityNeedsUser,
	compareActivityEntries,
} from "../utils/activity-log-entries";
import { ActivityLogItem } from "./activity-log-item";

interface WorkspaceTasksPanelProps {
	/** Agents used to label room activity. */
	agents: readonly Agent[];
	/** Current workspace sessions, owned by the application shell. */
	sessions: readonly Session[];
	/** Message-level records when supplied; otherwise show known room activity. */
	entries?: readonly ActivityLogEntry[];
	/** Opens an existing room through workspace navigation. */
	onOpenRoom: (roomId: string) => void;
}

/** A response-focused activity log with searchable records and detail sheets. */
export function WorkspaceTasksPanel({
	agents,
	sessions,
	entries,
	onOpenRoom,
}: WorkspaceTasksPanelProps) {
	const headingId = useId();
	const [view, setView] = useState("needs-you");
	const [search, setSearch] = useState("");
	const items = [
		...(entries ?? activityEntriesFromSessions(agents, sessions)),
	].sort(compareActivityEntries);
	const pendingCount = items.filter(activityNeedsUser).length;
	const query = search.trim().toLocaleLowerCase();
	const visibleItems = items.filter(
		(entry) =>
			(view === "all" || activityNeedsUser(entry)) &&
			(!query ||
				[
					entry.topic,
					entry.preview,
					entry.sender?.name,
					entry.agent?.name,
					entry.threadId,
					entry.roomId,
					entry.id,
				].some((value) => value?.toLocaleLowerCase().includes(query))),
	);

	return (
		<aside
			aria-labelledby={headingId}
			className="w-full min-w-0 shrink-0 border-border border-t bg-muted/20 p-4 md:p-6 xl:w-80 xl:border-t-0 xl:border-l"
		>
			<H3 id={headingId} className="font-medium text-base">
				Activity log
			</H3>
			<P className="mt-1 text-muted-foreground text-sm">
				Your responses and pending items
			</P>
			<Tabs value={view} onValueChange={setView} className="mt-4 gap-4">
				<TabsList aria-label="Activity view" className="w-full">
					<TabsTrigger value="needs-you" className="min-w-0 flex-1">
						Needs you{" "}
						<span className="text-xs tabular-nums">
							{pendingCount}
						</span>
					</TabsTrigger>
					<TabsTrigger value="all" className="min-w-0 flex-1">
						All activity
					</TabsTrigger>
				</TabsList>
				<InputGroup>
					<InputGroupAddon>
						<Search aria-hidden="true" className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search activity log"
						placeholder="Search activity…"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>
				<TabsContent value={view} className="min-w-0">
					{visibleItems.length > 0 ? (
						<ul className="max-h-96 divide-y divide-border overflow-y-auto">
							{visibleItems.map((entry) => (
								<li key={entry.key}>
									<ActivityLogItem
										entry={entry}
										onOpenRoom={onOpenRoom}
									/>
								</li>
							))}
						</ul>
					) : (
						<div className="flex flex-col items-center gap-2 py-8 text-center">
							<Inbox
								aria-hidden="true"
								className="size-5 text-muted-foreground"
							/>
							<P className="font-medium text-sm">
								{query
									? "No matching activity"
									: view === "needs-you"
										? "Nothing needs your response"
										: "No activity yet"}
							</P>
							<P className="text-muted-foreground text-sm">
								{query
									? "Try a different topic, sender, or thread."
									: view === "needs-you"
										? "Items that need your reply or review will appear here."
										: "Your conversations and linked messages will appear here."}
							</P>
							{query ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setSearch("")}
								>
									Clear search
								</Button>
							) : view === "needs-you" && items.length > 0 ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setView("all")}
								>
									View all activity
								</Button>
							) : null}
						</div>
					)}
					<output className="sr-only">
						{visibleItems.length} activity{" "}
						{visibleItems.length === 1 ? "item" : "items"} shown
					</output>
				</TabsContent>
			</Tabs>
			<div className="mt-4 border-border border-t pt-2">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="w-full justify-between"
				>
					<Link to={sessionsPath()}>
						View all sessions
						<ArrowRight aria-hidden="true" />
					</Link>
				</Button>
			</div>
		</aside>
	);
}
