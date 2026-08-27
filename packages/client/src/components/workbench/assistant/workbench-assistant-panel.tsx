import {
	ArrowLeftIcon,
	HammerIcon,
	HistoryIcon,
	PlusIcon,
	Settings2Icon,
} from "lucide-react";
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
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import { WorkbenchAssistantComposer } from "./workbench-assistant-composer";
import { WorkbenchAssistantConversations } from "./workbench-assistant-conversations";
import { WorkbenchAssistantSettings } from "./workbench-assistant-settings";
import { WorkbenchAssistantTimeline } from "./workbench-assistant-timeline";

/** Which body the panel is currently showing. */
type WorkbenchAssistantView = "assistant" | "conversations" | "settings";

/**
 * The workbench ASSISTANT border panel shell: a header with the room title,
 * conversation-history and settings toggles, and a new-assistant action; the body
 * swaps between the assistant timeline + composer, conversation history, and assistant
 * settings. Toggling an already-active view returns to the assistant, and
 * initialization errors surface as a destructive alert under the header.
 *
 * @name WorkbenchAssistantPanel
 * @return The assistant panel shell with its header and active body view.
 */
export const WorkbenchAssistantPanel = () => {
	const roomName = useWorkbench((state) => state.assistant.roomName);
	const initError = useWorkbench((state) => state.assistant.initError);
	const isInitializing = useWorkbench(
		(state) => state.assistant.isInitializing,
	);
	const isSending = useWorkbench((state) => state.assistant.isSending);
	const newRoom = useWorkbench((state) => state.assistant.newRoom);
	const onRebuild = useWorkbench((state) => state.assistant.onRebuild);
	const [view, setView] = useState<WorkbenchAssistantView>("assistant");
	const [isRebuilding, setIsRebuilding] = useState(false);

	const toggleView = (target: WorkbenchAssistantView) => {
		setView((current) => (current === target ? "assistant" : target));
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
			data-testid="workbench-assistant-panel"
		>
			{/* this panel opts out of the shell's border header
			    (`enableBorderHeader: false`) and draws its own — same height,
			    so it lines up with the headers on the other borders */}
			<header
				className={cn(
					"flex shrink-0 items-center gap-2 border-border border-b px-3",
					WORKBENCH_STYLES.borderHeader,
				)}
			>
				{view !== "assistant" ? (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label="Back to assistant"
									className="-ms-1.5"
									onClick={() => setView("assistant")}
								>
									<ArrowLeftIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Back to assistant</TooltipContent>
						</Tooltip>
						<h2 className="min-w-0 flex-1 truncate font-medium text-sm">
							{view === "conversations"
								? "Conversations"
								: "Settings"}
						</h2>
					</>
				) : (
					<h2 className="min-w-0 flex-1 truncate font-medium text-sm">
						{roomName || "New conversation"}
					</h2>
				)}
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
							aria-label="Assistant settings"
							className={cn(view === "settings" && "bg-accent")}
							onClick={() => toggleView("settings")}
						>
							<Settings2Icon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Assistant settings</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Start a new conversation"
							disabled={isInitializing || isSending}
							onClick={() => {
								void newRoom();
								setView("assistant");
							}}
						>
							<PlusIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Start a new conversation</TooltipContent>
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

			{view === "assistant" ? (
				<>
					<WorkbenchAssistantTimeline />
					<WorkbenchAssistantComposer />
				</>
			) : view === "conversations" ? (
				<WorkbenchAssistantConversations
					onConversationSelected={() => setView("assistant")}
				/>
			) : (
				<WorkbenchAssistantSettings />
			)}
		</div>
	);
};
