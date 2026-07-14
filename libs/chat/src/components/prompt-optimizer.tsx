import { TriangleAlertIcon, UndoIcon, WandSparklesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

export interface PromptOptimizerProps {
	/** Current composer text. */
	input: string;
	setInput: (value: string) => void;
	disabled?: boolean;
	/** engine_id to run the optimization LLM call against — required to optimize (matches playground: no model selected means no-op). */
	modelId?: string;
	/** Optional extra context passed to the optimization pixel call — playground's real feature threads `room.options.instructions` here; omit if the host has none. */
	instructions?: string;
}

interface LLMOutput {
	response?: string;
	[key: string]: unknown;
}

interface PixelReturn {
	output?: LLMOutput;
	operationType?: string[];
}

interface LLMResponse {
	pixelReturn?: PixelReturn[];
}

/** Ensures the command string is safe inside `command=["..."]`. */
function escapeForPixelCommand(raw: string): string {
	return raw
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r?\n/g, "\\n");
}

function buildErrorMessage(output: LLMOutput | undefined): string {
	const raw = output?.response ?? output;
	if (typeof raw !== "string") {
		return "LLM operation failed";
	}
	const lower = raw.toLowerCase();
	if (lower.includes("token limit") || lower.includes("context length")) {
		return "Prompt is too large for optimization. Please shorten it first.";
	}
	if (lower.includes("permission") || lower.includes("access")) {
		return "You do not have permission to use this model";
	}
	return raw;
}

/**
 * "Improve prompt" button — sends the composer's current text through a
 * one-off `LLM(...)` pixel call to rewrite it, with a one-step Undo.
 * Ported from playground's real components/prompt/PromptOptimizer.tsx —
 * already self-contained there (calls `useInsight()`'s actions directly,
 * same as this library's own hooks), no room/store dependency to strip
 * beyond making the `instructions` context optional instead of required.
 * Surfaces errors via the tooltip text instead of `toast.error`/
 * `toast.success` — matches this library's existing low-stakes-feedback
 * pattern (e.g. CopyButton's checkmark toggle) rather than requiring every
 * host app to mount a `<Toaster>` just for this one control.
 */
export function PromptOptimizer({
	input,
	setInput,
	disabled = false,
	modelId,
	instructions,
}: PromptOptimizerProps) {
	const { actions } = useInsight();
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [showRevert, setShowRevert] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const prevInputRef = useRef("");
	const prevOptimizedRef = useRef("");

	useEffect(() => {
		if (input !== prevOptimizedRef.current) {
			setShowRevert(false);
		}
		setError(null);
	}, [input]);

	async function handleImprovePrompt() {
		if (disabled || isOptimizing || !input.trim() || !modelId) {
			return;
		}
		setIsOptimizing(true);
		setError(null);

		try {
			prevInputRef.current = input;

			const optimizationPrompt = `Please optimize the following prompt to be more clear, specific, and effective while maintaining its original intent:
				"${input}"
				Return only the optimized prompt without any additional explanation or formatting.`;

			const escapedPrompt = escapeForPixelCommand(optimizationPrompt);
			const contextValue = instructions
				? `"<encode>${instructions}</encode>"`
				: "";
			const pixel = `LLM(engine=["${modelId}"], command=["${escapedPrompt}"], context=[${contextValue}], paramValues=[{"temperature":0.3, "max_tokens":10000}]);`;
			const response = (await actions.run(pixel)) as LLMResponse;
			const result = response?.pixelReturn?.[0];
			if (!result) {
				throw new Error("Invalid response structure from LLM");
			}

			if (result.operationType?.includes("ERROR")) {
				throw new Error(buildErrorMessage(result.output));
			}

			const newPrompt = result.output?.response;
			if (!newPrompt) {
				throw new Error("No optimized prompt received");
			}

			if (newPrompt !== input) {
				prevOptimizedRef.current = newPrompt;
				setShowRevert(true);
			}
			setInput(newPrompt);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to optimize prompt",
			);
		} finally {
			setIsOptimizing(false);
		}
	}

	function handleRevert() {
		setInput(prevInputRef.current);
		setShowRevert(false);
	}

	const isDisabled = disabled || isOptimizing || !input.trim() || !modelId;
	const label = error
		? error
		: showRevert
			? "Revert optimized prompt"
			: "Optimize prompt";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					data-slot="prompt-optimizer"
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={label}
					disabled={isDisabled}
					onClick={
						showRevert
							? handleRevert
							: () => void handleImprovePrompt()
					}
				>
					{isOptimizing ? (
						<Spinner />
					) : error ? (
						<TriangleAlertIcon className="text-destructive" />
					) : showRevert ? (
						<UndoIcon />
					) : (
						<WandSparklesIcon />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{isOptimizing ? "Optimizing…" : label}
			</TooltipContent>
		</Tooltip>
	);
}
