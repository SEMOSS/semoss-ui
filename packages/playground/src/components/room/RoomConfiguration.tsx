import { Delete } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	IconButton,
	List,
	Menu,
	Slider,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import {
	RightMenu,
	RightMenuContent,
	RightMenuTitle,
	ToolboxOverlay,
} from "@/components";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCP, MCPConfig } from "@/types";

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";
const ENABLE_TOOLS = import.meta.env.VITE_ENABLE_TOOLS === "true";

const StyledTextField = styled(TextField)(({ theme }) => ({
	borderRadius: theme.shape.borderRadiusSm,
	borderColor: theme.palette.secondary.border,
}));

const marks = [
	{ value: 0, label: "0" },
	{ value: 0.2 },
	{ value: 0.4 },
	{ value: 0.6 },
	{ value: 0.8 },
	{ value: 1, label: "1" },
];

interface RoomConfigurationProps {
	/** Options for the room */
	options: RoomStore["options"];

	/** Update options on change */
	setOptions: (options: RoomStore["options"]) => void;

	/** Close the Menu */
	onClose?: () => void;

	/** The room, used to make updates */
	room?: RoomStore;
}

export const RoomConfiguration: React.FC<RoomConfigurationProps> = observer(
	(props) => {
		const { options, setOptions, onClose, room } = props;

		/**
		 * Library hooks
		 */
		const { chat } = useChat();

		/**
		 * State
		 */
		const [isToolsOpen, setIsToolsOpen] = useState(false);

		/**
		 * Functions
		 */
		const handleDeleteMCP = async (mcp: MCPConfig) => {
			// Remove the MCP from the options
			if (room) {
				await room.removeMCP(mcp);
			} else {
				// otherwise we're creating a new room, just update the options
				const updatedMCPs = options.mcps.filter(
					(t) => !(t.id === mcp.id && t.type === mcp.type),
				);
				setOptions({
					...options,
					mcps: updatedMCPs,
				});
			}
		};

		const handleMCPClose = async (success: boolean, mcps: MCP[]) => {
			if (success) {
				// update the MCPs if successful
				const mcpConfigs: MCPConfig[] = mcps.map(
					({ id, type, name }) => ({ id, type, name }),
				);
				if (room) {
					await room.setMCPs(mcpConfigs);
				} else {
					// otherwise we're creating a new room, just update the options
					setOptions({
						...options,
						mcps: mcpConfigs,
					});
				}
			}

			// close it
			setIsToolsOpen(false);
		};

		return (
			<RightMenu header={"Configuration"} onClose={() => onClose()}>
				{ENABLE_MODEL_SELECT && (
					<>
						<RightMenuTitle name={"Model"} />
						<RightMenuContent direction="column" spacing={1}>
							<Typography
								variant="body2"
								sx={{
									color: "text.secondary",
								}}
							>
								Select Model
							</Typography>
							<StyledTextField
								select
								placeholder="Select a Model"
								value={chat.models.selected}
								onChange={(e) => {
									chat.setSelectedModel(e.target.value);
								}}
							>
								{chat.models.options.map((m) => (
									<Menu.Item key={m.app_id} value={m.app_id}>
										{m.app_name}
									</Menu.Item>
								))}
							</StyledTextField>
						</RightMenuContent>
					</>
				)}
				<RightMenuTitle name={"Context"} />
				<RightMenuContent>
					<StyledTextField
						size="small"
						variant="outlined"
						fullWidth
						placeholder={"Instructions"}
						multiline
						minRows={4}
						maxRows={6}
						value={options.instructions}
						onChange={(e) => {
							setOptions({
								...options,
								instructions: e.target.value,
							});
						}}
					/>
				</RightMenuContent>
				{ENABLE_TOOLS && (
					<>
						<RightMenuTitle
							name={"MCPs"}
							actions={
								<Button
									variant="outlined"
									color="inherit"
									size="small"
									onClick={() => {
										setIsToolsOpen(true);
									}}
								>
									Add
								</Button>
							}
						/>

						<RightMenuContent direction={"column"} spacing={1}>
							<List dense={true}>
								{options.mcps.length ? (
									options.mcps.map((mcp) => {
										return (
											<List.Item
												key={mcp.id}
												dense={true}
												secondaryAction={
													<IconButton
														edge="end"
														aria-label="delete"
														size="small"
														onClick={() =>
															handleDeleteMCP(mcp)
														}
													>
														<Delete
															fontSize={"small"}
														/>
													</IconButton>
												}
											>
												<List.ItemText
													primary={mcp.name}
												/>
											</List.Item>
										);
									})
								) : (
									<List.Item dense={true}>
										<Typography
											variant="caption"
											sx={{
												width: "100%",
												textAlign: "center",
											}}
										>
											No MCPs added
										</Typography>
									</List.Item>
								)}
							</List>
						</RightMenuContent>
					</>
				)}
				<RightMenuTitle name={"Options"} />
				<RightMenuContent direction="column" spacing={1}>
					<Typography
						variant="body2"
						sx={{
							color: "text.secondary",
						}}
					>
						Update Token Length:
					</Typography>
					<TextField
						aria-label="Token Length"
						value={options.tokenLength ?? ""}
						onChange={(e) =>
							setOptions({
								...options,
								tokenLength:
									Number(
										e.target.value?.replace(/\D/g, ""),
									) || null,
							})
						}
						size="small"
						variant="outlined"
						fullWidth={true}
					/>
					<Typography
						variant="body2"
						sx={{
							color: "text.secondary",
						}}
					>
						Update Temperature:
					</Typography>
					<Slider
						aria-label="Temperature"
						value={options.temperature}
						onChange={(_e, val) =>
							setOptions({
								...options,
								temperature: val as number,
							})
						}
						size="small"
						valueLabelDisplay="auto"
						min={0}
						max={1}
						step={0.01}
						marks={marks}
					/>
				</RightMenuContent>
				{isToolsOpen && (
					<ToolboxOverlay
						mcps={options.mcps}
						onClose={(success, mcps) =>
							handleMCPClose(success, mcps)
						}
					/>
				)}
			</RightMenu>
		);
	},
);
