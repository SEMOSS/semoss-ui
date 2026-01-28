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
	RoomInputMenuPlugin,
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
	const knowledgeId = searchParams.get("knowledgeId");

	// Fetch workspace data based on URL param or selected workspace
	const selectedWorkspaceId =
		mode.type === "workspace"
			? mode.workspace?.project_id
			: mode.type === "chat"
				? workspaceId
				: null;
	const getWorkspace = usePixel<Workspace | null>(
		selectedWorkspaceId ? `GetWorkspace("${selectedWorkspaceId}");` : null,
		{
			data: null,
		},
	);

	// Fetch knowledge vector engine if knowledgeId is provided
	const getKnowledge = usePixel<{
		app_id: string;
		app_name: string;
	} | null>(
		knowledgeId
			? `MyEngines( engine=["${knowledgeId}"], engineTypes=['VECTOR'],  metaFilters=[{}], userT = [true], limit=[15], offset=[0]);`
			: null,
		{ data: null },
	);

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<RoomStore["options"]>({
		instructions: "",
		mcp: [...(root.theme.defaultTools || [])],
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
			const room = await chat.createRoom();

			// set the model
			room.setModel(chat.models.selected);

			// set the mode
			room.setMode(mode.type === "plan" ? "planning" : "chat");

			const updated = {
				...options,
				mcp: options.mcp.filter((mcp) => !mcp?.fromWorkspace),
			};

			// add workspace id
			if (mode.type === "workspace" && mode.workspace) {
				updated.workspace = {
					workspace_id: mode.workspace.project_id,
				};
			}

			// update the options
			await room.updateRoomOptions(updated);

			// ask the room
			room.askMessage(prompt, files);

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
	}, [workspaceId, getWorkspace.status, getWorkspace.data]);

	// Handle workspace data loading from RoomWorkspace component selection
	useEffect(() => {
		if (
			mode.type !== "workspace" ||
			!mode.workspace ||
			getWorkspace.status !== "SUCCESS" ||
			!getWorkspace.data ||
			mode?.workspace?.project_id !== getWorkspace?.data?.workspace_id
		) {
			return;
		}

		// Sync options
		setOptions((prev) => {
			// Add workspace MCPs with fromWorkspace flag to the mcp array
			const workspaceMCPs = (getWorkspace.data.mcp || []).map((mcp) => ({
				...mcp,
				fromWorkspace: true,
			}));

			return {
				...prev,
				instructions:
					getWorkspace.data?.system_prompt || prev.instructions,
				mcp: workspaceMCPs,
			};
		});
	}, [mode.type, mode.workspace, getWorkspace.status, getWorkspace.data]);

	// Handle knowledge vector engine from URL parameter
	useEffect(() => {
		if (getKnowledge.status !== "SUCCESS" || !getKnowledge.data?.[0]) {
			return;
		}

		// Add the knowledge MCP to options
		setOptions((prev) => {
			// Check if this knowledge MCP already exists
			const existingMcp = prev.mcp.find(
				(mcp) => mcp.id === knowledgeId && mcp.type === "VECTOR",
			);

			// If it already exists, don't add it again
			if (existingMcp) {
				return prev;
			}

			// Add the knowledge MCP
			const knowledgeMcp = {
				id: knowledgeId,
				type: "VECTOR" as const,
				name: getKnowledge.data[0].app_name || knowledgeId,
			};

			return {
				...prev,
				mcp: [...prev.mcp, knowledgeMcp],
			};
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data]);

	// Clear instructions and workspace MCPs when switching away from workspace mode
	useEffect(() => {
		if (mode.type !== "workspace") {
			setOptions((prev) => ({
				...prev,
				instructions: "",
				mcp: [...(root.theme.defaultTools || [])], // Remove workspace MCPs
			}));
		}
	}, [mode.type, root.theme.defaultTools]);

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
							className="max-h-64 min-h-48 bg-background"
							isLoading={
								isLoading ||
								(mode.type === "workspace" &&
									mode.workspace &&
									getWorkspace.status !== "SUCCESS")
							}
							workspace={
								<RoomWorkspace
									mode={mode}
									onModeChange={setMode}
								/>
							}
							plugins={
								<RoomInputMenuPlugin
									options={options}
									setOptions={setOptions}
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
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="absolute top-0 right-0 z-10"
											variant="ghost"
											size="icon-sm"
											onClick={() => {
												// close it
												setIsConfgurationOpen(false);
											}}
										>
											<XIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Close</TooltipContent>
								</Tooltip>

								<ScrollArea className="h-full w-full">
									<RoomOptionsForm
										model={chat.models.selected}
										options={options}
										onModelChange={(model) => {
											if (model) {
												chat.setSelectedModel(model);
											}
										}}
										onOptionsChange={(options) => {
											if (options) {
												setOptions(options);
											}
										}}
									/>
								</ScrollArea>
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
});
