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
import background from "@/assets/img/background.png";
import { RoomInput, RoomOptions, RoomWorkspace } from "@/components";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Workspace } from "@/types";

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
		type: "chat" | "plan" | "workspace";
		workspace: Workspace | null;
	}>({
		type: "chat",
		workspace: null,
	});
	const workspaceId = searchParams.get("workspaceId");

	const getWorkspace = usePixel<Workspace | null>(
		workspaceId ? `GetWorkspace("${workspaceId}");` : null,
		{
			data: null,
		},
	);

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<RoomStore["options"]>({
		instructions: "",
		mcp: [],
		tokenLength: TOKEN_LENGTH,
		temperature: TEMPERATURE,
		workspace: null,
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

		if (mode.type === "workspace" && mode.workspace) {
			options.workspace = {
				workspace_id: mode.workspace.workspace_id,
			};
		}

		// create a new room
		const room = await chat.createRoom(
			prompt,
			mode.type === "plan" ? "planning" : "chat",
			chat.models.selected,
			mode.type === "workspace" && mode.workspace
				? {
						...options,
						workspace: {
							workspace_id: mode.workspace.workspace_id,
						},
					}
				: options,
		);

		// update the options
		await room.updateRoomOptions(options);

		// ask the room
		await room.askMessage(prompt, files);

		// mark the room as initialized
		room.setInitialized();

		// turn the loading screen off
		setIsLoading(false);

		// go to the new room
		navigate(`/room/${room.roomId}`);
	};

	/**
	 * Effects
	 */
	// if the workspaceId is passed in, use that to set the mode
	useEffect(() => {
		if (getWorkspace.status !== "SUCCESS") {
			return;
		}

		if (getWorkspace.data) {
			setMode({
				type: "workspace",
				workspace: getWorkspace.data,
			});
		}
	}, [getWorkspace.status, getWorkspace.data]);

	return (
		<div className="h-[calc(100vh-theme(space.2))] w-full overflow-hidden">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel className="relative flex flex-col items-center justify-center overflow-auto p-2">
					<img
						src={background}
						alt="Background"
						className="absolute inset-0 h-full w-full object-cover"
					/>
					<div className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
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
								(workspaceId &&
									getWorkspace.status !== "SUCCESS")
							}
							isDisabled={false}
							minRows={4}
							maxRows={8}
							workspace={
								<RoomWorkspace
									mode={mode}
									onModeChange={setMode}
								/>
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
						<ResizableHandle />
						<ResizablePanel
							className="relative h-full w-full p-2"
							defaultSize={25}
						>
							<div
								className={`h-full w-full overflow-hidden rounded-lg border border-border bg-background shadow-sm`}
							>
								<RoomOptions
									options={options}
									setOptions={(o) => {
										setOptions(o);
									}}
								/>
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
});
