import { CogIcon, ListTodoIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { RoomConfiguration, RoomInput } from "@/components";
import { AgentChip } from "@/components/agent";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Agent } from "@/types";

const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION
	? import.meta.env.VITE_APP_DESCRIPTION
	: "";

const ENABLE_PLANNING = import.meta.env.VITE_ENABLE_PLANNING === "true";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	/**
	 * Library Hooks
	 */
	const { chat } = useChat();
	const navigate = useNavigate();
	const { agentId } = useParams() as { agentId?: string };
	const { data: agent, status } = usePixel<Agent>(
		agentId ? `GetWorkspace("${agentId}");` : null,
	);
	const isLoadingAgent = status === "LOADING";

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<RoomStore["options"]>({
		instructions: "",
		tools: [],
		tokenLength: TOKEN_LENGTH,
		temperature: TEMPERATURE,
	});

	const [isPlanning, setIsPlanning] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	/**
	 * Functions
	 */

	/**
	 * Ask the model
	 *
	 * @param - input
	 */
	const askMessage = async (prompt: string, files: File[]) => {
		// ignore if loading
		if (isLoading) {
			return;
		}

		// turn the loading screen
		setIsLoading(true);

		const usingAgent = agentId && agent !== null;

		// create a new room
		const room = await chat.createRoom(
			prompt,
			isPlanning ? "planning" : "chat",
			chat.models.selected,
			usingAgent
				? {
						instructions: "",
						// knowledge: null,
						tools: [],
						tokenLength: TOKEN_LENGTH,
						temperature: TEMPERATURE,
					}
				: options,
			usingAgent ? agent : undefined,
		);

		// ask the room
		await room.askMessage(prompt, files);

		// turn the loading screen off
		setIsLoading(false);

		// go to the new room
		navigate(`/room/${room.roomId}`);
	};

	return (
		<ResizablePanelGroup direction="horizontal" className="">
			<ResizablePanel className="flex flex-col items-center justify-center overflow-auto">
				<div className="mx-auto w-full max-w-2xl">
					<Card className="w-full">
						<CardHeader>
							<CardTitle>Welcome!</CardTitle>
							<CardDescription>{APP_DESCRIPTION}</CardDescription>
						</CardHeader>
						<CardContent>
							<RoomInput
								isLoading={isLoading || isLoadingAgent}
								isDisabled={false}
								minRows={4}
								maxRows={8}
								actions={
									<div className="flex flex-row items-center">
										{agentId ? (
											<AgentChip
												agent={agent}
												loading={isLoadingAgent}
											/>
										) : (
											<Tooltip>
												<TooltipTrigger>
													<Button
														aria-label="Open Configuration Menu"
														className={`${isMenuOpen ? "text-primary" : ""}`}
														disabled={isLoading}
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setIsMenuOpen(
																!isMenuOpen,
															);
														}}
													>
														<CogIcon />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Open Configuration Menu
												</TooltipContent>
											</Tooltip>
										)}
										{ENABLE_PLANNING && (
											<Tooltip>
												<TooltipTrigger>
													<Button
														aria-label="Generate plan"
														className={`${isPlanning ? "text-primary hover:text-primary" : ""}`}
														disabled={isLoading}
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setIsPlanning(
																!isPlanning,
															);
														}}
													>
														<ListTodoIcon />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Note: This is a beta
													feature. Use this to
													generate plan
												</TooltipContent>
											</Tooltip>
										)}
									</div>
								}
								onPrompt={async (prompt, files) => {
									await askMessage(prompt, files);

									return true;
								}}
							/>
						</CardContent>
					</Card>
				</div>
			</ResizablePanel>

			{isMenuOpen && (
				<>
					<ResizableHandle />
					<ResizablePanel className="relative" defaultSize={25}>
						<RoomConfiguration
							options={options}
							setOptions={(o) => {
								setOptions(o);
							}}
							onClose={() => {
								setIsMenuOpen(false);
							}}
						/>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
});
