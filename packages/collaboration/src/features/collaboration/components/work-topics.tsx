import { ArrowRight, Layers, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	cn,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Small,
} from "@semoss/ui/next";
import {
	formatDateToRelative,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { MailCheckStatus } from "@/features/dashboard/mail-check-status";
import { topicPath } from "@/lib/workspace-paths";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { memoriesAbout } from "../state/memory";
import { CollaborationHeroHeader } from "./collaboration-hero-header";
import { CollaborationHeroPage } from "./collaboration-hero-page";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { TopicDot } from "./topic-dot";
import { TopicEditor } from "./topic-editor";

interface WorkTopicsProps {
	/** Given under Settings, where the list keeps that area's plain page header; without it the list opens on Work's hero. */
	settings?: { title: string; description: string };
}

/** Helper to render stats label with count */
function StatItem({ count, label }: { count: number; label: string }) {
	const textClassName = count === 0 ? "text-muted-foreground/50" : "";
	return (
		<span className={`text-xs ${textClassName}`}>
			{count} {label}
		</span>
	);
}

/** The topics that give each action its purpose, each opening its own page. */
export function WorkTopics({ settings }: WorkTopicsProps) {
	const { state } = useCollaborationSession();
	const [isCreating, setIsCreating] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string[]>([
		"active",
		"dormant",
		"suggested",
	]);
	const [selectedFilterOption, setSelectedFilterOption] = useState<string>(
		"active,dormant,suggested",
	);
	const [accountFilter, setAccountFilter] = useState<string | null>(null);
	const [selectedAccountOption, setSelectedAccountOption] =
		useState<string>("all");
	const createButtonRef = useRef<HTMLButtonElement>(null);

	const topics = state.topics.filter((topic) => {
		const matchesStatus = statusFilter.includes(topic.status);
		const matchesAccount =
			accountFilter === null ||
			accountFilter === "all" ||
			(accountFilter === "none" && topic.accountId === null) ||
			(accountFilter !== "none" && topic.accountId === accountFilter);
		return matchesStatus && matchesAccount;
	});

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
	const list =
		topics.length > 0 ? (
			<ul aria-label="Work topics" className="divide-y divide-border">
				{topics.map((topic) => {
					const open = selectWorkItems(state, {
						topicId: topic.id,
					}).total;
					const waiting = selectWorkItems(state, {
						topicId: topic.id,
						view: "waiting",
					}).total;
					const memories = memoriesAbout(state.memories, {
						type: "topic",
						id: topic.id,
					}).length;
					const relativeDate = topic.stats.lastActivity
						? formatDateToRelative(
								parseTimestampWithUtcDefault(
									topic.stats.lastActivity,
								),
							)
						: "";
					return (
						<li key={topic.id}>
							<Link
								to={topicPath(topic.id)}
								className={cn(
									"flex min-w-0 flex-col gap-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:items-start",
									// Settings' card has no padding of its own; the hero's card does, so its rows only reach a little past the text
									settings
										? "focus-visible:-outline-offset-2 p-5 md:px-6"
										: "-mx-2 rounded-lg px-2 py-4",
								)}
							>
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<TopicDot topic={topic} />
										<Small className="break-words font-medium text-base">
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
										{topic.description ||
											"No description yet."}
									</P>
									<div className="flex flex-wrap gap-4 pt-1 text-muted-foreground text-xs">
										<StatItem
											count={topic.stats.threads}
											label="Threads"
										/>
										<StatItem
											count={topic.stats.chats}
											label="Chats"
										/>
										<StatItem
											count={topic.files?.length ?? 0}
											label="Files"
										/>
										<StatItem
											count={memories}
											label="Memories"
										/>
									</div>
								</div>
								<div className="flex shrink-0 flex-col items-end gap-2">
									<div className="flex shrink-0 items-center gap-4 text-muted-foreground text-sm tabular-nums">
										<span>{open} open</span>
										<span>{waiting} waiting</span>
										<ArrowRight
											aria-hidden="true"
											className="ml-auto size-4"
										/>
									</div>
									{relativeDate && (
										<div className="text-muted-foreground text-xs">
											<span>Last activity </span>
											<span
												title={new Date(
													topic.stats.lastActivity,
												).toLocaleString()}
												className="font-medium"
											>
												{relativeDate}
											</span>
										</div>
									)}
								</div>
							</Link>
						</li>
					);
				})}
			</ul>
		) : state.topics.length === 0 ? (
			<div className={cn("space-y-2", settings && "p-6")}>
				<P>No topics yet.</P>
				<P className="text-muted-foreground text-sm">
					Create a topic to organize your work, or open All work to
					see unfiled actions.
				</P>
			</div>
		) : null;
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
				<div className="border-border border-b">
					<div className="flex flex-wrap items-center gap-3 p-4 sm:px-6">
						<div className="flex items-center gap-2">
							<Small className="font-medium">Status:</Small>
							<Select
								value={selectedFilterOption}
								onValueChange={(value) => {
									setSelectedFilterOption(value);
									if (value === "all") {
										setStatusFilter([
											"active",
											"dormant",
											"suggested",
											"archived",
										]);
									} else if (
										value === "active,dormant,suggested"
									) {
										setStatusFilter([
											"active",
											"dormant",
											"suggested",
										]);
									} else {
										setStatusFilter([value]);
									}
								}}
							>
								<SelectTrigger className="w-56">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active,dormant,suggested">
										All except Archived
									</SelectItem>
									<SelectItem value="active">
										Active
									</SelectItem>
									<SelectItem value="dormant">
										Hibernate
									</SelectItem>
									<SelectItem value="suggested">
										Suggested
									</SelectItem>
									<SelectItem value="archived">
										Archived
									</SelectItem>
									<SelectItem value="all">All</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<Small className="font-medium">Account:</Small>
							<Select
								value={selectedAccountOption}
								onValueChange={(value) => {
									setSelectedAccountOption(value);
									if (value === "all") {
										setAccountFilter(null);
									} else {
										setAccountFilter(value);
									}
								}}
							>
								<SelectTrigger className="w-56">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="max-h-72 overflow-y-auto">
									<SelectItem value="all">
										All accounts
									</SelectItem>
									<SelectItem value="none">
										No account
									</SelectItem>
									{state.accounts.map((account) => (
										<SelectItem
											key={account.id}
											value={account.id}
										>
											{account.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
				{topics.length ? (
					list
				) : (
					<div className={cn("space-y-3", settings && "p-6")}>
						<P className="font-medium">
							No topics match your filters.
						</P>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSelectedFilterOption(
									"active,dormant,suggested",
								);
								setStatusFilter([
									"active",
									"dormant",
									"suggested",
								]);
								setSelectedAccountOption("all");
								setAccountFilter(null);
							}}
						>
							Clear filters
						</Button>
					</div>
				)}
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
