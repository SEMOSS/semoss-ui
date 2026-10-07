import { Paperclip, Plus, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	P,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ComposerActionControls } from "@/features/rooms/components/room-composer.types";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";
import { useWorkThread } from "@/features/work-thread/work-thread-context";
import { ChatSettingsDrawer } from "./chat-settings-drawer";

/** Keep uploads, agent selection, and chat settings together beside the message. */
export function ChatAddToChat({
	onAttachFiles,
	triggerRef,
	triggerId,
	disabled,
}: ComposerActionControls) {
	const { session, snapshot, title } = useWorkThread();
	const [isOpen, setIsOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const isOpeningSettings = useRef(false);
	const agentTriggerRef = useRef<HTMLDivElement>(null);
	const shouldRestoreAgentFocus = useRef(false);
	const selectionPending = useRef(false);
	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionError, setSelectionError] = useState<{
		agentId: string;
		message: string;
	} | null>(null);
	const isAgentLocked =
		disabled ||
		!snapshot.isReady ||
		snapshot.isLoadingModel ||
		snapshot.isSavingSettings ||
		snapshot.isPreparing ||
		snapshot.isCompacting ||
		snapshot.turn.isRunning ||
		snapshot.turn.isSubmitting ||
		snapshot.turn.isRestoring ||
		snapshot.hasUnconfirmedSubmission ||
		snapshot.isCreationUncertain;

	useEffect(() => {
		if (disabled) setIsOpen(false);
	}, [disabled]);

	useEffect(() => {
		if (isSelecting || isAgentLocked || !shouldRestoreAgentFocus.current)
			return;
		shouldRestoreAgentFocus.current = false;
		// The selected row is disabled during saving; recover only focus it lost.
		if (document.activeElement === document.body)
			agentTriggerRef.current?.focus();
	}, [isAgentLocked, isSelecting]);

	const selectAgent = async (agentId: string): Promise<void> => {
		if (isAgentLocked || selectionPending.current) return;
		selectionPending.current = true;
		shouldRestoreAgentFocus.current = true;
		setIsSelecting(true);
		setSelectionError(null);
		try {
			await session.saveSettings(title, {
				...session.getSnapshot().settings,
				agentId,
			});
		} catch (cause) {
			setSelectionError({
				agentId,
				message:
					cause instanceof Error
						? cause.message
						: "Could not change the agent. Try again.",
			});
		} finally {
			selectionPending.current = false;
			setIsSelecting(false);
		}
	};

	return (
		<>
			<DropdownMenu
				open={isOpen && !disabled}
				onOpenChange={(open) => setIsOpen(open && !disabled)}
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<Button
								ref={triggerRef}
								id={triggerId}
								type="button"
								variant="ghost"
								size="icon"
								className="pointer-coarse:size-11 rounded-full text-muted-foreground"
								aria-label="Add to chat"
								disabled={disabled}
							>
								<Plus aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent>Add to chat</TooltipContent>
				</Tooltip>
				<DropdownMenuContent
					align="start"
					side="bottom"
					aria-label="Add to chat"
					className="w-64 max-w-(--radix-dropdown-menu-content-available-width)"
					onCloseAutoFocus={(event) => {
						if (isOpeningSettings.current) event.preventDefault();
						isOpeningSettings.current = false;
					}}
				>
					<DropdownMenuLabel>Add to chat</DropdownMenuLabel>
					<DropdownMenuItem
						className="pointer-coarse:min-h-11"
						disabled={disabled}
						onSelect={onAttachFiles}
					>
						<Paperclip aria-hidden="true" />
						Attach files
					</DropdownMenuItem>
					<ThreadAgentSelect
						triggerRef={agentTriggerRef}
						presentation="menu"
						value={snapshot.settings.agentId}
						name={snapshot.agent?.name ?? ""}
						disabled={isAgentLocked || isSelecting}
						onChange={(agentId) => void selectAgent(agentId)}
					/>
					<DropdownMenuItem
						className="pointer-coarse:min-h-11"
						disabled={disabled || isSelecting}
						onSelect={() => {
							isOpeningSettings.current = true;
							setIsSettingsOpen(true);
						}}
					>
						<Settings2 aria-hidden="true" />
						Settings
					</DropdownMenuItem>
					{isSelecting && (
						<Spinner
							aria-label="Changing agent"
							className="mx-3 my-2"
						/>
					)}
					{selectionError && (
						<Alert variant="destructive" className="mt-2">
							<AlertDescription className="space-y-2">
								<P className="break-words text-sm">
									{selectionError.message}
								</P>
								<DropdownMenuItem
									className="pointer-coarse:min-h-11"
									disabled={isAgentLocked || isSelecting}
									onSelect={(event) => {
										event.preventDefault();
										void selectAgent(
											selectionError.agentId,
										);
									}}
								>
									Retry agent
								</DropdownMenuItem>
							</AlertDescription>
						</Alert>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<ChatSettingsDrawer
				open={isSettingsOpen}
				onOpenChange={setIsSettingsOpen}
				returnFocusRef={triggerRef}
			/>
		</>
	);
}
