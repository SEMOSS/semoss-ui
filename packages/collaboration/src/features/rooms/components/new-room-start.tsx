import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Alert, AlertDescription, Button, H3, P } from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { agentFromWorkspace } from "@/features/agents/utils/agent-from-workspace";
import { createRoom } from "@/features/rooms/api/create-room";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { submitAgentTurn } from "@/features/rooms/api/use-agent-turn";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import type { ComposerSubmission } from "@/features/rooms/types/room";
import { pendingSession } from "@/features/rooms/utils/session-from-room";
import { newRoomPath, roomPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import { RoomComposer } from "./room-composer";

async function cancelDraftTurn(): Promise<void> {
	return undefined;
}

interface NewRoomStartProps {
	/** Most recently loaded workspace-backed agent. */
	agent: WorkspaceAgent;
	/** Agents available to switch to before the room is allocated. */
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
	const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
	const [isStarting, setIsStarting] = useState(false);
	const createdRoomIdRef = useRef<string | null>(null);
	const isRoomReadyRef = useRef(false);
	const startingRef = useRef(false);
	const mountedRef = useRef(true);
	const agentId = agent.workspace_id;
	const displayAgent = agentFromWorkspace(agent);
	const selectableAgents = agents.some(
		(candidate) => candidate.id === agentId,
	)
		? agents
		: [displayAgent, ...agents];

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const modelId =
		searchParams.get("model") || agent.config_json?.model_id || "";
	const currentSelectedEngine =
		selectedEngine?.engine_id === modelId ? selectedEngine : null;
	const modelLookup = useRoomModel(modelId);
	const modelName =
		currentSelectedEngine?.engine_display_name ||
		currentSelectedEngine?.engine_name ||
		modelLookup.engine?.engine_display_name ||
		modelLookup.engine?.engine_name ||
		(modelLookup.isLoading ? "Loading model…" : modelId || "Select model");

	const handleModelChange = useCallback(
		async (engine: Engine) => {
			if (createdRoomId || isStarting || !isAgentReady) return;
			setSelectedEngine(engine);
			navigate(newRoomPath(selectedAgentId, engine.engine_id), {
				replace: true,
			});
		},
		[createdRoomId, isAgentReady, isStarting, navigate, selectedAgentId],
	);

	const handleAgentChange = useCallback(
		(nextAgentId: string) => {
			if (nextAgentId === selectedAgentId || createdRoomId || isStarting)
				return;
			navigate(newRoomPath(nextAgentId, modelId || undefined), {
				replace: true,
			});
		},
		[createdRoomId, isStarting, modelId, navigate, selectedAgentId],
	);

	useEffect(() => {
		const defaultModelId = agent.config_json?.model_id;
		if (!isAgentReady || searchParams.get("model") || !defaultModelId)
			return;
		navigate(newRoomPath(selectedAgentId, defaultModelId), {
			replace: true,
		});
	}, [
		agent.config_json?.model_id,
		isAgentReady,
		navigate,
		searchParams,
		selectedAgentId,
	]);

	const handleOptimizePrompt = useCallback(
		(draft: string, instructions: string) =>
			optimizePrompt(actions, { modelId, draft, instructions }),
		[actions, modelId],
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
							instructions: agent.system_prompt,
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
			agent.system_prompt,
			agentId,
			insightId,
			isAgentReady,
			modelId,
			navigate,
			selectedAgentId,
			workspace,
		],
	);

	return (
		<main
			aria-busy={isStarting || (!isAgentReady && !agentError)}
			className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background"
		>
			<div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-6 p-4 md:p-6">
				<header className="flex flex-col items-center gap-3 text-center">
					<AgentAvatar agent={displayAgent} size="lg" />
					<div className="min-w-0 max-w-full">
						<H3 className="break-words">
							Start a conversation with {agent.name}
						</H3>
						<P className="mx-auto mt-2 max-w-prose break-words text-muted-foreground">
							{agent.description ||
								"Share what you would like this agent to work on."}
						</P>
					</div>
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
				<RoomComposer
					agentId={selectedAgentId}
					agentName={agent.name}
					agentOptions={selectableAgents.map((candidate) => ({
						id: candidate.id,
						name: candidate.name,
					}))}
					isSubmitting={isStarting}
					isRunning={false}
					isCancelling={false}
					isAgentLocked={Boolean(createdRoomId)}
					modelId={modelId}
					modelName={modelName}
					isModelSaving={false}
					isModelLocked={Boolean(createdRoomId) || !isAgentReady}
					modelError={modelLookup.error}
					roomInstructions={agent.system_prompt || ""}
					isSendDisabled={!isAgentReady}
					variant="landing"
					onAgentChange={handleAgentChange}
					onModelChange={handleModelChange}
					onOptimizePrompt={handleOptimizePrompt}
					onSend={handleSend}
					onStop={cancelDraftTurn}
				/>
			</div>
		</main>
	);
}
