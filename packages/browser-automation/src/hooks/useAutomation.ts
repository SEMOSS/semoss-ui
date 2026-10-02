import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@semoss/ui/next";
import { SCROLL_SCREEN_PERCENT } from "../domain/scroll";
import { runPixel } from "../semoss/pixel";
import type {
	ClientToServerEvent,
	McpToolContext,
} from "../types/browserEvents";

type AutomationHistoryEntry = {
	iteration: number;
	type: "click" | "fill" | "select" | "scroll";
	label: string;
	value?: string;
	pageUrl: string;
	reason: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

interface UseAutomationOptions {
	sessionId: string | undefined;
	toolContext: McpToolContext | null;
	insightId: string;
	toolExecutionKey: string;
	isPlaygroundMode: boolean;
	isMcpPlaybackMode: boolean;
	remoteWidth: number;
	remoteHeight: number;
	sendReplayEvent: (
		event: ClientToServerEvent & { requestId: string },
	) => Promise<unknown>;
}

export function useAutomation({
	sessionId,
	toolContext,
	insightId,
	toolExecutionKey,
	isPlaygroundMode,
	isMcpPlaybackMode,
	remoteWidth,
	remoteHeight,
	sendReplayEvent,
}: UseAutomationOptions) {
	const [automationMode, setAutomationMode] = useState(false);
	const [automationModelId, setAutomationModelId] = useState("");
	const [automationSubMode, setAutomationSubMode] = useState<
		"click" | "fill-page" | "run-goal"
	>("click");
	const [isAutomationGenerating, setIsAutomationGenerating] = useState(false);
	const [isGoalAutomationRunning, setIsGoalAutomationRunning] =
		useState(false);
	const [automationGoal, setAutomationGoal] = useState("");
	const [isAutomationGoalGenerating, setIsAutomationGoalGenerating] =
		useState(false);
	const [automationGoalGenerationError, setAutomationGoalGenerationError] =
		useState("");
	const [automationMaxIterations, setAutomationMaxIterations] = useState(10);
	const [automationProgress, setAutomationProgress] = useState<{
		iteration: number;
		maxIterations: number;
	} | null>(null);
	const [automationClickPos, setAutomationClickPos] = useState<{
		localX: number;
		localY: number;
	} | null>(null);
	const automationRunTokenRef = useRef(0);
	const automationGoalExecutionRef = useRef("");

	const resetAutomationGoal = useCallback(() => {
		setAutomationGoal("");
		setAutomationGoalGenerationError("");
		automationGoalExecutionRef.current = "";
	}, []);

	const generateAutomationGoal = useCallback(
		async (replaceExisting: boolean) => {
			const roomId = toolContext?.roomId ?? "";
			if (!roomId || !automationModelId || !insightId) return;

			setIsAutomationGoalGenerating(true);
			setAutomationGoalGenerationError("");
			try {
				const response = await runPixel<Record<string, unknown>>(
					`GeneratePlaywrightAutomationGoal(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, limit=20);`,
					insightId,
				);
				const output = response.pixelReturn?.[0]?.output;
				if (!isRecord(output) || output.success !== true) {
					throw new Error(
						isRecord(output) && typeof output.error === "string"
							? output.error
							: "Could not generate an automation goal.",
					);
				}
				const generatedGoal =
					typeof output.goal === "string" ? output.goal.trim() : "";
				if (!generatedGoal) {
					throw new Error(
						"The model returned an empty automation goal.",
					);
				}
				setAutomationGoal((current) =>
					replaceExisting || !current.trim()
						? generatedGoal
						: current,
				);
				if (!automationModelId && typeof output.engineId === "string") {
					setAutomationModelId(output.engineId);
				}
			} catch (error) {
				setAutomationGoalGenerationError(
					error instanceof Error
						? error.message
						: "Could not generate an automation goal.",
				);
			} finally {
				setIsAutomationGoalGenerating(false);
			}
		},
		[automationModelId, insightId, toolContext?.roomId],
	);

	useEffect(() => {
		if (
			!isPlaygroundMode ||
			isMcpPlaybackMode ||
			!toolExecutionKey ||
			!automationModelId ||
			automationGoalExecutionRef.current === toolExecutionKey
		) {
			return;
		}
		automationGoalExecutionRef.current = toolExecutionKey;
		void generateAutomationGoal(false);
	}, [
		automationModelId,
		generateAutomationGoal,
		isMcpPlaybackMode,
		isPlaygroundMode,
		toolExecutionKey,
	]);

	const executeGeneratedFields = useCallback(
		async (output: Record<string, unknown>): Promise<number> => {
			const fields = Array.isArray(output.fields)
				? (output.fields as Array<Record<string, unknown>>)
				: [];
			const expectedUrl =
				typeof output.pageUrl === "string" ? output.pageUrl : undefined;
			const expectedTabId =
				typeof output.tabId === "string" ? output.tabId : undefined;
			let completed = 0;

			for (const field of fields) {
				const value =
					typeof field.value === "string" ? field.value : "";
				const strategy =
					typeof field.selectorStrategy === "string"
						? field.selectorStrategy
						: "css";
				const selectorValue =
					typeof field.selectorValue === "string"
						? field.selectorValue
						: "";
				if (!value || !selectorValue) continue;

				await sendReplayEvent({
					type: "fill-element",
					requestId: crypto.randomUUID(),
					text: value,
					selector: {
						strategy,
						value: selectorValue,
						frameSelector:
							typeof field.frameSelector === "string"
								? field.frameSelector
								: null,
					},
					label:
						typeof field.label === "string"
							? field.label
							: undefined,
					tag: typeof field.tag === "string" ? field.tag : undefined,
					isPassword: field.isPassword === true,
					storeValue: field.storeValue === true,
					expectedUrl,
					expectedTabId,
				});
				completed += 1;
			}
			return completed;
		},
		[sendReplayEvent],
	);

	const generateAndFillSelectedField = useCallback(
		async (remoteX: number, remoteY: number) => {
			if (!sessionId) {
				toast("No active browser session.");
				return;
			}
			setIsAutomationGenerating(true);
			try {
				const roomId = toolContext?.roomId ?? "";
				if (!roomId) {
					toast(
						"No room context available — open this tool from a Playground room.",
					);
					return;
				}

				// x/y identifies the clicked field, but all fields are sent for reasoning.
				const response = await runPixel<Record<string, unknown>>(
					`GeneratePlaywrightFieldActions(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, sessionId=${JSON.stringify(sessionId)}, limit=20, x=${remoteX}, y=${remoteY});`,
					insightId,
				);

				const output = response.pixelReturn?.[0]?.output as
					| Record<string, unknown>
					| undefined;
				if (!output?.success) {
					toast(
						typeof output?.error === "string"
							? output.error
							: "Automation generation failed.",
					);
					return;
				}

				const fields = Array.isArray(output?.fields)
					? output.fields
					: [];

				if (fields.length === 0) {
					toast(
						typeof output?.message === "string"
							? output.message
							: "No editable field or context-supported value was found at that position.",
					);
					return;
				}

				const completed = await executeGeneratedFields(output);
				if (completed === 0) {
					toast("No generated field action could be executed.");
					return;
				}
				if (!automationModelId && typeof output.engineId === "string") {
					setAutomationModelId(output.engineId);
				}
				toast("Filled the selected field from Playground context.");
				setAutomationMode(false);
			} catch (error) {
				toast(
					error instanceof Error
						? error.message
						: "Automation generation failed.",
				);
			} finally {
				setIsAutomationGenerating(false);
				setAutomationClickPos(null);
			}
		},
		[
			automationModelId,
			insightId,
			executeGeneratedFields,
			sessionId,
			toolContext?.roomId,
		],
	);

	const handleFieldAutomationTarget = useCallback(
		async (
			localX: number,
			localY: number,
			remoteX: number,
			remoteY: number,
			button: "left" | "right" | "middle",
		) => {
			setAutomationClickPos({ localX, localY });
			try {
				await sendReplayEvent({
					type: "mouse-click",
					requestId: crypto.randomUUID(),
					x: remoteX,
					y: remoteY,
					button,
				});
				await generateAndFillSelectedField(remoteX, remoteY);
			} catch (error) {
				toast(
					error instanceof Error
						? error.message
						: "Could not click the selected browser position.",
				);
				setAutomationClickPos(null);
			}
		},
		[generateAndFillSelectedField, sendReplayEvent],
	);

	const fillVisibleFieldsFromContext = useCallback(async () => {
		if (!sessionId) {
			toast("No active browser session.");
			return;
		}
		const roomId = toolContext?.roomId ?? "";
		if (!roomId) {
			toast(
				"No room context available — open this tool from a Playground room.",
			);
			return;
		}
		setIsAutomationGenerating(true);
		setAutomationMode(false);
		try {
			// All-fields mode: no x/y, reactor fills all visible fields.
			const response = await runPixel<Record<string, unknown>>(
				`GeneratePlaywrightFieldActions(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, sessionId=${JSON.stringify(sessionId)}, limit=20);`,
				insightId,
			);

			const output = response.pixelReturn?.[0]?.output as
				| Record<string, unknown>
				| undefined;
			if (!output?.success) {
				toast(
					typeof output?.error === "string"
						? output.error
						: "Page fill failed.",
				);
				return;
			}

			const fields = Array.isArray(output?.fields) ? output.fields : [];

			if (fields.length === 0) {
				toast(
					typeof output?.message === "string"
						? output.message
						: "No editable fields could be filled from the available context.",
				);
				return;
			}

			const completed = await executeGeneratedFields(output);
			if (completed === 0) {
				toast("No generated field action could be executed.");
				return;
			}
			if (!automationModelId && typeof output.engineId === "string") {
				setAutomationModelId(output.engineId);
			}
			toast(
				`Filled ${completed} field${completed !== 1 ? "s" : ""} from Playground context.`,
			);
		} catch (error) {
			toast(error instanceof Error ? error.message : "Page fill failed.");
		} finally {
			setIsAutomationGenerating(false);
		}
	}, [
		automationModelId,
		insightId,
		executeGeneratedFields,
		sessionId,
		toolContext?.roomId,
	]);

	const executePlannedAutomationAction = useCallback(
		async (
			output: Record<string, unknown>,
			iteration: number,
		): Promise<AutomationHistoryEntry> => {
			if (!isRecord(output.action)) {
				throw new Error("Automation planner did not return an action.");
			}
			const action = output.action;
			const rawType = action.type;
			const type =
				typeof rawType === "string" ? rawType.trim().toLowerCase() : "";
			if (
				type !== "click" &&
				type !== "fill" &&
				type !== "select" &&
				type !== "scroll"
			) {
				throw new Error(
					`Automation planner returned an unsupported action type: ${JSON.stringify(rawType)}.`,
				);
			}
			const label = typeof action.label === "string" ? action.label : "";
			const expectedUrl =
				typeof output.pageUrl === "string" ? output.pageUrl : undefined;
			const expectedTabId =
				typeof output.tabId === "string" ? output.tabId : undefined;
			const reason =
				typeof output.reason === "string" ? output.reason : "";

			if (type === "scroll") {
				const deltaY =
					typeof action.deltaY === "number" ? action.deltaY : 0;
				if (!deltaY) {
					throw new Error(
						"Automation planner returned an empty scroll amount.",
					);
				}
				await sendReplayEvent({
					type: "wheel",
					requestId: crypto.randomUUID(),
					x: remoteWidth / 2,
					y: remoteHeight / 2,
					deltaX: 0,
					deltaY,
					expectedUrl,
					expectedTabId,
				});
				return {
					iteration,
					type,
					label,
					value: `${deltaY < 0 ? "up" : "down"} ${typeof action.screenPercent === "number" ? action.screenPercent : SCROLL_SCREEN_PERCENT}%`,
					pageUrl: expectedUrl || "",
					reason,
				};
			}
			if (!isRecord(action.selector)) {
				throw new Error("Automation action has no validated selector.");
			}
			const strategy =
				typeof action.selector.strategy === "string"
					? action.selector.strategy
					: "css";
			const selectorValue =
				typeof action.selector.value === "string"
					? action.selector.value
					: "";
			if (!selectorValue) {
				throw new Error("Automation action has an empty selector.");
			}
			const selector = {
				strategy,
				value: selectorValue,
				frameSelector:
					typeof action.selector.frameSelector === "string"
						? action.selector.frameSelector
						: null,
			};
			const tag = typeof action.tag === "string" ? action.tag : undefined;
			const isPassword = action.isPassword === true;
			const storeValue = action.storeValue === true;

			if (type === "click") {
				const coords = isRecord(action.coords) ? action.coords : {};
				await sendReplayEvent({
					type: "mouse-click",
					requestId: crypto.randomUUID(),
					x: typeof coords.x === "number" ? coords.x : 0,
					y: typeof coords.y === "number" ? coords.y : 0,
					button: "left",
					selector,
					label,
					tag,
					waitAfterMs: 500,
					expectedUrl,
					expectedTabId,
				});
				return {
					iteration,
					type,
					label,
					pageUrl: expectedUrl || "",
					reason,
				};
			}

			const value = typeof action.value === "string" ? action.value : "";
			if (!value)
				throw new Error("Automation planner returned an empty value.");
			await sendReplayEvent({
				type: "fill-element",
				requestId: crypto.randomUUID(),
				text: value,
				selector,
				label,
				tag: type === "select" ? "select" : tag,
				isPassword,
				storeValue,
				expectedUrl,
				expectedTabId,
			});
			return {
				iteration,
				type,
				label,
				value: isPassword ? "[REDACTED]" : value,
				pageUrl: expectedUrl || "",
				reason,
			};
		},
		[remoteHeight, remoteWidth, sendReplayEvent],
	);

	const cancelGoalAutomation = useCallback(() => {
		automationRunTokenRef.current += 1;
		setIsGoalAutomationRunning(false);
		setAutomationProgress(null);
		toast("Goal automation stopped.");
	}, []);

	const runGoalAutomation = useCallback(async () => {
		if (!sessionId) {
			toast("No active browser session.");
			return;
		}
		const roomId = toolContext?.roomId ?? "";
		if (!roomId) {
			toast(
				"No room context available — open this tool from a Playground room.",
			);
			return;
		}

		const runToken = automationRunTokenRef.current + 1;
		automationRunTokenRef.current = runToken;
		setAutomationMode(false);
		setIsGoalAutomationRunning(true);
		const history: AutomationHistoryEntry[] = [];
		const resolvedGoal = automationGoal.trim();
		let reachedGoal = false;
		if (!resolvedGoal) {
			setIsGoalAutomationRunning(false);
			toast("Review or enter an automation goal before running.");
			return;
		}

		try {
			for (
				let iteration = 1;
				iteration <= automationMaxIterations;
				iteration += 1
			) {
				if (automationRunTokenRef.current !== runToken) return;
				setAutomationProgress({
					iteration,
					maxIterations: automationMaxIterations,
				});

				const response = await runPixel<Record<string, unknown>>(
					`PlanNextPlaywrightAction(engine=${JSON.stringify(automationModelId)}, roomId=${JSON.stringify(roomId)}, sessionId=${JSON.stringify(sessionId)}, goal=${JSON.stringify(resolvedGoal)}, history=${JSON.stringify(JSON.stringify(history))}, iteration=${iteration}, maxIterations=${automationMaxIterations}, limit=20);`,
					insightId,
				);
				if (automationRunTokenRef.current !== runToken) return;

				const output = response.pixelReturn?.[0]?.output;
				if (!isRecord(output) || output.success !== true) {
					throw new Error(
						isRecord(output) && typeof output.error === "string"
							? output.error
							: "Browser automation planning failed.",
					);
				}
				if (!automationModelId && typeof output.engineId === "string") {
					setAutomationModelId(output.engineId);
				}
				const reason =
					typeof output.reason === "string" ? output.reason : "";
				if (output.goalReached === true) {
					reachedGoal = true;
					toast(reason || "Browser automation reached the goal.");
					return;
				}
				if (!isRecord(output.action)) {
					toast(
						reason || "Browser automation has no safe next action.",
					);
					return;
				}

				const completed = await executePlannedAutomationAction(
					output,
					iteration,
				);
				if (automationRunTokenRef.current !== runToken) return;
				history.push(completed);
			}

			if (!reachedGoal) {
				toast(
					`Browser automation stopped after ${automationMaxIterations} iterations without confirming the goal.`,
				);
			}
		} catch (error) {
			if (automationRunTokenRef.current === runToken) {
				toast(
					error instanceof Error
						? error.message
						: "Browser automation failed.",
				);
			}
		} finally {
			if (automationRunTokenRef.current === runToken) {
				setIsGoalAutomationRunning(false);
				setAutomationProgress(null);
			}
		}
	}, [
		automationGoal,
		automationMaxIterations,
		automationModelId,
		insightId,
		executePlannedAutomationAction,
		sessionId,
		toolContext?.roomId,
	]);

	return {
		automationMode,
		setAutomationMode,
		automationModelId,
		setAutomationModelId,
		automationSubMode,
		setAutomationSubMode,
		isAutomationGenerating,
		isGoalAutomationRunning,
		automationGoal,
		setAutomationGoal,
		isAutomationGoalGenerating,
		automationGoalGenerationError,
		setAutomationGoalGenerationError,
		automationMaxIterations,
		setAutomationMaxIterations,
		automationProgress,
		automationClickPos,
		resetAutomationGoal,
		generateAutomationGoal,
		handleFieldAutomationTarget,
		fillVisibleFieldsFromContext,
		cancelGoalAutomation,
		runGoalAutomation,
	};
}
