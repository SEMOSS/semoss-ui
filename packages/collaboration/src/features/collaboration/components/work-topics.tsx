import { ArrowRight, Layers, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, cn, P, Separator, Small } from "@semoss/ui/next";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { MailCheckStatus } from "@/features/dashboard/mail-check-status";
import { topicPath } from "@/lib/workspace-paths";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { CollaborationHeroHeader } from "./collaboration-hero-header";
import { CollaborationHeroPage } from "./collaboration-hero-page";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { TopicEditor } from "./topic-editor";

interface WorkTopicsProps {
	/** Given under Settings, where the list keeps that area's plain page header; without it the list opens on Work's hero. */
	settings?: { title: string; description: string };
}

/** The topics that give each action its purpose, each opening its own page. */
export function WorkTopics({ settings }: WorkTopicsProps) {
	const { state } = useCollaborationSession();
	const [isCreating, setIsCreating] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics.filter((topic) => topic.status !== "archived");

	const create = (
		<Button
			ref={createButtonRef}
			size="sm"
			className="pointer-coarse:min-h-11"
			onClick={() => setIsCreating(true)}
		>
			<Plus aria-hidden="true" /> New topic
		</Button>
	);
	const list = topics.length ? (
		<ul aria-label="Work topics" className="divide-y divide-border">
			{topics.map((topic) => {
				const open = selectWorkItems(state, {
					topicId: topic.id,
				}).total;
				const waiting = selectWorkItems(state, {
					topicId: topic.id,
					view: "waiting",
				}).total;
				return (
					<li key={topic.id}>
						<Link
							to={topicPath(topic.id)}
							className={cn(
								"flex min-w-0 flex-col gap-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:items-center",
								// Settings' card has no padding of its own; the hero's card does, so its rows only reach a little past the text
								settings
									? "focus-visible:-outline-offset-2 p-5 md:px-6"
									: "-mx-2 rounded-lg px-2 py-4",
							)}
						>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<Small className="break-words font-medium text-base">
										{/* inside the name's first line, so a long name wraps beside its dot, not under it */}
										<span
											aria-hidden="true"
											className={cn(
												"mr-2 inline-block size-2 rounded-full align-middle",
												topicTone(topic.id),
											)}
										/>
										{topic.name}
									</Small>
									<Badge
										variant="outline"
										className="font-normal capitalize"
									>
										{topic.status}
									</Badge>
									{topic.isSample && (
										<Badge variant="secondary">
											Sample
										</Badge>
									)}
								</div>
								<P className="max-w-prose break-words text-muted-foreground text-sm leading-relaxed">
									{topic.description || "No description yet."}
								</P>
							</div>
							<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm tabular-nums">
								<span>{open} open</span>
								<span>{waiting} waiting</span>
								<ArrowRight
									aria-hidden="true"
									className="ml-auto size-4"
								/>
							</div>
						</Link>
					</li>
				);
			})}
		</ul>
	) : (
		<div className={cn("space-y-2", settings && "p-6")}>
			<P>No topics yet.</P>
			<P className="text-muted-foreground text-sm">
				Create a topic to organize your work, or open All work to see
				unfiled actions.
			</P>
		</div>
	);
	const editor = isCreating && (
		<TopicEditor
			returnFocusRef={createButtonRef}
			onClose={() => setIsCreating(false)}
		/>
	);

	if (settings)
		return (
			<CollaborationSurface
				header={
					<CollaborationPageHeader
						layoutClassName="flex-col sm:flex-row"
						title={settings.title}
						description={settings.description}
						actions={
							<>
								<Button
									asChild
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11"
								>
									<Link to="/work">All work</Link>
								</Button>
								{create}
							</>
						}
					>
						<WorkRefreshStatus />
					</CollaborationPageHeader>
				}
			>
				{list}
				{editor}
			</CollaborationSurface>
		);

	return (
		<CollaborationHeroPage>
			<CollaborationHeroHeader
				title="Your topics."
				description="Choose a topic to focus on its actions, threads, and sessions."
			>
				<MailCheckStatus />
				<Separator
					orientation="vertical"
					className="data-[orientation=vertical]:h-4"
				/>
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="pointer-coarse:min-h-11 text-foreground"
				>
					<Link to="/work">
						<Layers aria-hidden="true" />
						All work
					</Link>
				</Button>
			</CollaborationHeroHeader>
			<BriefPanel
				title="All topics"
				count={topics.length}
				detail={create}
			>
				{list}
			</BriefPanel>
			{editor}
		</CollaborationHeroPage>
	);
}
