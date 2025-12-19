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

const PROMPT_OPTIMIZER_FUNCTION = "23583ab4-4738-4fe8-a7e9-737a14da734w";

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

				// Call platform optimizer
				const response = await actions.run<{ response: string }[]>(
					`ExecuteFunctionEngine( engine = ${JSON.stringify(
						PROMPT_OPTIMIZER_FUNCTION,
					)}, map=[{ "roomId": "${insightId}", "modelId": ${JSON.stringify(
						chat?.models?.selected?.app_id,
					)}, "prompt":${JSON.stringify(input)}}] )`,
				);

				if (!response?.pixelReturn?.[0]) {
					throw new Error("Invalid response structure from LLM");
				}
				const { output, operationType } = response.pixelReturn[0];
				const newPrompt = output?.response;

				if (operationType?.includes("ERROR") || !newPrompt) {
					throw new Error(
						output?.[0]?.response || "LLM operation failed",
					);
				}

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
