import { MoveDownIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	Button,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	ScrollArea,
	Separator,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useSidebar,
} from "@semoss/ui/next";
import {
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomConfigurationButton,
	RoomInput,
	RoomSidebar,
} from "@/components";
import { useAutoScroll, useChat } from "@/hooks";
import { RoomStore } from "@/stores";

// Styled components removed - using Tailwind CSS classes directly

/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	const { chat } = useChat();

	const navigate = useNavigate();
	const { open } = useSidebar();

	// set the get the room based on the params
	const { roomId } = useParams();

	// create the room
	const room = useMemo(() => {
		if (!roomId) {
			return null;
		}

		return new RoomStore(roomId);
	}, [roomId]);

	// Auto-scroll hook - tracks room history length to trigger scroll on new messages
	const { setScrollEle, scrollToBottom, isUserScrolled } = useAutoScroll(
		room?.history?.length || 0,
	);

	/**
	 * Effects
	 */

	// load the room
	useEffect(() => {
		if (!room || room.isInitialized) {
			return;
		}

		// if it doesn't load successfully, go back to home
		room.initialize().catch((e) => {
			toast.error(e.message);

			navigate("/");
		});
	}, [room, navigate]);

	// create a listener to process messages from the room
	useEffect(() => {
		// ignore if there is no room
		if (!room) {
			return;
		}

		const handleMessage = async (
			event: MessageEvent<{
				type: "SMSS_EXEC_TOOL";
				tool: {
					type: "MCP";
					message: string;
					id: string;
					name: string;
					response: string;
				};
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

	if (!room && chat.isInitialized) {
		// if the chat is initialized and there is no room, the room id is invalid - go back to home
		return <Navigate to="/" replace={true} />;
	}

	if (!room || !room.isInitialized) {
		// room is valid, but not initialized yet
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	let isDisabled = false;
	// If the plan is executing, only the execution step is enabled
	if (room.mode === "executing") {
		isDisabled = room.plan?.step?.details.stepType !== "human_intervention";
	}

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			<div className="flex h-12.5 w-full flex-row items-center px-6">
				<div className="flex flex-row items-center justify-center gap-2">
					{!open && (
						<>
							<div className="w-5"> &nbsp;</div>
							<Separator
								orientation="vertical"
								style={{ height: "15px" }}
							/>
						</>
					)}
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage
									title={room?.metadata?.name}
									className="max-w-100 truncate text-foreground"
								>
									{room?.metadata?.name}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className="flex-1" />
			</div>
			<Separator />
			<div className="w-full flex-1 overflow-hidden">
				<ResizablePanelGroup
					direction="horizontal"
					className="w-full flex-1 overflow-hidden"
				>
					<ResizablePanel className="flex h-full w-full flex-1 flex-col items-center overflow-hidden px-4 pb-4">
						<div className="relative w-full flex-1 overflow-hidden">
							<ScrollArea
								className="h-full w-full"
								viewportRef={(ele) => setScrollEle(ele)}
							>
								<div className="mx-auto max-w-4xl space-y-9 px-0 py-6">
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
													<ResponseMessage
														message={m}
													/>
												)}
												{m.type === "PLAN" && (
													<PlanMessage
														message={m}
														isLast={
															mIdx ===
															room.history
																.length -
																1
														}
													/>
												)}
											</React.Fragment>
										);
									})}
								</div>
							</ScrollArea>

							{isUserScrolled && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="absolute right-4 bottom-4 z-50">
											<Button
												size="sm"
												onClick={() => scrollToBottom()}
												aria-label="Scroll to bottom"
											>
												<MoveDownIcon />
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent>
										Scroll to bottom
									</TooltipContent>
								</Tooltip>
							)}
						</div>
						<div className="mx-auto w-full max-w-4xl shrink-0 px-2 pt-4">
							<RoomInput
								isLoading={room.isLoading}
								isDisabled={isDisabled}
								minRows={3}
								maxRows={8}
								configuration={
									<RoomConfigurationButton room={room} />
								}
								onPrompt={async (prompt, files) => {
									// update the options
									await room.updateRoomOptions(room.options);

									// ask the room
									await room.askMessage(prompt, files);

									return true;
								}}
							/>
						</div>
					</ResizablePanel>
					{room.sidebar.isOpen && (
						<>
							<ResizableHandle />
							<ResizablePanel
								className={"relative p-2"}
								defaultSize={70}
							>
								<RoomSidebar room={room} />
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
			</div>
		</div>
	);
});
