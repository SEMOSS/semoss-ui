import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import { useChatAgent } from "@/features/digital-twin/use-main-twin";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { RoomComposer } from "@/features/rooms/components/room-composer";
import type {
	ComposerPanelAction,
	ComposerPrompt,
} from "@/features/rooms/components/room-composer.types";
import { RoomContextFiles } from "@/features/rooms/components/room-context-files";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type {
	ComposerSubmission,
	RoomSettings,
} from "@/features/rooms/types/room";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";
import { DraftChatOptions } from "./draft-chat-options";

interface DraftChatComposerProps {
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
	/** Today's ask box: a compact composer lifted off the hero photo behind it. */
	isHero?: boolean;
	/** The page is one agent's own, such as a Digital Twin's, so the agent cannot be changed. */
	isAgentLocked?: boolean;
	/** The page was opened to ask something, so the compact ask box takes the focus too. */
	isFocused?: boolean;
	/** Suggested first messages for the empty composer. */
	starterPrompts?: readonly ComposerPrompt[];
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
	isHero = false,
	isAgentLocked = false,
	isFocused = false,
	starterPrompts,
	panelActions,
}: DraftChatComposerProps) {
	const chat = useChatAgent({
		agentId: snapshot.settings.agentId,
		agent: snapshot.agent,
		options: snapshot.options,
		isOwnPage: isAgentLocked,
	});
	const actionsTriggerId = `new-chat-${draftId}-composer-actions`;
	const isBusy = snapshot.isPreparing || snapshot.turn.isSubmitting;
	return (
		<>
			{snapshot.isLoading && (
				<output className="flex items-center gap-2 text-muted-foreground">
					<Spinner aria-hidden="true" /> Opening chat...
				</output>
			)}
			{snapshot.error && !snapshot.isReady && (
				<Alert variant="destructive">
					<AlertDescription>
						{snapshot.error.message}
						<Button
							type="button"
							variant="outline"
							onClick={() => void onInitialize()}
						>
							Retry connection
						</Button>
					</AlertDescription>
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
				autoFocus={!isCompact || isFocused}
				className={
					isHero || starterPrompts?.length
						? "bg-transparent"
						: undefined
				}
				starterPrompts={starterPrompts}
				surfaceClassName={isHero ? "shadow-lg" : undefined}
				// the hero's longer placeholder wraps on a phone, so it keeps the full height there
				inputClassName={
					isHero ? "sm:min-h-14" : isCompact ? "min-h-10" : undefined
				}
				placeholder={
					isHero
						? chat.kind === "mainTwin"
							? `Ask ${chat.name} anything, search your work, or take action...`
							: "Ask anything, search your work, or take action…"
						: isCompact
							? "Ask anything…"
							: undefined
				}
				initialDraft={snapshot.composerDraft}
				onDraftChange={session.setComposerDraft}
				retainUntilSent
				clearOnSent={false}
				attachmentSummary={
					<RoomContextFiles
						files={snapshot.contextFiles}
						onRemove={session.removeContextFile}
						isDisabled={isBusy || snapshot.turn.isRunning}
					/>
				}
				submissionError={
					snapshot.submissionError ||
					snapshot.settingsError ||
					(snapshot.isReady ? snapshot.error?.message : undefined)
				}
				agentName={chat.name}
				agent={snapshot.agent ?? undefined}
				isSubmitting={isBusy}
				isRunning={snapshot.turn.isRunning}
				isCancelling={snapshot.turn.isCancelling}
				modelId={snapshot.modelId}
				modelName={snapshot.modelName}
				showModelSelector={!isCompact}
				showPromptOptimization={
					!isCompact || Boolean(snapshot.composerDraft.text.trim())
				}
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
				{isCompact ? (
					<DraftChatOptions
						session={session}
						snapshot={snapshot}
						onSelectAgent={onSelectAgent}
						isAgentLocked={isAgentLocked}
					/>
				) : (
					<div className="@md/composer:w-36 w-28 min-w-0 shrink-0">
						<ThreadAgentSelect
							compact
							value={snapshot.settings.agentId}
							name={chat.name}
							disabled={
								isAgentLocked ||
								!snapshot.isReady ||
								isBusy ||
								snapshot.isSavingSettings
							}
							onChange={(agentId) => void onSelectAgent(agentId)}
						/>
					</div>
				)}
			</RoomComposer>
		</>
	);
}
