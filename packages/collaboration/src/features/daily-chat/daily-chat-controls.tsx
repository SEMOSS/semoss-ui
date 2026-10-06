import { ChevronDown, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Spinner,
} from "@semoss/ui/next";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";
import { useWorkPanelActions } from "@/features/work-thread/use-work-panel-actions";
import { useWorkThread } from "@/features/work-thread/work-thread-context";

/** Keep the active agent and conversation settings available beside the composer. */
export function DailyChatControls() {
	const { session, snapshot, title, setSettingsSection } = useWorkThread();
	const settingsTrigger = useRef<HTMLButtonElement>(null);
	const agentTrigger = useRef<HTMLButtonElement>(null);
	const shouldRestoreAgentFocus = useRef(false);
	const isOpeningPanel = useRef(false);
	const panelActions = useWorkPanelActions(settingsTrigger);
	const [selectionError, setSelectionError] = useState<{
		agentId: string;
		message: string;
	} | null>(null);
	const [isSelecting, setIsSelecting] = useState(false);
	const selectionPending = useRef(false);
	const isLocked =
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
		if (isSelecting || !shouldRestoreAgentFocus.current) return;
		shouldRestoreAgentFocus.current = false;
		// Saving temporarily disables the popover trigger; restore it only if focus was lost.
		if (document.activeElement === document.body)
			agentTrigger.current?.focus();
	}, [isSelecting]);
	const handleAgentChange = async (agentId: string): Promise<void> => {
		if (isLocked || selectionPending.current) return;
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
	const openSettings = (section: "chat" | "advanced") => {
		isOpeningPanel.current = true;
		setSettingsSection?.(section);
		panelActions
			.find(
				(action) =>
					action.id === (section === "chat" ? "settings" : "compact"),
			)
			?.onSelect();
	};
	return (
		<div className="flex min-w-0 flex-wrap items-center gap-2">
			<div className="min-w-0 flex-1 sm:max-w-64">
				<ThreadAgentSelect
					triggerRef={agentTrigger}
					value={snapshot.settings.agentId}
					name={snapshot.agent?.name ?? ""}
					compact
					disabled={isLocked || isSelecting}
					onChange={(agentId) => void handleAgentChange(agentId)}
				/>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						ref={settingsTrigger}
						type="button"
						variant="ghost"
						size="sm"
						className="pointer-coarse:min-h-11 shrink-0"
					>
						<Settings2 aria-hidden="true" />
						Settings
						<ChevronDown aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					onCloseAutoFocus={(event) => {
						if (isOpeningPanel.current) event.preventDefault();
						isOpeningPanel.current = false;
					}}
				>
					<DropdownMenuItem
						className="min-h-9 pointer-coarse:min-h-11"
						onSelect={() => openSettings("chat")}
					>
						Chat settings
					</DropdownMenuItem>
					<DropdownMenuItem
						className="min-h-9 pointer-coarse:min-h-11"
						onSelect={() => openSettings("advanced")}
					>
						Advanced
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{isSelecting && <Spinner aria-label="Changing agent" />}
			{selectionError && (
				<Alert variant="destructive" className="basis-full">
					<AlertDescription className="flex flex-wrap items-center gap-2">
						<span className="min-w-0 flex-1 break-words">
							{selectionError.message}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isLocked || isSelecting}
							onClick={() =>
								void handleAgentChange(selectionError.agentId)
							}
						>
							Retry agent
						</Button>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
