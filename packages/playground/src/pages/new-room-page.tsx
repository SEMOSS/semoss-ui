import {
	CheckIcon,
	ListTodoIcon,
	MessageCircleIcon,
	Settings2Icon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	DropdownMenuItem,
	DropdownMenuSeparator,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import landingImage from "@/assets/img/landing.png";
import {
	RoomInput,
	RoomInputMenuKnowledge,
	RoomInputMenuToolbox,
	RoomInputMenuUpload,
	RoomInputMenuWorkspace,
	workspaceToApp,
} from "@/components";
import { RoomOptionsForm } from "@/components/room/room-options-form";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import { RoomStore } from "@/stores";
import type { App, MCPConfig, Workspace } from "@/types";

/**
 * The page to create a new room
 *
 * @component
 */
export const NewRoomPage = observer(() => {
	const { t } = useTranslation(["room", "workspace", "common"]);
	const { root } = useRoot();
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
		],
	});

	const { chat } = useChat();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [isConfigurationOpen, setIsConfgurationOpen] = useState(false);
	const [mode, setMode] = useState<{
		type: "chat" | "plan" | "workspace";
		workspace: App | null;
	}>({
		type: "chat",
		workspace: null,
	});
	const workspaceId = searchParams.get("workspaceId");
	const knowledgeId = searchParams.get("knowledgeId");

	// Fetch workspace data based on URL param or selected agent
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

	// Create a temporary RoomStore instance to handle options mutations
	// This prevents re-renders on tool selection since MobX handles the mutations
	const tempRoomStore = useMemo(
		() => new RoomStore(root.theme, "temp"),
		[root.theme],
	);
	// On initial load, set the default options from the theme using the temporary RoomStore
	useEffect(() => {
		tempRoomStore.setOptions({
			instructions: "",
			mcp: [...(root.theme.defaultTools || [])],
			tokenLength:
				root.theme.defaultRoomSettings?.tokenLength || TOKEN_LENGTH,
			temperature:
				root.theme?.defaultRoomSettings?.temperature || TEMPERATURE,
			workspace: null,
		});
	}, [tempRoomStore, root.theme]);

	/**
	 * Functions
	 */
	/**
	 * Handle tool selection
	 * @param tool - selected tool
	 */
	const handleToolSelect = (tool: MCPConfig) => {
		// Toggle tool in options using the temporary RoomStore
		const tools = tempRoomStore.options.mcp.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, MCPConfig>,
		);

		if (Object.hasOwn(tools, tool.id)) {
			delete tools[tool.id];
		} else {
			tools[tool.id] = tool;
		}

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: Object.values(tools),
		});
	};

	/**
	 * Handle agent selection
	 */
	const handleWorkspaceSelect = (workspace: App | null) => {
		if (workspace) {
			setMode({
				type: "workspace",
				workspace,
			});
		} else {
			setMode({
				type: "chat",
				workspace: null,
			});
		}
	};

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
			const room = await chat.createRoom(
				mode.type === "plan" ? "planning" : "chat",
				mode.workspace?.project_id,
			);

			const updated = {
				...tempRoomStore.options,
				mcp: tempRoomStore.options.mcp.filter(
					(mcp) => !mcp?.fromWorkspace,
				),
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
			navigate(`/room/${room.roomId}`);
		} catch (error) {
			toast.error(
				t("room:errors.createRoom", { message: error.message }),
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

		// Sync options using the temporary RoomStore
		// Add workspace MCPs with fromWorkspace flag to the mcp array
		const workspaceMCPs = (getWorkspace.data.mcp || []).map((mcp) => ({
			...mcp,
			fromWorkspace: true,
		}));

		// Preserve existing tools that are not from workspace
		const nonWorkspaceMCPs = tempRoomStore.options.mcp.filter(
			(mcp) => !mcp.fromWorkspace,
		);

		// Combine and deduplicate by ID (workspace MCPs take precedence)
		const allMCPs = [...workspaceMCPs, ...nonWorkspaceMCPs];
		const mcpMap = new Map<string, MCPConfig>();
		for (const mcp of allMCPs) {
			// Only add if not already in map (workspace MCPs added first, so they take precedence)
			if (!mcpMap.has(mcp.id)) {
				mcpMap.set(mcp.id, mcp);
			}
		}

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			instructions:
				getWorkspace.data?.system_prompt ||
				tempRoomStore.options.instructions,
			mcp: Array.from(mcpMap.values()),
		});
	}, [
		mode.type,
		mode.workspace,
		getWorkspace.status,
		getWorkspace.data,
		tempRoomStore,
	]);

	// // Handle knowledge vector engine from URL parameter
	useEffect(() => {
		if (getKnowledge.status !== "SUCCESS" || !getKnowledge.data?.[0]) {
			return;
		}

		// Add the knowledge MCP to options using the temporary RoomStore
		// Check if this knowledge MCP already exists
		const existingMcp = tempRoomStore.options.mcp.find(
			(mcp) => mcp.id === knowledgeId && mcp.type === "VECTOR",
		);

		// If it already exists, don't add it again
		if (existingMcp) {
			return;
		}

		// Add the knowledge MCP
		const knowledgeMcp = {
			id: knowledgeId,
			type: "VECTOR" as const,
			name: getKnowledge.data[0].app_name || knowledgeId,
		};

		tempRoomStore.setOptions({
			...tempRoomStore.options,
			mcp: [...tempRoomStore.options.mcp, knowledgeMcp],
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data, tempRoomStore]);

	// Clear instructions and workspace MCPs when switching away from workspace mode
	useEffect(() => {
		if (mode.type !== "workspace") {
			tempRoomStore.setOptions({
				...tempRoomStore.options,
				instructions: "",
				temperature: root.theme.defaultRoomSettings.temperature,
				tokenLength: root.theme.defaultRoomSettings.tokenLength,
				mcp: [...(root.theme.defaultTools || [])], // Remove workspace MCPs
			});
		}
	}, [
		mode.type,
		root.theme.defaultTools,
		root.theme.defaultRoomSettings,
		tempRoomStore,
	]);

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
									{t("room:welcome")}
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
							model={chat.models.selected}
							setModel={(m) => {
								chat.setSelectedModel(m);
							}}
							MenuComponent={observer(
								({ addToken, onOpenChange, fileRef }) => (
									<>
										<DropdownMenuItem
											onSelect={() => {
												setMode({
													type: "chat",
													workspace: null,
												});
												onOpenChange(false);
											}}
										>
											<MessageCircleIcon />
											<span className="flex-1">
												{t("room:modes.ask")}
											</span>
											{mode.type === "chat" ? (
												<div className="px-1">
													<CheckIcon />
												</div>
											) : null}
										</DropdownMenuItem>
										<DropdownMenuItem
											onSelect={() => {
												setMode({
													type: "plan",
													workspace: null,
												});
												onOpenChange(false);
											}}
										>
											<ListTodoIcon />
											<span className="flex-1">
												{t("room:modes.plan")}
											</span>

											{mode.type === "plan" ? (
												<div className="px-1">
													<CheckIcon />
												</div>
											) : null}
										</DropdownMenuItem>
										<RoomInputMenuWorkspace
											workspace={
												mode.type === "workspace"
													? mode.workspace
													: null
											}
											onSelect={handleWorkspaceSelect}
										/>
										<DropdownMenuSeparator />
										<RoomInputMenuUpload
											fileRef={fileRef}
											onSelect={() => onOpenChange(false)}
										/>
										<DropdownMenuSeparator />
										<RoomInputMenuKnowledge
											options={tempRoomStore.options}
											onSelect={(tool) => {
												handleToolSelect(tool);
												addToken(`<${tool.name}>`);
											}}
										/>
										<RoomInputMenuToolbox
											options={tempRoomStore.options}
											onSelect={(tool) => {
												handleToolSelect(tool);
												addToken(`<${tool.name}>`);
											}}
										/>
										<DropdownMenuItem
											onSelect={(e) => {
												e.preventDefault();

												setIsConfgurationOpen(
													!isConfigurationOpen,
												);
											}}
										>
											<Settings2Icon />
											<span className="flex-1">
												{isConfigurationOpen
													? t("room:settings.close")
													: t("room:settings.open")}
											</span>
										</DropdownMenuItem>
									</>
								),
							)}
							onPrompt={async (prompt, files) => {
								await createRoom(prompt, files);

								return true;
							}}
						/>
					</div>
				</ResizablePanel>
				{isConfigurationOpen && (
					<>
						<ResizableHandle />
						<ResizablePanel
							className="relative h-full w-full p-2"
							defaultSize={25}
						>
							<div
								className={`relative h-full w-full overflow-hidden rounded-lg border border-input shadow-xs dark:bg-input/30`}
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
									<TooltipContent>
										{t("room:settings.close")}
									</TooltipContent>
								</Tooltip>

								<ScrollArea className="h-full w-full">
									<RoomOptionsForm
										model={chat.models.selected}
										options={tempRoomStore.options}
										onModelChange={(model) => {
											if (model) {
												chat.setSelectedModel(model);
											}
										}}
										onOptionsChange={(options) => {
											if (options) {
												tempRoomStore.setOptions({
													...tempRoomStore.options,
													...options,
												});
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
