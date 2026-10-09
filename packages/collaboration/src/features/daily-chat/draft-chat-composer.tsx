import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { RoomComposer } from "@/features/rooms/components/room-composer";
import type { ComposerPanelAction } from "@/features/rooms/components/room-composer.types";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type {
	ComposerSubmission,
	RoomSettings,
} from "@/features/rooms/types/room";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";

export interface DraftChatComposerProps {
	/** Stable draft identity prevents a submitted editor from leaking into a fresh draft. */
	draftId: string;
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	agentError: string;
	onInitialize: () => Promise<void>;
	onSend: (submission: ComposerSubmission) => Promise<void>;
	onSaveSettings: (settings: RoomSettings) => Promise<void>;
	onSelectAgent: (agentId: string) => Promise<void>;
	/** The overview composer is compact and never steals initial page focus. */
	isCompact?: boolean;
	panelActions: readonly ComposerPanelAction[];
}

/** One composer and recovery surface backed by the draft's RoomSession. */
export function DraftChatComposer({
	draftId,
	session,
	snapshot,
	agentError,
	onInitialize,
	onSend,
	onSaveSettings,
	onSelectAgent,
	isCompact = false,
	panelActions,
}: DraftChatComposerProps) {
	const actionsTriggerId = `new-chat-${draftId}-composer-actions`;
	const isBusy = snapshot.isPreparing || snapshot.turn.isSubmitting;
	return (
		<>
			{snapshot.isLoading && (
				<output className="flex items-center gap-2 text-muted-foreground">
					<Spinner aria-hidden="true" /> Opening Assistant…
				</output>
			)}
			{snapshot.error && !snapshot.isReady && (
				<Alert variant="destructive">
					<AlertDescription>
						{snapshot.error.message}
					</AlertDescription>
					<Button
						type="button"
						variant="outline"
						onClick={() => void onInitialize()}
					>
						Retry connection
					</Button>
				</Alert>
			)}
			{snapshot.isCreationUncertain && (
				<Alert variant="destructive">
					<AlertDescription>
						Room creation could not be confirmed. Check your chat
						history before starting another room.
					</AlertDescription>
				</Alert>
			)}
			{agentError && (
				<Alert variant="destructive">
					<AlertDescription>{agentError}</AlertDescription>
				</Alert>
			)}
			<RoomComposer
				key={`${draftId}:${snapshot.composerResetKey}`}
				autoFocus={!isCompact}
				inputClassName={isCompact ? "min-h-10" : undefined}
				placeholder={isCompact ? "Ask anything…" : undefined}
				initialDraft={snapshot.composerDraft}
				onDraftChange={session.setComposerDraft}
				retainUntilSent
				submissionError={
					snapshot.submissionError ||
					snapshot.settingsError ||
					(snapshot.isReady ? snapshot.error?.message : undefined)
				}
				agentName={snapshot.agent?.name ?? "Assistant"}
				agent={snapshot.agent ?? undefined}
				isSubmitting={isBusy}
				isRunning={snapshot.turn.isRunning}
				isCancelling={snapshot.turn.isCancelling}
				modelId={snapshot.modelId}
				modelName={snapshot.modelName}
				isModelSaving={
					snapshot.isSavingSettings || snapshot.isLoadingModel
				}
				isSendDisabled={
					!snapshot.isReady ||
					Boolean(snapshot.modelError || snapshot.settingsError) ||
					snapshot.hasUnconfirmedSubmission ||
					snapshot.isCreationUncertain
				}
				modelError={
					snapshot.modelError ? new Error(snapshot.modelError) : null
				}
				roomInstructions={snapshot.settings.instructions}
				roomSettings={snapshot.settings}
				hideSettingsAction
				actionsTriggerId={actionsTriggerId}
				panelActions={panelActions}
				inheritedMcp={snapshot.agent?.mcp ?? []}
				isSettingsDisabled={!snapshot.isReady || isBusy}
				onModelChange={(engine) =>
					session.selectModel(
						engine.engine_id,
						engine.engine_display_name || engine.engine_name,
					)
				}
				onSaveRoomSettings={onSaveSettings}
				onOptimizePrompt={(text, instructions) =>
					optimizePrompt(session.insight.actions, {
						modelId: snapshot.modelId,
						draft: text,
						instructions,
					})
				}
				onSend={onSend}
				onStop={session.cancel}
			>
				<div className="@md/composer:w-36 w-28 min-w-0 shrink-0">
					<ThreadAgentSelect
						compact
						value={snapshot.settings.agentId}
						name={snapshot.agent?.name ?? "Assistant"}
						disabled={
							!snapshot.isReady ||
							isBusy ||
							snapshot.isSavingSettings
						}
						onChange={(agentId) => void onSelectAgent(agentId)}
					/>
				</div>
			</RoomComposer>
		</>
	);
}
