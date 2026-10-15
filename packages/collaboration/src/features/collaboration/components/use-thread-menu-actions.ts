import {
	Bell,
	BellOff,
	BookOpen,
	Check,
	Clock,
	ExternalLink,
	Link2,
	type LucideIcon,
	PanelRightOpen,
	Plus,
	RotateCcw,
	Sparkles,
	X,
} from "lucide-react";
import { type RefObject, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { threadPath } from "@/lib/workspace-paths";
import type { Thread, WorkItem } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	ignoreThread,
	noResponseNeeded,
	resumeThread,
} from "../work-item-actions";
import { CollaborationSidebarContext } from "./collaboration-sidebar.context";
import { threadUrl } from "./thread-menu.utils";

export interface ThreadMenuAction {
	id: string;
	label: string;
	icon: LucideIcon;
	onSelect: () => void;
	/** Let navigation or the destination dialog own focus. */
	movesFocus?: boolean;
	disabled?: boolean;
}

export interface ThreadMenuGroup {
	id: string;
	label?: string;
	actions: ThreadMenuAction[];
}

/** One action model shared by the pointer menu and the visible overflow button. */
export function useThreadMenuActions({
	thread,
	item,
	triggerRef,
	onNavigate,
	sourceMessageId,
}: {
	thread: Thread;
	item?: WorkItem;
	triggerRef: RefObject<HTMLButtonElement | null>;
	onNavigate?: () => void;
	sourceMessageId?: string;
	isSourceIncluded?: boolean;
}): ThreadMenuGroup[] {
	const { state, dispatch } = useCollaborationSession();
	const location = useLocation();
	const { pathname } = location;
	const isBrain = pathname === "/brain" || pathname.startsWith("/brain/");
	const navigate = useNavigate();
	const sidebar = useContext(CollaborationSidebarContext)?.sidebar;
	const workPath = threadPath(thread.id);
	const brainPath = `/brain/threads/${encodeURIComponent(thread.id)}`;
	const go = (path: string) => {
		void navigate(path);
		onNavigate?.();
	};
	const groups: ThreadMenuGroup[] = [
		{
			id: "open",
			actions: [
				{
					id: "room",
					label: "Open in room",
					icon: Sparkles,
					movesFocus: true,
					onSelect: () => go(workPath),
				},
			],
		},
		{
			id: "navigate",
			actions: [
				...(pathname !== brainPath
					? [
							{
								id: "brain",
								label: "View in Brain",
								icon: BookOpen,
								onSelect: () => go(brainPath),
								movesFocus: true,
							},
						]
					: []),
				...(isBrain && sidebar
					? [
							{
								id: "sidebar",
								label: `Open ${sidebar.title}`,
								icon: PanelRightOpen,
								movesFocus: true,
								onSelect: () => {
									sidebar.open(triggerRef.current);
									onNavigate?.();
								},
							},
						]
					: []),
				{
					id: "copy",
					label: "Copy link",
					icon: Link2,
					onSelect: () => {
						void copyTextToClipboard(
							threadUrl(
								thread.id,
								window.location.href,
								isBrain ? "brain" : "work",
							),
							{
								onSuccess: () =>
									toast.success("Thread link copied"),
								onError: (message) => toast.error(message),
							},
						);
					},
				},
			],
		},
		{
			id: "organize",
			label: "Conversation",
			actions: [
				{
					id: "mute",
					label: thread.muted ? "Resume thread" : "Ignore thread",
					icon: thread.muted ? Bell : BellOff,
					onSelect: () =>
						thread.muted
							? resumeThread(dispatch, thread)
							: ignoreThread(dispatch, thread),
				},
			],
		},
	];
	if (sourceMessageId) {
		const message = state.workspaces[thread.id]?.messages.find(
			(candidate) => candidate.id === sourceMessageId,
		);
		const webLink = safeSourceUrl(
			message?.webLink ||
				(sourceMessageId === thread.source?.nativeId
					? thread.source?.webLink
					: undefined),
		);
		return [
			...groups.filter((group) => group.id === "open"),
			{
				id: "message",
				label: "This email",
				actions: [
					...(webLink
						? [
								{
									id: "outlook",
									label: "Open in Outlook",
									icon: ExternalLink,
									onSelect: () => {
										window.open(
											webLink,
											"_blank",
											"noopener,noreferrer",
										);
									},
								},
								{
									id: "copy-message",
									label: "Copy email link",
									icon: Link2,
									onSelect: () => {
										void copyTextToClipboard(webLink, {
											onSuccess: () =>
												toast.success(
													"Email link copied",
												),
											onError: (message) =>
												toast.error(message),
										});
									},
								},
							]
						: []),
				],
			},
		].filter((group) => group.actions.length > 0);
	}
	if (!isBrain && item?.threadId === thread.id) {
		const update = (
			changes: Partial<Pick<WorkItem, "status" | "suggested">>,
		) => dispatch({ type: "item.update", itemId: item.id, changes });
		groups.push({
			id: "item",
			label: "Work item",
			actions: item.suggested
				? [
						{
							id: "add",
							label: "Add to my list",
							icon: Plus,
							onSelect: () => update({ suggested: false }),
						},
						{
							id: "decline",
							label: "No response needed",
							icon: X,
							onSelect: () => noResponseNeeded(dispatch, item),
						},
					]
				: item.status === "done"
					? [
							{
								id: "reopen",
								label: "Move back",
								icon: RotateCcw,
								onSelect: () => update({ status: "open" }),
							},
						]
					: item.status === "open" || item.status === "waiting"
						? [
								{
									id: "done",
									label: "Done",
									icon: Check,
									onSelect: () => update({ status: "done" }),
								},
								{
									id: "snooze",
									label: "Snooze until tomorrow at 8 AM",
									icon: Clock,
									onSelect: () =>
										update({ status: "snoozed" }),
								},
								{
									id: "dismiss",
									label: "No response needed",
									icon: X,
									onSelect: () =>
										noResponseNeeded(dispatch, item),
								},
							]
						: [],
		});
	}
	return groups.filter((group) => group.actions.length > 0);
}
