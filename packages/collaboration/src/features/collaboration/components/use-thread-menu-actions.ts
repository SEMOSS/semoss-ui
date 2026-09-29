import {
	Bell,
	BellOff,
	BookOpen,
	Check,
	Clock,
	Link2,
	type LucideIcon,
	MessageSquare,
	PanelRightOpen,
	Plus,
	RotateCcw,
	X,
} from "lucide-react";
import { type RefObject, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
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
}: {
	thread: Thread;
	item?: WorkItem;
	triggerRef: RefObject<HTMLButtonElement | null>;
	onNavigate?: () => void;
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
	const groups: ThreadMenuGroup[] = [
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
