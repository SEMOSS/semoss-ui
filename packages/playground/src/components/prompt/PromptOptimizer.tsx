import { UndoIcon, ZapIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";

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

interface PromptOptimizerProps {
	input: string;
	setInput: React.Dispatch<React.SetStateAction<string>>;
	disabled: boolean;
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = observer(
	({ input, setInput, disabled }) => {
		const { actions, insightId } = useInsight();
		const { chat } = useChat();

		// State for loading, revert, etc
		const [isOptimizing, setIsOptimizing] = useState(false);
		const [showRevert, setShowRevert] = useState(false);
		const prevInputRef = useRef<string>("");
		const prevOptimizedRef = useRef<string>("");

		// Core optimization logic
		const handleImprovePrompt = async () => {
			if (disabled || isOptimizing || !input.trim()) return;
			setIsOptimizing(true);

			try {
				// Store input before optimizing
				prevInputRef.current = input;

				// Create optimization prompt
				const optimizationPrompt = `Please optimize the following prompt to be more clear, specific, and effective while maintaining its original intent:
				"${input}"
				Return only the optimized prompt without any additional explanation or formatting.`;

				// Use modelId from useLLM hook or fallback to chat selection
				const selectedModelId = chat?.models?.selected?.app_id;

				if (!selectedModelId) {
					throw new Error("No model selected");
				}

				// Call LLM directly using the selected model - fix pixel syntax
				const escapedPrompt = optimizationPrompt.replace(/"/g, '\\"');
				const pixel = `LLM(engine=["${selectedModelId}"], command=["${escapedPrompt}"], paramValues=[{"temperature":0.3, "max_tokens":1000}]);`;
				
				const response = await actions.run(pixel) as LLMResponse;

				// Rest of your code remains the same...
				if (!response?.pixelReturn?.[0]) {
					throw new Error("Invalid response structure from LLM");
				}

				const { output, operationType } = response.pixelReturn[0];

				if (operationType?.includes("ERROR")) {
					const errorMessage = output?.response || output || "LLM operation failed";
					
					if (typeof errorMessage === "string") {
						if (errorMessage.toLowerCase().includes("token limit") || 
							errorMessage.toLowerCase().includes("context length")) {
							throw new Error("Prompt is too large for optimization. Please shorten it first.");
						} else if (errorMessage.toLowerCase().includes("permission") || 
								errorMessage.toLowerCase().includes("access")) {
							throw new Error("You do not have permission to use this model");
						} else {
							throw new Error(errorMessage);
						}
					} else {
						throw new Error("LLM operation failed");
					}
				}

				const newPrompt = output?.response;

				if (!newPrompt) {
					throw new Error("No optimized prompt received");
				}

				// Only show revert if the prompt actually changed
				if (newPrompt !== input) {
					prevOptimizedRef.current = newPrompt;
					setShowRevert(true);
				}

				setInput(newPrompt);
				toast.success("Prompt optimized!");
			} catch (e: unknown) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "Failed to optimize prompt";
				toast.error(errorMessage);
			} finally {
				setIsOptimizing(false);
			}
		};

		// Handle revert logic
		const handleRevert = () => {
			setInput(prevInputRef.current);
			setShowRevert(false);
		};

		// Hide revert if input changes externally
		useEffect(() => {
			if (input !== prevOptimizedRef.current) {
				setShowRevert(false);
			}
		}, [input]);

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={
							showRevert
								? "Revert Optimized Prompt"
								: "Optimize Prompt"
						}
						disabled={disabled || isOptimizing || !input.trim()}
						onClick={
							showRevert ? handleRevert : handleImprovePrompt
						}
					>
						{isOptimizing ? (
							<Spinner />
						) : showRevert ? (
							<UndoIcon />
						) : (
							<ZapIcon />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{isOptimizing
						? "Optimizing…"
						: showRevert
							? "Revert to previous prompt"
							: "Optimize Prompt"}
				</TooltipContent>
			</Tooltip>
		);
	},
);