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
	toast,
} from "@semoss/ui/next";
import background from "@/assets/img/background.png";
import {
	RoomInput,
	RoomOptions,
	RoomWorkspace,
	workspaceToApp,
} from "@/components";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat, useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, Workspace } from "@/types";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { root } = useRoot();

	const { chat } = useChat();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [mode, setMode] = useState<{
		type: "chat" | "plan" | "workspace";
		workspace: App | null;
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
	 * Create a new room and ask the model
	 *
	 * @param prompt The prompt to ask
	 * @param files The files to upload
	 */
	const createRoom = async (prompt: string, files: File[]) => {
		// ignore if loading
		if (isLoading) {
			return;
		}

		try {
			// turn the loading screen
			setIsLoading(true);

			// create a new room
			const roomId = await chat.createRoom(
				prompt,
				files,
				mode.type === "plan" ? "planning" : "chat",
				chat.models.selected.app_id,
				mode.type === "workspace" && mode.workspace
					? {
							...options,
							workspace: {
								workspace_id: mode.workspace.project_id,
							},
						}
					: options,
			);

			// go to the new room
			navigate(`/room/${roomId}`);
		} catch (error) {
			toast.error(
				`An error occurred while creating the room. Error: ${error.message}`,
			);
		} finally {
			setIsLoading(false);
		}
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
				workspace: workspaceToApp(getWorkspace.data),
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
								{root.theme.description}
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
									</TooltipTrigger>
									<TooltipContent>
										Open Configuration Menu
									</TooltipContent>
								</Tooltip>
							}
							onPrompt={async (prompt, files) => {
								await createRoom(prompt, files);

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
