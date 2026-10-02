import { Mail } from "lucide-react";
import {
	createElement,
	useCallback,
	useState,
	useSyncExternalStore,
} from "react";
import { Alert, AlertDescription, Badge, Button, cn, P } from "@semoss/ui/next";
import {
	useWorkbenchControl,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { ThreadMessage } from "@/features/collaboration/components/thread-message";
import { useThreadHistory } from "@/features/collaboration/live/thread-history.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { draftText, plainTextEmail } from "@/features/email/email-html";
import { useFollowScroll } from "@/features/messages/hooks/use-follow-scroll";
import {
	type EmailOrder,
	readEmailOrder,
	rememberEmailOrder,
} from "./email-order";
import { PaneSearch } from "./pane-search";
import { PANE_SEARCH_CLASS, usePaneSearch } from "./use-pane-search";
import { WorkDraftCard } from "./work-draft-card";
import { WorkDraftPreview } from "./work-draft-preview";
import { useWorkEmail } from "./work-email.context";
import { WorkEmailToolbar } from "./work-email-toolbar";
import { WorkPaneCloseControl } from "./work-pane-close-control";
import { WorkSourceEmail } from "./work-source-email";

/** Full source history, with independent reading position and retained draft access. */
export function WorkEmailsPanel({ id }: WorkbenchPanelProps) {
	useWorkbenchControl(id, WorkPaneCloseControl);
	const { thread, workspace, composer, allowedSources } = useWorkEmail();
	const { state } = useCollaborationSession();
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const history = useThreadHistory(thread.id);
	const [order, setOrder] = useState<EmailOrder>(readEmailOrder);
	const handleOrderChange = useCallback((next: EmailOrder) => {
		setOrder(next);
		rememberEmailOrder(next);
	}, []);
	const [collapsed, setCollapsed] = useState<{
		threadId: string;
		ids: ReadonlySet<string>;
	}>(() => ({ threadId: thread.id, ids: new Set() }));
	const handleExpandedChange = useCallback(
		(messageId: string, isExpanded: boolean) => {
			setCollapsed((current) => {
				const ids = new Set(
					current.threadId === thread.id ? current.ids : [],
				);
				if (isExpanded) ids.delete(messageId);
				else ids.add(messageId);
				return { threadId: thread.id, ids };
			});
		},
		[thread.id],
	);
	const handleReveal = useCallback(
		(element: HTMLElement) => {
			const messageId = element.dataset.searchItem;
			if (messageId) handleExpandedChange(messageId, true);
		},
		[handleExpandedChange],
	);
	const search = usePaneSearch(undefined, handleReveal);
	const scroll = useFollowScroll({
		resetKey: thread.id,
		initialFollow: false,
	});
	const { viewportRef } = scroll;
	const { viewportRef: searchRef } = search;
	const handleViewport = useCallback(
		(node: HTMLElement | null) => {
			viewportRef(node);
			searchRef(node);
		},
		[viewportRef, searchRef],
	);
	const isEmail = thread.channel === "email";
	const messages = [...workspace.messages].sort((a, b) => {
		const chronology = a.at.localeCompare(b.at) || a.id.localeCompare(b.id);
		return isEmail && order === "newest" ? -chronology : chronology;
	});
	const workspaceDrafts = workspace.drafts.filter(
		(draft) =>
			!memory.emailDrafts.some(
				(local) => local.seed.id === `workspace:${draft.id}`,
			),
	);
	const draftIds = [
		...memory.emailDrafts.map((draft) => `draft:${draft.seed.id}`),
		...workspaceDrafts.map((draft) => `draft:workspace:${draft.id}`),
	];
	const isItemExpanded = (itemId: string): boolean =>
		collapsed.threadId !== thread.id || !collapsed.ids.has(itemId);
	const setExpanded = (isExpanded: boolean) => {
		setCollapsed({
			threadId: thread.id,
			ids: new Set(
				isExpanded
					? []
					: [...messages.map((message) => message.id), ...draftIds],
			),
		});
	};
	return (
		<div className="flex h-full min-w-0 flex-col">
			{isEmail ? (
				<WorkEmailToolbar
					search={search}
					label={
						history.hasMore
							? "Search loaded emails"
							: "Search emails"
					}
					order={order}
					onOrderChange={handleOrderChange}
					emailCount={messages.length}
					draftCount={draftIds.length}
					onExpandedChange={setExpanded}
				/>
			) : (
				<PaneSearch search={search} label="Search sources" />
			)}
			<section
				ref={handleViewport}
				aria-label={isEmail ? "Email thread" : "Source thread"}
				className={cn(
					"min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:outline-ring",
					isEmail ? "bg-muted/20 p-2" : "p-4",
					PANE_SEARCH_CLASS,
				)}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: the source history supports keyboard scrolling
				tabIndex={0}
			>
				<div
					ref={scroll.contentRef}
					className={cn(isEmail ? "space-y-2" : "space-y-6")}
				>
					{history.isLoading && (
						<output>
							<P>{"Loading emails\u2026"}</P>
						</output>
					)}
					{history.error && (
						<Alert variant="destructive">
							<AlertDescription>
								{history.error}{" "}
								<Button
									variant="outline"
									size="sm"
									onClick={history.retry}
								>
									Retry loading emails
								</Button>
							</AlertDescription>
						</Alert>
					)}
					{history.hasMore &&
						(history.nextCursor ? (
							<Button
								variant="outline"
								disabled={history.isLoading}
								onClick={history.loadOlder}
							>
								Load older emails
							</Button>
						) : (
							<P className="text-muted-foreground">
								Older history is available, but this server does
								not support loading it yet.
							</P>
						))}
					{history.unavailableCount > 0 && (
						<P className="text-muted-foreground">
							{history.unavailableCount} source messages could not
							be read.
						</P>
					)}
					{!messages.length &&
						draftIds.length === 0 &&
						!history.isLoading &&
						!history.error && (
							<P className="text-muted-foreground">
								No source messages are available.
							</P>
						)}
					{messages.map((message) => {
						const person = state.people.find(
							(item) => item.id === message.fromId,
						);
						const name =
							message.fromName ??
							person?.name ??
							thread.participants.find(
								(item) => item.personId === message.fromId,
							)?.name ??
							"Participant";
						const subject =
							message.subject || thread.subject || "Email";
						const text = [
							subject,
							name,
							message.fromAddress ?? person?.email,
							...(message.to ?? []),
							...(message.cc ?? []),
							message.text,
							message.displayBody
								? draftText(
										message.displayBody.content,
										message.displayBody.contentType,
									)
								: "",
						].join(" ");
						return (
							<article
								key={message.id}
								data-scroll-anchor={message.id}
								data-search-item={message.id}
								data-search-text={text}
								className="min-w-0 rounded-lg border border-border bg-background"
							>
								{isEmail ? (
									<WorkSourceEmail
										messageId={message.id}
										showMenu
										disclosure={{
											isExpanded: isItemExpanded(
												message.id,
											),
											onExpandedChange: (isExpanded) =>
												handleExpandedChange(
													message.id,
													isExpanded,
												),
										}}
									/>
								) : (
									<div className="p-4">
										<ThreadMessage
											message={message}
											name={name}
											initials={person?.initials}
											channel={thread.channel}
											isIncluded={allowedSources.has(
												message.id,
											)}
											isEmpty={!message.text}
											isFlat
										/>
									</div>
								)}
							</article>
						);
					})}
					{memory.emailDrafts.map((draft) => (
						<WorkDraftCard
							key={draft.seed.id}
							draft={draft}
							isExpanded={isItemExpanded(
								`draft:${draft.seed.id}`,
							)}
							onExpandedChange={(isExpanded) =>
								handleExpandedChange(
									`draft:${draft.seed.id}`,
									isExpanded,
								)
							}
						/>
					))}
					{workspaceDrafts.map((draft) => (
						<WorkDraftPreview
							key={draft.id}
							itemId={`draft:workspace:${draft.id}`}
							subject={draft.subject || "Email draft"}
							to={draft.to}
							cc={draft.cc}
							body={plainTextEmail(draft.body)}
							status={<Badge variant="secondary">Draft</Badge>}
							isExpanded={isItemExpanded(
								`draft:workspace:${draft.id}`,
							)}
							onExpandedChange={(isExpanded) =>
								handleExpandedChange(
									`draft:workspace:${draft.id}`,
									isExpanded,
								)
							}
							onOpen={() =>
								composer.requestEmailDraft({
									...draft,
									id: `workspace:${draft.id}`,
									mode: "new",
								})
							}
						/>
					))}
				</div>
			</section>
		</div>
	);
}

export const WORK_EMAILS_PANEL: WorkbenchPanelConfig = {
	name: "Emails",
	icon: ({ className }) =>
		createElement(Mail, { className, "aria-hidden": true }),
	canRename: false,
	canClose: false,
	mount: "keepAlive",
	content: WorkEmailsPanel,
};
