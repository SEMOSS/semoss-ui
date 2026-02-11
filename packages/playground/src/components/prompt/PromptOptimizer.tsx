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
import type {RoomStore} from "@/stores";

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
	room: RoomStore;
	modelId?: string;
}

function escapeForPixelCommand(raw: string): string {
	// Ensure the command string is safe inside: command=["..."]
	// Escape backslashes, double quotes, and newlines.
	return raw
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r?\n/g, "\\n");
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = observer(
	({ input, setInput, disabled, modelId, room }) => {
		const { actions} = useInsight();
		const { chat } = useChat();

		const [isOptimizing, setIsOptimizing] = useState(false);
		const [showRevert, setShowRevert] = useState(false);
		const prevInputRef = useRef<string>("");
		const prevOptimizedRef = useRef<string>("");

		const handleImprovePrompt = async () => {
			if (disabled || isOptimizing || !input.trim()) return;
			setIsOptimizing(true);

			try {
				prevInputRef.current = input;

			//Build the context if it is there
			let context = room?.options?.instructions || "";
			console.log('=== DEBUG CONTEXT ===');
			console.log('room exists:', !!room);
			console.log('room.options exists:', !!room?.options);
			console.log('instructions value:', room?.options?.instructions);
			console.log('final context:', context);
			console.log('context is empty:', context === "");
			console.log('===================');

				let optimizationPrompt = `Please optimize the following prompt to be more clear, specific, and effective while maintaining its original intent:
				"${input}"
				Return only the optimized prompt without any additional explanation or formatting.`;

				const selectedModelId = modelId ?? chat?.models?.selected?.app_id;

				if (!selectedModelId) {
					throw new Error("No model selected");
				}

				const escapedPrompt = escapeForPixelCommand(optimizationPrompt);
				const contextValue = context ? `"<encode>${context}</encode>"` : '';
				const pixel = `LLM(engine=["${selectedModelId}"], command=["${escapedPrompt}"], context=[${contextValue}], paramValues=[{"temperature":0.3, "max_tokens":10000}]);`;
				const response = (await actions.run(pixel)) as LLMResponse;

				if (!response?.pixelReturn?.[0]) {
					throw new Error("Invalid response structure from LLM");
				}

				const { output, operationType } = response.pixelReturn[0];

				if (operationType?.includes("ERROR")) {
					const errorMessage = output?.response || output || "LLM operation failed";

					if (typeof errorMessage === "string") {
						const msg = errorMessage.toLowerCase();
						if (msg.includes("token limit") || msg.includes("context length")) {
							throw new Error(
								"Prompt is too large for optimization. Please shorten it first.",
							);
						}
						if (msg.includes("permission") || msg.includes("access")) {
							throw new Error("You do not have permission to use this model");
						}
						throw new Error(errorMessage);
					}

					throw new Error("LLM operation failed");
				}

				const newPrompt = output?.response;

				if (!newPrompt) {
					throw new Error("No optimized prompt received");
				}

				if (newPrompt !== input) {
					prevOptimizedRef.current = newPrompt;
					setShowRevert(true);
				}

				setInput(newPrompt);
				toast.success("Prompt optimized!");
			} catch (e: unknown) {
				const errorMessage = e instanceof Error ? e.message : "Failed to optimize prompt";
				toast.error(errorMessage);
			} finally {
				setIsOptimizing(false);
			}
		};

		const handleRevert = () => {
			setInput(prevInputRef.current);
			setShowRevert(false);
		};

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
						aria-label={showRevert ? "Revert Optimized Prompt" : "Optimize Prompt"}
						disabled={disabled || isOptimizing || !input.trim()}
						onClick={showRevert ? handleRevert : handleImprovePrompt}
					>
						{isOptimizing ? <Spinner /> : showRevert ? <UndoIcon /> : <ZapIcon />}
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