import { UndoIcon, WandSparklesIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { throwOnPixelErrors } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useChatSession } from "../../chat/provider/chat-session.context";
import type { RoomStore } from "../../room/store/room.store";

/** What the `LLM` reactor returns. */
interface LLMOutput {
	/** The model's reply, or an error message. */
	response?: string;
	[key: string]: unknown;
}

/** One pixel's result in the response. */
interface PixelReturn {
	/** The reactor's output. */
	output?: LLMOutput;
	/** Includes `ERROR` when the pixel failed. */
	operationType?: string[];
}

/** The response to the optimization pixel. */
interface LLMResponse {
	/** One result per pixel run. */
	pixelReturn?: PixelReturn[];
}

/** Props for {@link PromptOptimizer}. */
interface PromptOptimizerProps {
	/** Current composer text; replacements invalidate pending optimization. */
	input: string;
	/** Replace the composer text after optimization or revert. */
	onInputChange: React.Dispatch<React.SetStateAction<string>>;
	/** Prevent optimizing while the room is busy. */
	disabled: boolean;
	/** Supplies instructions and scopes pending requests. */
	room: RoomStore;
	/** Model selected in the composer. */
	modelId?: string;
}

/**
 * Escape text for the `LLM` reactor's quoted `command` argument.
 *
 * @param raw - The text.
 * @returns The text with backslashes, double quotes, and newlines escaped, safe inside `command=["..."]`.
 */
function escapeForPixelCommand(raw: string): string {
	return raw
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r?\n/g, "\\n");
}

/** Optimize the current draft, with a single-click revert until it changes. */
export const PromptOptimizer = ({
	input,
	onInputChange,
	disabled,
	modelId,
	room,
}: PromptOptimizerProps) => {
	const { run } = useSessionInsight();
	const { t } = useTranslation("room");
	const { chat } = useChatSession();

	const [isOptimizing, setIsOptimizing] = useState(false);
	const [isRevertShown, setIsRevertShown] = useState(false);
	// a token for the current draft, room, and model; a reply checks it is still current
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

	/** Ask the model for a clearer version of the draft and put it in the composer. */
	const handleImprovePrompt = async (): Promise<void> => {
		if (disabled || isOptimizing || !input.trim()) return;
		setIsOptimizing(true);
		const requestId = requestRef.current;

		try {
			prevInputRef.current = input;

			// the room's instructions give the model context, when set
			const context = room?.options?.instructions || "";

			const optimizationPrompt = `Please optimize the following prompt to be more clear, specific, and effective while maintaining its original intent:
				"${input}"
				Return only the optimized prompt without any additional explanation or formatting.`;

			const selectedModelId = modelId ?? chat?.models?.selected?.app_id;

			if (!selectedModelId) {
				throw new Error(t("optimizer.noModel"));
			}

			const escapedPrompt = escapeForPixelCommand(optimizationPrompt);
			const contextValue = context ? `"<encode>${context}</encode>"` : "";
			const pixel = `LLM(engine=["${selectedModelId}"], command=["${escapedPrompt}"], context=[${contextValue}], paramValues=[{"max_tokens":10000}]);`;
			const response = (await run(pixel).then(
				throwOnPixelErrors,
			)) as LLMResponse;
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
					if (msg.includes("permission") || msg.includes("access")) {
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
				setIsRevertShown(true);
			}

			onInputChange(newPrompt);
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

	/** Put back the draft from before the last optimization. */
	const handleRevert = () => {
		if (disabled || isOptimizing) return;
		onInputChange(prevInputRef.current);
		setIsRevertShown(false);
	};

	// editing the optimized text ends the chance to revert it
	useEffect(() => {
		if (input !== prevOptimizedRef.current) {
			setIsRevertShown(false);
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
							isRevertShown
								? t("optimizer.revert")
								: t("optimizer.optimize")
						}
						disabled={disabled || isOptimizing || !input.trim()}
						onClick={
							isRevertShown ? handleRevert : handleImprovePrompt
						}
					>
						{isOptimizing ? (
							<Spinner />
						) : isRevertShown ? (
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
					: isRevertShown
						? t("optimizer.revert")
						: t("optimizer.optimize")}
			</TooltipContent>
		</Tooltip>
	);
};
