import { ClockIcon, MoveDownIcon, Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
	Badge,
	Button,
	Lead,
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
} from "@semoss/ui/next";
import {
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomArtifact,
	RoomConfiguration,
	RoomInput,
} from "@/components";
import { useAutoScroll, useChat } from "@/hooks";

// Styled components removed - using Tailwind CSS classes directly

const getDateTitle = (d: string) => {
	// Convert input to Date object if it's a string
	const compareDate = new Date(d);
	const now = new Date();

	// Calculate difference in milliseconds
	const diffTime = compareDate.getTime() - now.getTime();
	const absDiffTime = Math.abs(diffTime);

	// Convert to different time units
	const minutes = Math.floor(absDiffTime / (1000 * 60));
	const hours = Math.floor(absDiffTime / (1000 * 60 * 60));
	const days = Math.floor(absDiffTime / (1000 * 60 * 60 * 24));
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	let message = "";

	// Determine the most appropriate time unit and format
	if (absDiffTime < 1000) {
		message = "Just now";
	} else if (minutes < 1) {
		const seconds = Math.floor(absDiffTime / 1000);
		message =
			diffTime < 0
				? `${seconds} second${seconds !== 1 ? "s" : ""} ago`
				: `In ${seconds} second${seconds !== 1 ? "s" : ""}`;
	} else if (minutes < 60) {
		message =
			diffTime < 0
				? `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
				: `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
	} else if (hours < 24) {
		message =
			diffTime < 0
				? `${hours} hour${hours !== 1 ? "s" : ""} ago`
				: `In ${hours} hour${hours !== 1 ? "s" : ""}`;
	} else if (days < 7) {
		message =
			diffTime < 0
				? `${days} day${days !== 1 ? "s" : ""} ago`
				: `In ${days} day${days !== 1 ? "s" : ""}`;
	} else if (weeks < 4) {
		message =
			diffTime < 0
				? `${weeks} week${weeks !== 1 ? "s" : ""} ago`
				: `In ${weeks} week${weeks !== 1 ? "s" : ""}`;
	} else if (months < 12) {
		message =
			diffTime < 0
				? `${months} month${months !== 1 ? "s" : ""} ago`
				: `In ${months} month${months !== 1 ? "s" : ""}`;
	} else {
		message =
			diffTime < 0
				? `${years} year${years !== 1 ? "s" : ""} ago`
				: `In ${years} year${years !== 1 ? "s" : ""}`;
	}

	return message;
};

/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	/**
	 * Library Hooks
	 */
	const { chat } = useChat();

	const navigate = useNavigate();

	// set the get the room based on the params
	const { roomId } = useParams();

	// get the room
	const room = chat.getRoom(roomId);

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

		try {
			room.initialize();
		} catch (e) {
			toast.error(e.message);

			navigate("/");
		}
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
		<div className="flex h-[calc(100vh-theme(space.2))] w-full flex-col gap-2 overflow-hidden">
			<div className="flex w-full flex-row items-center px-4 py-3">
				<Lead
					title={room?.metadata?.name}
					className="w-full max-w-100 truncate text-md"
				>
					{room?.metadata?.name}
				</Lead>
				<div className="flex-1" />
				<Badge variant="secondary">
					<ClockIcon />
					{`Created ${getDateTitle(room?.metadata?.dateCreated)}`}
				</Badge>
			</div>
			<Separator />
			<div className="w-full flex-1 overflow-hidden p-2">
				<ResizablePanelGroup
					direction="horizontal"
					className="w-full flex-1 overflow-hidden"
				>
					<ResizablePanel className="flex h-full w-full flex-1 flex-col items-center overflow-hidden p-2">
						<div className="relative w-full flex-1 overflow-hidden">
							<ScrollArea
								className="h-full w-full"
								viewportRef={(ele) => setScrollEle(ele)}
							>
								<div className="mx-auto max-w-screen-xl space-y-2 px-0">
									{room.history.map((m, mIdx) => {
										if (!m.visible) {
											return null;
										}

										return (
											<div
												key={m.id}
												className="flex flex-col py-1"
											>
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
											</div>
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
												className="bg-primary text-primary-foreground shadow-md hover:shadow-lg"
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
						<div className="mx-auto w-full max-w-2xl shrink-0 px-2 pt-4">
							<RoomInput
								isLoading={room.isLoading}
								isDisabled={isDisabled}
								minRows={3}
								maxRows={8}
								configuration={
									<Tooltip>
										<TooltipTrigger asChild>
											<span>
												<Button
													size="sm"
													className={`${
														room.sidebar.isOpen &&
														room.sidebar.type ===
															"CONFIGURATION"
															? "text-primary"
															: ""
													}`}
													variant={"ghost"}
													type="button"
													aria-label="Open Configuration Menu"
													disabled={room.isLoading}
													onClick={() => {
														// toggle open / closed based on the state
														if (
															room.sidebar
																.isOpen &&
															room.sidebar
																.type ===
																"CONFIGURATION"
														) {
															room.closeSidebar();
														} else {
															room.openSidebar(
																"CONFIGURATION",
															);
														}
													}}
												>
													<Settings2Icon />
												</Button>
											</span>
										</TooltipTrigger>
										<TooltipContent>
											Open Configuration Menu
										</TooltipContent>
									</Tooltip>
								}
								onPrompt={async (prompt, files) => {
									await room.askMessage(prompt, files);

									return true;
								}}
							/>
						</div>
					</ResizablePanel>
					{room.sidebar.isOpen &&
						room.sidebar.type === "CONFIGURATION" && (
							<>
								<ResizableHandle className="my-auto h-32" />
								<ResizablePanel
									className={"relative p-2"}
									defaultSize={25}
								>
									<RoomConfiguration
										options={room.options}
										setOptions={(o) => {
											room.setOptions(o);
										}}
										onClose={() => {
											room.closeSidebar();
										}}
									/>
								</ResizablePanel>
							</>
						)}
					{room.sidebar.isOpen &&
						room.sidebar.type === "ARTIFACTS" && (
							<>
								<ResizableHandle className="my-auto h-32" />
								<ResizablePanel
									className={"relative p-2"}
									defaultSize={70}
								>
									<RoomArtifact room={room} />
								</ResizablePanel>
							</>
						)}
				</ResizablePanelGroup>
			</div>
		</div>
	);
});
