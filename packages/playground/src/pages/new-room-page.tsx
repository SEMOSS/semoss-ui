import { CheckIcon, ListTodoIcon, MessageCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
	toast,
} from "@semoss/ui/next";
import landingImage from "@/assets/img/landing.png";
import {
	RoomInput,
	RoomInputMenuKnowledge,
	RoomInputMenuSettings,
	RoomInputMenuToolbox,
	RoomInputMenuUpload,
	RoomInputMenuWorkspace,
	workspaceToApp,
} from "@/components";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, MCPConfig, Workspace } from "@/types";

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
		mcp: [...(root.theme.defaultTools || [])],
		tokenLength: TOKEN_LENGTH,
		temperature: TEMPERATURE,
		workspace: null,
	});

	/**
	 * Functions
	 */
	/**
	 * Handle tool selection
	 * @param tool - selected tool
	 */
	const handleToolSelect = (tool: MCPConfig) => {
		// Toggle tool in options
		const tools = options.mcp.reduce(
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

		setOptions({
			...options,
			mcp: Object.values(tools),
		});
	};

	/**
	 * Handle workspace selection
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
				mcp: [...(root.theme.defaultTools || [])], // Remove workspace MCPs
			}));
		}
	}, [mode.type, root.theme.defaultTools]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="relative flex h-full w-full flex-col items-center justify-center overflow-auto p-2">
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
						className="max-h-64 min-h-48"
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
										<span className="flex-1">Ask</span>
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
										<span className="flex-1">Plan</span>

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
										options={options}
										onSelect={(tool) => {
											handleToolSelect(tool);
											addToken(`<${tool.name}>`);
										}}
									/>
									<RoomInputMenuToolbox
										options={options}
										onSelect={(tool) => {
											handleToolSelect(tool);
											addToken(`<${tool.name}>`);
										}}
									/>
									<RoomInputMenuSettings
										model={chat.models.selected}
										options={options}
										onClose={(
											success,
											{ model, options },
										) => {
											if (success) {
												if (model) {
													chat.setSelectedModel(
														model,
													);
												}

												if (options) {
													setOptions(options);
												}
											}
											onOpenChange(false);
										}}
									/>
								</>
							),
						)}
						onPrompt={async (prompt, files) => {
							await createRoom(prompt, files);

							return true;
						}}
					/>
				</div>
			</div>
		</div>
	);
});
