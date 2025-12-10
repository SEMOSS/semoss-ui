import { MoveDownIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import type { MCPToolResponse } from "@semoss/sdk";
import {
	Button,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	ErrorMessage,
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomConfigurationButton,
	RoomInput,
} from "@/components";
import { useAutoScroll } from "@/hooks";
import type { RoomStore } from "@/stores";

// Styled components removed - using Tailwind CSS classes directly

interface RoomProps {
	/** Room to load */
	room: RoomStore;
}

/**
 * The page for a room
 *
 * @component
 */
export const Room: React.FC<RoomProps> = observer(({ room }) => {
	/**
	 * Library hooks
	 */
	// Auto-scroll hook - tracks room history length to trigger scroll on new messages
	const { setScrollEle, scrollToBottom, isUserScrolled } = useAutoScroll(
		room.history?.length || 0,
	);

	/**
	 * Functions
	 */
	const handlePrompt = async (prompt: string, files: File[]) => {
		// update the options
		await room.updateRoomOptions(room.options);

		// ask the room
		await room.askMessage(prompt, files);

		return true;
	};

	/**
	 * Effects
	 */
	// create a listener to process messages from the room
	useEffect(() => {
		const handleMessage = async (
			event: MessageEvent<{
				type: "SMSS_EXEC_TOOL";
				tool: MCPToolResponse;
			}>,
		) => {
			try {
				if (!event.data || event.data.type !== "SMSS_EXEC_TOOL") {
					return;
				}

				const tool = event.data.tool;

				room.processTool(
					tool.message,
					tool.id,
					tool.name,
					tool.response,
				);
			} catch {
				// noop
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [room]);

	const isDisabled = Boolean(room.error) || room.mode === "executing";

	return (
		<div className="flex h-full w-full flex-col bg-secondary-background transition-all duration-200 ease-in-out">
			<div className="relative w-full flex-1 overflow-hidden">
				<ScrollArea
					className="h-full w-full"
					viewportRef={(ele) => setScrollEle(ele)}
				>
					<div className="mx-auto max-w-4xl space-y-9 px-4 py-6">
						{room.history.map((m, mIdx) => {
							if (!m.visible) {
								return null;
							}

							return (
								<React.Fragment key={m.id}>
									{m.type === "INPUT" && (
										<InputMessage message={m} />
									)}
									{m.type === "RESPONSE" && (
										<ResponseMessage message={m} />
									)}
									{m.type === "PLAN" && (
										<PlanMessage
											message={m}
											isLast={
												mIdx === room.history.length - 1
											}
										/>
									)}
								</React.Fragment>
							);
						})}
						{room.error && <ErrorMessage />}
					</div>
				</ScrollArea>

				{isUserScrolled && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="absolute right-4 bottom-4 z-50">
								<Button
									size="icon-sm"
									variant={"outline"}
									onClick={() => scrollToBottom()}
									aria-label="Scroll to bottom"
									className="shadow-lg"
								>
									<MoveDownIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>Scroll to bottom</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div className="mx-auto w-full max-w-4xl shrink-0 p-4">
				<RoomInput
					isLoading={room.isLoading}
					isDisabled={isDisabled}
					minRows={3}
					maxRows={8}
					configuration={<RoomConfigurationButton room={room} />}
					onPrompt={handlePrompt}
					clearInputOnPrompt
				/>
			</div>
		</div>
	);
});
