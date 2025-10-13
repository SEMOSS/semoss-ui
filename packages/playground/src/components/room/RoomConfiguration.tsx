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
}

export const RoomConfiguration: React.FC<RoomConfigurationProps> = observer(
	(props) => {
		const { chat } = useChat();
		const { options, setOptions, onClose } = props;

		const [isToolsOpen, setIsToolsOpen] = useState(false);

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
							name={"Tools"}
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
								{options.tools.length ? (
									options.tools.map((t, tIdx) => {
										return (
											<List.Item
												key={t.id}
												dense={true}
												secondaryAction={
													<IconButton
														edge="end"
														aria-label="delete"
														size="small"
														onClick={() => {
															// copy it
															const updated = [
																...options.tools,
															];

															// remove at index
															updated.splice(
																tIdx,
																1,
															);

															// update the tools
															setOptions({
																...options,
																tools: updated,
															});
														}}
													>
														<Delete
															fontSize={"small"}
														/>
													</IconButton>
												}
											>
												<List.ItemText
													primary={t.name}
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
											No tools added
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
						type="number"
						value={options.tokenLength ?? ""}
						onChange={(e) =>
							setOptions({
								...options,
								tokenLength: Number(e.target.value) || 0,
							})
						}
						inputProps={{
							min: 0,
						}}
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
						tools={options.tools}
						onClose={(success, tools) => {
							// update the tools if successful
							if (success) {
								setOptions({
									...options,
									tools: tools,
								});
							}

							// close it
							setIsToolsOpen(false);
						}}
					/>
				)}
			</RightMenu>
		);
	},
);
