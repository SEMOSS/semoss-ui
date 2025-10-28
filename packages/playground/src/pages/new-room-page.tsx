import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import background from "@/assets/img/background.svg";
import { RoomAgent, RoomConfiguration, RoomInput } from "@/components";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Agent } from "@/types";

const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION
	? import.meta.env.VITE_APP_DESCRIPTION
	: "";

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
	const [searchParams] = useSearchParams();
	const [mode, setMode] = useState<{
		type: "chat" | "plan" | "agent";
		agent: Agent | null;
	}>({
		type: "chat",
		agent: null,
	});

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

		// create a new room
		const room = await chat.createRoom(
			prompt,
			mode.type === "plan" ? "planning" : "chat",
			chat.models.selected,
			options,
			mode.type === "agent" && mode.agent ? mode.agent : undefined,
		);

		// ask the room
		await room.askMessage(prompt, files);

		// turn the loading screen off
		setIsLoading(false);

		// go to the new room
		navigate(`/room/${room.roomId}`);
	};

	const agentId = searchParams.get("agentId");
	const getWorkspace = usePixel<Agent | null>(
		agentId ? `GetWorkspace("${agentId}");` : null,
		{
			data: null,
		},
	);

	// if the agentId is passed in, use taht to set the mode
	useEffect(() => {
		if (getWorkspace.status !== "SUCCESS") {
			return;
		}

		if (getWorkspace.data) {
			setMode({
				type: "agent",
				agent: getWorkspace.data,
			});
		}
	}, [getWorkspace.status, getWorkspace.data]);

	return (
		<div
			className="h-full w-full"
			style={{ backgroundImage: `url(${background})` }}
		>
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel className="flex flex-col items-center justify-center overflow-auto p-2">
					<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
						<div className="mx-auto flex max-w-xl flex-col items-center gap-3">
							<div className="text-center font-semibold text-4xl text-foreground leading-normal">
								Welcome
							</div>
							<div className="text-center text-muted-foreground text-sm leading-normal">
								{APP_DESCRIPTION}
							</div>
						</div>

						<RoomInput
							isLoading={
								isLoading ||
								(agentId && getWorkspace.status !== "SUCCESS")
							}
							isDisabled={false}
							minRows={4}
							maxRows={8}
							agent={
								<RoomAgent mode={mode} onModeChange={setMode} />
							}
							configuration={
								<Tooltip>
									<TooltipTrigger asChild>
										<span>
											<Button
												aria-label="Open Configuration Menu"
												className={`${isMenuOpen ? "text-primary" : ""}`}
												disabled={isLoading}
												variant="ghost"
												size="icon-sm"
												onClick={() => {
													setIsMenuOpen(!isMenuOpen);
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
								await askMessage(prompt, files);

								return true;
							}}
						/>
					</div>
				</ResizablePanel>

				{isMenuOpen && (
					<>
						<ResizableHandle className="my-auto h-32" />
						<ResizablePanel
							className="relative p-2"
							defaultSize={25}
						>
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
		</div>
	);
});
