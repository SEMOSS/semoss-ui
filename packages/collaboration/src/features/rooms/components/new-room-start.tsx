import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Alert, AlertDescription, Button, H3 } from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { WorkspaceTasksPanel } from "@/features/activity/components/workspace-tasks-panel";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { agentFromWorkspace } from "@/features/agents/utils/agent-from-workspace";
import { createRoom } from "@/features/rooms/api/create-room";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { submitAgentTurn } from "@/features/rooms/api/use-agent-turn";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import type {
	ComposerSubmission,
	RoomSettings,
} from "@/features/rooms/types/room";
import { pendingSession } from "@/features/rooms/utils/session-from-room";
import { newRoomPath, roomPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import { NewRoomAgentSelect } from "./new-room-agent-select";
import { RoomComposer } from "./room-composer";

async function cancelDraftTurn(): Promise<void> {
	return undefined;
}

interface NewRoomStartProps {
	/** Most recently loaded workspace-backed agent. */
	agent: WorkspaceAgent;
	/** Workspace agents available for selection and activity. */
	agents: Agent[];
	/** Agent requested by the current URL. */
	selectedAgentId: string;
	/** Whether `agent` matches the requested agent and is ready to submit. */
	isAgentReady: boolean;
	/** Failure from loading the requested agent without discarding the draft. */
	agentError: Error | null;
	/** Retries loading the requested agent. */
	onRetryAgent: () => void;
}

/** Focused landing composer that creates its room on the first message. */
export function NewRoomStart({
	agent,
	agents,
	selectedAgentId,
	isAgentReady,
	agentError,
	onRetryAgent,
}: NewRoomStartProps) {
	const workspace = useMain();
	const { actions, insightId } = useInsight();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null);
	const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
	const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
	const [isStarting, setIsStarting] = useState(false);
	const [roomSettings, setRoomSettings] = useState<RoomSettings>({
		instructions: "",
		mcp: [],
	});
	const createdRoomIdRef = useRef<string | null>(null);
	const isRoomReadyRef = useRef(false);
	const startingRef = useRef(false);
	const mountedRef = useRef(true);
	const agentId = agent.workspace_id;
	const displayAgent =
		agentId === selectedAgentId
			? agentFromWorkspace(agent)
			: agents.find((candidate) => candidate.id === selectedAgentId);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const shouldApplyAgentDefault =
		isAgentReady &&
		agentId === selectedAgentId &&
		pendingAgentId === selectedAgentId;
	const modelId =
		(shouldApplyAgentDefault ? agent.config_json?.model_id : "") ||
		searchParams.get("model") ||
		(isAgentReady ? agent.config_json?.model_id : "") ||
		"";
	const currentSelectedEngine =
		selectedEngine?.engine_id === modelId ? selectedEngine : null;
	const modelLookup = useRoomModel(modelId);
	const resolvedEngine =
		modelLookup.engine?.engine_id === modelId ? modelLookup.engine : null;
	const modelName =
		currentSelectedEngine?.engine_display_name ||
		currentSelectedEngine?.engine_name ||
		resolvedEngine?.engine_display_name ||
		resolvedEngine?.engine_name ||
		(modelLookup.isLoading ? "Loading model…" : modelId || "Select model");

	const handleModelChange = useCallback(
		async (engine: Engine) => {
			if (
				createdRoomIdRef.current ||
				startingRef.current ||
				!isAgentReady
			)
				return;
			setPendingAgentId(null);
			setSelectedEngine(engine);
			navigate(newRoomPath(selectedAgentId, engine.engine_id), {
				replace: true,
			});
		},
		[isAgentReady, navigate, selectedAgentId],
	);

	/** Keep the mounted composer while loading the incoming agent's defaults. */
	function handleAgentChange(nextAgentId: string): void {
		if (
			createdRoomIdRef.current ||
			startingRef.current ||
			nextAgentId === selectedAgentId
		)
			return;
		setPendingAgentId(nextAgentId);
		navigate(newRoomPath(nextAgentId, modelId), { replace: true });
	}

	useEffect(() => {
		if (!isAgentReady || agentId !== selectedAgentId) return;
		// Commit a default only for this selection, never for a background refresh.
		if (modelId && searchParams.get("model") !== modelId) {
			navigate(newRoomPath(selectedAgentId, modelId), { replace: true });
		} else if (shouldApplyAgentDefault) {
			setPendingAgentId(null);
		}
	}, [
		agentId,
		isAgentReady,
		modelId,
		navigate,
		searchParams,
		selectedAgentId,
		shouldApplyAgentDefault,
	]);

	const handleOptimizePrompt = useCallback(
		(draft: string, instructions: string) =>
			optimizePrompt(actions, { modelId, draft, instructions }),
		[actions, modelId],
	);

	const handleSaveRoomSettings = useCallback(
		async (settings: RoomSettings) => {
			if (startingRef.current)
				throw new Error("Wait for this room to finish starting.");
			if (!isAgentReady || agentId !== selectedAgentId)
				throw new Error(
					"Wait for the selected agent to finish loading.",
				);
			const roomId = createdRoomIdRef.current;
			if (roomId && isRoomReadyRef.current) {
				await createRoom(
					actions,
					insightId,
					{
						workspaceId: agentId,
						workspaceName: agent.name,
						instructions: settings.instructions,
						mcp: settings.mcp,
						modelId: settings.modelId ?? modelId,
						temperature: settings.temperature,
					},
					{ roomId },
				);
			}
			if (mountedRef.current) {
				setRoomSettings(settings);
				if (settings.modelId && settings.modelId !== modelId)
					navigate(newRoomPath(selectedAgentId, settings.modelId), {
						replace: true,
					});
			}
		},
		[
			actions,
			agent.name,
			agentId,
			insightId,
			isAgentReady,
			modelId,
			navigate,
			selectedAgentId,
		],
	);

	const handleSend = useCallback(
		async (submission: ComposerSubmission) => {
			if (!isAgentReady || agentId !== selectedAgentId) {
				throw new Error(
					"Wait for the selected agent to finish loading.",
				);
			}
			if (startingRef.current) {
				throw new Error("This conversation is already being started.");
			}
			startingRef.current = true;
			setIsStarting(true);
			try {
				let roomId = createdRoomIdRef.current;
				if (!isRoomReadyRef.current) {
					roomId = await createRoom(
						actions,
						insightId,
						{
							workspaceId: agentId,
							workspaceName: agent.name,
							instructions: roomSettings.instructions,
							mcp: roomSettings.mcp,
							temperature: roomSettings.temperature,
							modelId,
						},
						{
							roomId: roomId ?? undefined,
							onCreated: (allocatedRoomId) => {
								createdRoomIdRef.current = allocatedRoomId;
								if (mountedRef.current) {
									setCreatedRoomId(allocatedRoomId);
								}
							},
						},
					);
					createdRoomIdRef.current = roomId;
					if (mountedRef.current) setCreatedRoomId(roomId);
					isRoomReadyRef.current = true;
					workspace.addPendingRoom(
						pendingSession(roomId, agentId, "New session", modelId),
					);
				}
				if (!roomId) {
					throw new Error("The conversation could not be created.");
				}

				await submitAgentTurn(
					{
						insightId,
						roomId,
						agentId,
						engine: modelId,
						maxTurns: agent.config_json?.budgets?.max_turns ?? 40,
						maxReflections:
							agent.config_json?.budgets?.max_reflections,
					},
					submission,
				);
				workspace.trackGeneratedRoomName(agentId, roomId);
				if (mountedRef.current) {
					navigate(roomPath(roomId), { replace: true });
				}
			} finally {
				startingRef.current = false;
				if (mountedRef.current) setIsStarting(false);
			}
		},
		[
			actions,
			agent.config_json?.budgets?.max_reflections,
			agent.config_json?.budgets?.max_turns,
			agent.name,
			agentId,
			insightId,
			isAgentReady,
			modelId,
			navigate,
			roomSettings,
			selectedAgentId,
			workspace,
		],
	);

	return (
		<main
			aria-busy={isStarting || (!isAgentReady && !agentError)}
			className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background"
		>
			<div className="flex min-h-full min-w-0 flex-col xl:flex-row">
				<div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-12 md:px-6">
					<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
						<header className="text-center">
							<H3 className="break-words font-medium">
								What should we work on?
							</H3>
						</header>
						{!isAgentReady && !agentError && (
							<output className="block text-muted-foreground text-sm">
								Loading selected agent…
							</output>
						)}
						{agentError && (
							<Alert variant="destructive">
								<AlertDescription className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
									<span>{agentError.message}</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={onRetryAgent}
									>
										Try again
									</Button>
								</AlertDescription>
							</Alert>
						)}
						<div className="min-w-0">
							<RoomComposer
								className="w-full"
								inputClassName="min-h-28"
								agentName={
									displayAgent?.name || "Selected agent"
								}
								agent={agent}
								isSubmitting={isStarting}
								isRunning={false}
								isCancelling={false}
								modelId={modelId}
								modelName={modelName}
								isModelSaving={false}
								isModelLocked={
									Boolean(createdRoomId) || !isAgentReady
								}
								modelError={modelLookup.error}
								roomInstructions={
									roomSettings.instructions ||
									agent.system_prompt ||
									""
								}
								roomSettings={{ ...roomSettings, modelId }}
								settingsPresentation="drawer"
								inheritedMcp={isAgentReady ? agent.mcp : []}
								isSettingsDisabled={isStarting || !isAgentReady}
								isSendDisabled={!isAgentReady}
								onModelChange={handleModelChange}
								onSaveRoomSettings={handleSaveRoomSettings}
								onOptimizePrompt={handleOptimizePrompt}
								onSend={handleSend}
								onStop={cancelDraftTurn}
							/>
							<div className="mx-2 flex min-w-0 items-center rounded-b-xl bg-muted/50 px-2 py-1">
								<NewRoomAgentSelect
									agents={agents}
									agent={displayAgent}
									value={selectedAgentId}
									disabled={
										isStarting || Boolean(createdRoomId)
									}
									onChange={handleAgentChange}
								/>
							</div>
						</div>
					</div>
				</div>
				<WorkspaceTasksPanel
					agents={agents}
					sessions={workspace.sessions}
					onOpenRoom={workspace.openRoom}
				/>
			</div>
		</main>
	);
}
