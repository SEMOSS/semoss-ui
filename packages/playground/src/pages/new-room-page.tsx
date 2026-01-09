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
import landingImage from "@/assets/img/landing.png";
import {
	RoomInput,
	RoomOptions,
	RoomWorkspace,
	workspaceToApp,
} from "@/components";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, Workspace } from "@/types";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { root } = useRoot();

	useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
	]);

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

	// Fetch workspace data based on URL param or selected workspace
	const selectedWorkspaceId =
		(mode.type === "workspace" ? mode.workspace?.project_id : null) ||
		workspaceId;

	const getWorkspace = usePixel<Workspace | null>(
		selectedWorkspaceId ? `GetWorkspace("${selectedWorkspaceId}");` : null,
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
	// Handle workspace data loading
	useEffect(() => {
		if (getWorkspace.status !== "SUCCESS" || !getWorkspace.data) {
			return;
		}

		// If workspaceId came from URL, update the mode
		if (workspaceId) {
			setMode({
				type: "workspace",
				workspace: workspaceToApp(getWorkspace.data),
			});
		}

		// Update options with workspace instructions and MCPs if available
		setOptions((prev) => {
			// Add workspace MCPs with fromWorkspace flag to the mcp array
			const workspaceMCPs = (getWorkspace.data.mcp || []).map((mcp) => ({
				...mcp,
				fromWorkspace: true,
			}));

			return {
				...prev,
				instructions:
					getWorkspace.data.system_prompt || prev.instructions,
				mcp: workspaceMCPs,
			};
		});
	}, [workspaceId, getWorkspace.status, getWorkspace.data]);

	// Handle workspace data loading from RoomWorkspace component selection
	useEffect(() => {
		if (
			mode.type !== "workspace" ||
			!mode.workspace ||
			getWorkspace.status !== "SUCCESS" ||
			!getWorkspace.data
		) {
			return;
		}

		// Update options with workspace instructions if available
		if (getWorkspace.data.system_prompt) {
			setOptions((prev) => {
				// Add workspace MCPs with fromWorkspace flag to the mcp array
				const workspaceMCPs = (getWorkspace.data.mcp || []).map(
					(mcp) => ({
						...mcp,
						fromWorkspace: true,
					}),
				);

				return {
					...prev,
					instructions:
						getWorkspace.data?.system_prompt || prev.instructions,
					mcp: workspaceMCPs,
				};
			});
		}
	}, [mode.type, mode.workspace, getWorkspace.status, getWorkspace.data]);

	// Clear instructions and workspace MCPs when switching away from workspace mode
	useEffect(() => {
		if (mode.type !== "workspace") {
			setOptions((prev) => ({
				...prev,
				instructions: "",
				mcp: [], // Remove workspace MCPs
			}));
		}
	}, [mode.type]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel className="relative flex flex-col items-center justify-center overflow-auto p-2">
					<img
						src={root.theme.images.landing || landingImage}
						alt="Background"
						className="absolute inset-0 h-full w-full select-none object-cover"
					/>
					<div className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
						{root.theme.landing ? (
							<div
								className="mx-auto flex max-w-xl"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
								dangerouslySetInnerHTML={{
									__html: root.theme.landing,
								}}
							/>
						) : (
							<div className="mx-auto flex max-w-xl flex-col items-center gap-3">
								<div className="text-center font-semibold text-4xl text-foreground leading-normal">
									Welcome
								</div>
								{root.theme.description ? (
									<div className="text-center text-muted-foreground text-sm leading-normal">
										{root.theme.description}
									</div>
								) : null}
							</div>
						)}

						<RoomInput
							isLoading={
								isLoading ||
								(mode.type === "workspace" &&
									mode.workspace &&
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
									setRoomModel={() => null}
								/>
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
});
