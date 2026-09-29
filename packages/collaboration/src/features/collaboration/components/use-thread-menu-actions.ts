import {
	Bell,
	BellOff,
	BookOpen,
	Check,
	Clock,
	ExternalLink,
	FilePenLine,
	Forward,
	Link2,
	type LucideIcon,
	Mail,
	MessageSquare,
	PanelRightOpen,
	Plus,
	Reply,
	RotateCcw,
	Sparkles,
	X,
} from "lucide-react";
import { type RefObject, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import type { ThreadActionRequest } from "@/features/work-thread/thread-action-request";
import type { ThreadWorkbenchRequest } from "@/features/work-thread/thread-workbench-request";
import type { Thread, WorkItem } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
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
	isSourceIncluded = true,
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
	const workPath = `/work/thread/${encodeURIComponent(thread.id)}`;
	const brainPath = `/brain/threads/${encodeURIComponent(thread.id)}`;
	const go = (path: string) => {
		void navigate(path);
		onNavigate?.();
	};
	const openWorkbench = () => {
		const current: unknown = location.state;
		const isCurrentThread = pathname === workPath;
		const request: ThreadWorkbenchRequest = {
			id: crypto.randomUUID(),
			threadId: thread.id,
		};
		void navigate(
			isCurrentThread
				? { pathname, search: location.search, hash: location.hash }
				: workPath,
			{
				replace: isCurrentThread,
				state: {
					...(isCurrentThread &&
					current &&
					typeof current === "object"
						? current
						: {}),
					threadWorkbench: request,
				},
			},
		);
		onNavigate?.();
	};
	const sourceUid =
		thread.source?.kind === "outlook"
			? (sourceMessageId ?? thread.source.nativeId)
			: undefined;
	const requestAction = (action: ThreadActionRequest["action"]) => {
		const current: unknown = location.state;
		const isCurrentThread = pathname === workPath;
		const request: ThreadActionRequest = {
			id: crypto.randomUUID(),
			threadId: thread.id,
			action,
			...((action === "ask" ? sourceMessageId : sourceUid)
				? {
						sourceMessageId:
							action === "ask" ? sourceMessageId : sourceUid,
					}
				: {}),
		};
		void navigate(
			isCurrentThread
				? { pathname, search: location.search, hash: location.hash }
				: workPath,
			{
				replace: isCurrentThread,
				state: {
					...(isCurrentThread &&
					current &&
					typeof current === "object"
						? current
						: {}),
					threadAction: request,
				},
			},
		);
		onNavigate?.();
	};
	const groups: ThreadMenuGroup[] = [
		{
			id: "assistant",
			label: "Assistant",
			actions: [
				{
					id: "ask",
					label: "Ask assistant",
					icon: Sparkles,
					movesFocus: true,
					disabled: Boolean(sourceMessageId) && !isSourceIncluded,
					onSelect: () => requestAction("ask"),
				},
				...(sourceUid
					? [
							{
								id: "draft",
								label: "Draft with assistant",
								icon: FilePenLine,
								movesFocus: true,
								onSelect: () => requestAction("draft"),
							},
						]
					: []),
			],
		},
		...(sourceUid
			? [
					{
						id: "email",
						label: "Email",
						actions: [
							{
								id: "reply",
								label: "Write reply yourself",
								icon: Reply,
								movesFocus: true,
								onSelect: () => requestAction("reply"),
							},
							{
								id: "forward",
								label: "Write forward yourself",
								icon: Forward,
								movesFocus: true,
								onSelect: () => requestAction("forward"),
							},
						],
					},
				]
			: []),
		{
			id: "navigate",
			actions: [
				...(pathname !== workPath
					? [
							{
								id: "work",
								label: "Open in Work",
								icon: MessageSquare,
								onSelect: () => go(workPath),
								movesFocus: true,
							},
						]
					: []),
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
				...(!isBrain
					? [
							{
								id: "workbench",
								label: "Open workbench",
								icon: PanelRightOpen,
								movesFocus: true,
								onSelect: openWorkbench,
							},
						]
					: sidebar
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
			actions: [
				{
					id: "mute",
					label: thread.muted ? "Unmute thread" : "Mute thread",
					icon: thread.muted ? Bell : BellOff,
					onSelect: () =>
						dispatch({
							type: "thread.mute",
							threadId: thread.id,
							muted: !thread.muted,
						}),
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
			...groups.filter(
				(group) => group.id === "assistant" || group.id === "email",
			),
			{
				id: "message",
				label: "This email",
				actions: [
					{
						id: "read",
						label: "Open email",
						icon: Mail,
						movesFocus: true,
						onSelect: () => requestAction("read"),
					},
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
		];
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
							label: "No thanks",
							icon: X,
							onSelect: () => update({ status: "dismissed" }),
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
									label: "Dismiss",
									icon: X,
									onSelect: () =>
										update({ status: "dismissed" }),
								},
							]
						: [],
		});
	}
	if (!isBrain && state.openThreadIds.includes(thread.id))
		groups.push({
			id: "workspace",
			actions: [
				{
					id: "close",
					label: "Close room",
					icon: X,
					movesFocus: pathname === workPath,
					onSelect: () => {
						dispatch({
							type: "workspace.close",
							threadId: thread.id,
						});
						if (pathname === workPath) go("/work");
					},
				},
			],
		});
	return groups.filter((group) => group.actions.length > 0);
}
