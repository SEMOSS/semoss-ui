import { HammerIcon, HistoryIcon, PlusIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import { WorkbenchChatComposer } from "./workbench-chat-composer";
import { WorkbenchChatConversations } from "./workbench-chat-conversations";
import { WorkbenchChatSettings } from "./workbench-chat-settings";
import { WorkbenchChatTimeline } from "./workbench-chat-timeline";

/** Which body the panel is currently showing. */
type WorkbenchChatView = "chat" | "conversations" | "settings";

/**
 * The workbench CHAT border panel shell: a header with the room title,
 * conversation-history and settings toggles, and a new-chat action; the body
 * swaps between the chat timeline + composer, conversation history, and chat
 * settings. Toggling an already-active view returns to the chat, and
 * initialization errors surface as a destructive alert under the header.
 *
 * @name WorkbenchChatPanel
 * @return The chat panel shell with its header and active body view.
 */
export const WorkbenchChatPanel = () => {
	const roomName = useWorkbench((state) => state.chat.roomName);
	const initError = useWorkbench((state) => state.chat.initError);
	const isInitializing = useWorkbench((state) => state.chat.isInitializing);
	const isSending = useWorkbench((state) => state.chat.isSending);
	const newRoom = useWorkbench((state) => state.chat.newRoom);
	const onRebuild = useWorkbench((state) => state.chat.onRebuild);
	const [view, setView] = useState<WorkbenchChatView>("chat");
	const [isRebuilding, setIsRebuilding] = useState(false);

	const toggleView = (target: WorkbenchChatView) => {
		setView((current) => (current === target ? "chat" : target));
	};

	const handleRebuild = async () => {
		if (!onRebuild || isRebuilding) return;
		setIsRebuilding(true);
		try {
			await onRebuild();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		} finally {
			setIsRebuilding(false);
		}
	};

	return (
		<div
			className="flex h-full min-h-0 w-full flex-col bg-background"
			data-testid="workbench-chat-panel"
		>
			<header className="flex h-11 shrink-0 items-center gap-2 border-border border-b px-3">
				<h2 className="min-w-0 flex-1 truncate font-medium text-sm">
					{roomName || "New chat"}
				</h2>
				{onRebuild ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Rebuild the app"
								disabled={isRebuilding}
								onClick={() => void handleRebuild()}
							>
								{isRebuilding ? (
									<Spinner className="size-3.5" />
								) : (
									<HammerIcon />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>Rebuild the app</TooltipContent>
					</Tooltip>
				) : null}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Conversation history"
							className={cn(
								view === "conversations" && "bg-accent",
							)}
							onClick={() => toggleView("conversations")}
						>
							<HistoryIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Conversation history</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Chat settings"
							className={cn(view === "settings" && "bg-accent")}
							onClick={() => toggleView("settings")}
						>
							<Settings2Icon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Chat settings</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Start a new chat"
							disabled={isInitializing || isSending}
							onClick={() => {
								void newRoom();
								setView("chat");
							}}
						>
							<PlusIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Start a new chat</TooltipContent>
				</Tooltip>
			</header>

			{initError ? (
				<Alert
					variant="destructive"
					className="m-3 mb-0 w-auto shrink-0"
				>
					<AlertDescription>
						<span className="wrap-break-word">{initError}</span>
					</AlertDescription>
				</Alert>
			) : null}

			{view === "chat" ? (
				<>
					<WorkbenchChatTimeline />
					<WorkbenchChatComposer />
				</>
			) : view === "conversations" ? (
				<WorkbenchChatConversations
					onConversationSelected={() => setView("chat")}
				/>
			) : (
				<WorkbenchChatSettings />
			)}
		</div>
	);
};
