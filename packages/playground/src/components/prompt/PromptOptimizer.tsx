import { UndoIcon, WandSparklesIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks/use-chat";
import type { RoomStore } from "@/stores/room/room.store";

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
	/** Current composer text; replacements invalidate pending optimization. */
	input: string;
	/** Replace the composer text after optimization or revert. */
	setInput: React.Dispatch<React.SetStateAction<string>>;
	/** Prevent optimizing while the room is busy. */
	disabled: boolean;
	/** Supplies instructions and scopes pending requests. */
	room: RoomStore;
	/** Model selected in the composer. */
	modelId?: string;
}

/** Escape the existing LLM command argument. */
function escapeForPixelCommand(raw: string): string {
	// Ensure the command string is safe inside: command=["..."]
	// Escape backslashes, double quotes, and newlines.
	return raw
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r?\n/g, "\\n");
}

/** Optimize the current draft, with a single-click revert until it changes. */
export const PromptOptimizer: React.FC<PromptOptimizerProps> = observer(
	({ input, setInput, disabled, modelId, room }) => {
		const { actions } = useInsight();
		const { t } = useTranslation("room");
		const { chat } = useChat();

		const [isOptimizing, setIsOptimizing] = useState(false);
		const [showRevert, setShowRevert] = useState(false);
		const requestRef = useRef<object | null>(null);
		const prevInputRef = useRef<string>("");
		const prevOptimizedRef = useRef<string>("");

		// Ignore replies for a draft/room/model that has changed or unmounted.
		useEffect(() => {
			requestRef.current = { input, room, disabled, modelId };
			setIsOptimizing(false);
			return () => {
				requestRef.current = null;
			};
		}, [input, room, disabled, modelId]);

		const handleImprovePrompt = async (): Promise<void> => {
			if (disabled || isOptimizing || !input.trim()) return;
			setIsOptimizing(true);
			const requestId = requestRef.current;

			try {
				prevInputRef.current = input;

				//Build the context if it is there
				const context = room?.options?.instructions || "";

				const optimizationPrompt = `Please optimize the following prompt to be more clear, specific, and effective while maintaining its original intent:
				"${input}"
				Return only the optimized prompt without any additional explanation or formatting.`;

				const selectedModelId =
					modelId ?? chat?.models?.selected?.app_id;

				if (!selectedModelId) {
					throw new Error(t("optimizer.noModel"));
				}

				const escapedPrompt = escapeForPixelCommand(optimizationPrompt);
				const contextValue = context
					? `"<encode>${context}</encode>"`
					: "";
				const pixel = `LLM(engine=["${selectedModelId}"], command=["${escapedPrompt}"], context=[${contextValue}], paramValues=[{"max_tokens":10000}]);`;
				const response = (await actions.run(pixel)) as LLMResponse;
				if (requestId !== requestRef.current) return;

				if (!response?.pixelReturn?.[0]) {
					throw new Error(t("optimizer.invalidResponse"));
				}

				const { output, operationType } = response.pixelReturn[0];

				if (operationType?.includes("ERROR")) {
					const errorMessage =
						output?.response || output || t("optimizer.failed");

					if (typeof errorMessage === "string") {
						const msg = errorMessage.toLowerCase();
						if (
							msg.includes("token limit") ||
							msg.includes("context length")
						) {
							throw new Error(t("optimizer.tooLarge"));
						}
						if (
							msg.includes("permission") ||
							msg.includes("access")
						) {
							throw new Error(t("optimizer.noPermission"));
						}
						throw new Error(errorMessage);
					}

					throw new Error(t("optimizer.failed"));
				}

				const newPrompt = output?.response;

				if (typeof newPrompt !== "string" || !newPrompt.trim()) {
					throw new Error(t("optimizer.invalidResponse"));
				}

				if (newPrompt !== input) {
					prevOptimizedRef.current = newPrompt;
					setShowRevert(true);
				}

				setInput(newPrompt);
				toast.success(t("optimizer.success"));
			} catch (e: unknown) {
				if (requestId !== requestRef.current) return;
				const errorMessage =
					e instanceof Error ? e.message : t("optimizer.failed");
				toast.error(errorMessage);
			} finally {
				if (requestId === requestRef.current) setIsOptimizing(false);
			}
		};

		const handleRevert = () => {
			if (disabled || isOptimizing) return;
			setInput(prevInputRef.current);
			setShowRevert(false);
		};

		useEffect(() => {
			if (input !== prevOptimizedRef.current) {
				setShowRevert(false);
			}
		}, [input]);

		return (
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<span className="inline-flex">
						<Button
							type="button"
							className="rounded-full"
							variant="ghost"
							size="icon-sm"
							aria-label={
								showRevert
									? t("optimizer.revert")
									: t("optimizer.optimize")
							}
							disabled={disabled || isOptimizing || !input.trim()}
							onClick={
								showRevert ? handleRevert : handleImprovePrompt
							}
						>
							{isOptimizing ? (
								<Spinner />
							) : showRevert ? (
								<UndoIcon aria-hidden="true" />
							) : (
								<WandSparklesIcon aria-hidden="true" />
							)}
						</Button>
					</span>
				</TooltipTrigger>
				<TooltipContent>
					{isOptimizing
						? t("optimizer.optimizing")
						: showRevert
							? t("optimizer.revert")
							: t("optimizer.optimize")}
				</TooltipContent>
			</Tooltip>
		);
	},
);
