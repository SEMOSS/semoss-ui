import { MoveDownIcon, TriangleAlertIcon } from "lucide-react";
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
	AppLogo,
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomConfigurationButton,
	RoomFileExplorerButton,
	RoomInput,
	RoomInputMenuPlugin,
} from "@/components";
import { useAutoScroll, useLoadingMessage } from "@/hooks";
import type { RoomStore } from "@/stores";

interface RoomContentProps {
	/** Room to load */
	room: RoomStore;
}

/**
 * The page for a room
 *
 * @component
 */
export const RoomContent: React.FC<RoomContentProps> = observer(({ room }) => {
	/**
	 * Library hooks
	 */
	// Auto-scroll hook - tracks room history length to trigger scroll on new messages
	const { setScrollEle, scrollToBottom, isUserScrolled } = useAutoScroll(
		room.history?.length || 0,
	);
	const loadingMessage = useLoadingMessage(room.isLoading);

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
					tool.tool_status,
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

	const tempTokensUsed = 270; //
	const tempTokensMax = 2500; //

	return (
		<div className="flex h-full w-full flex-col bg-secondary-background transition-all duration-200 ease-in-out">
			<div className="relative w-full flex-1 overflow-hidden">
				<ScrollArea
					className="h-full w-full"
					viewportRef={(ele) => setScrollEle(ele)}
				>
					<div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
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

						{room.isLoading ? (
							<div className="flex items-center gap-3 rounded-lg border p-3 text-muted-foreground text-sm shadow-sm">
								<div className="flex h-10 w-10 items-center justify-center rounded-full">
									<div className="flex h-8 w-8 animate-spin items-center justify-center">
										<AppLogo full={false} />
									</div>
								</div>
								<span>{loadingMessage}</span>
							</div>
						) : room.error ? (
							<div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
								<div className="flex h-10 w-10 items-center justify-center rounded-full">
									<TriangleAlertIcon className="h-6 w-6" />
								</div>
								<span>
									Unable to process request. Please check your
									connection, copy your message, and refresh.
								</span>
							</div>
						) : null}
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
					className="max-h-56 min-h-24"
					isLoading={room.isLoading}
					plugins={
						<RoomInputMenuPlugin
							options={room.options}
							setOptions={room.setOptions}
						/>
					}
					configuration={
						<>
							<RoomFileExplorerButton room={room} />
							<RoomConfigurationButton room={room} />
						</>
					}
					onPrompt={handlePrompt}
					tokensMax={tempTokensMax}
					tokensUsed={tempTokensUsed}
					hasOutstandingTools={room.hasUnfinishedTools}
					hideLoadingSpinner
				/>
			</div>
		</div>
	);
});
