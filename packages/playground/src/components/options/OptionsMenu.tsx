import { Delete } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Checkbox,
	FormControlLabel,
	IconButton,
	List,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { KnowledgeOverlay, RightMenu, ToolsOverlay } from "@/components";
import type { RoomStore } from "@/stores";

const ENABLE_KNOWLEDGE = import.meta.env.VITE_ENABLE_KNOWLEDGE === "true";
const ENABLE_TOOLS = import.meta.env.VITE_ENABLE_TOOLS === "true";

const StyledTextField = styled(TextField)(({ theme }) => ({
	color: theme.palette.text.primary,
	background: theme.palette.background.paper,
}));

interface OptionsMenuProps {
	/** Options for the room */
	options: RoomStore["options"];

	/** Update options on change */
	setOptions: (options: RoomStore["options"]) => void;

	/** Close the Menu */
	onClose?: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = observer((props) => {
	const { options, setOptions, onClose } = props;

	const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
	const [isToolsOpen, setIsToolsOpen] = useState(false);

	return (
		<RightMenu header={"Chat Controls"} onClose={() => onClose()}>
			<Stack direction={"column"} width={"100%"} spacing={1}>
				<Typography variant="body1">Instructions</Typography>
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
			</Stack>
			{ENABLE_KNOWLEDGE && (
				<Stack direction={"column"} width={"100%"} spacing={1} flex={1}>
					<Stack
						direction={"row"}
						width={"100%"}
						spacing={2}
						justifyContent={"space-between"}
						alignItems={"center"}
					>
						<Typography variant="body1">Knowledge</Typography>
						<Button
							variant="outlined"
							color="inherit"
							size="small"
							onClick={() => {
								setIsKnowledgeOpen(true);
							}}
						>
							Add
						</Button>
					</Stack>
					<List dense={true}>
						{options.knowledge ? (
							<List.Item
								dense={true}
								secondaryAction={
									<IconButton
										edge="end"
										aria-label="delete"
										size="small"
										onClick={() => {
											// update the tools
											setOptions({
												...options,
												knowledge: null,
											});
										}}
									>
										<Delete fontSize={"small"} />
									</IconButton>
								}
							>
								<List.ItemText
									primary={options.knowledge.name}
								/>
							</List.Item>
						) : (
							<List.Item dense={true}>
								<Typography
									variant="caption"
									sx={{
										width: "100%",
										textAlign: "center",
									}}
								>
									No knowledge added
								</Typography>
							</List.Item>
						)}
					</List>
				</Stack>
			)}
			{ENABLE_TOOLS && (
				<>
					<Stack
						direction={"column"}
						width={"100%"}
						spacing={1}
						flex={1}
					>
						<Stack
							direction={"row"}
							width={"100%"}
							spacing={2}
							justifyContent={"space-between"}
							alignItems={"center"}
						>
							<Typography variant="body1">Tools</Typography>
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
						</Stack>

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
														updated.splice(tIdx, 1);

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
											<List.ItemText primary={t.name} />
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
					</Stack>
					<FormControlLabel
						control={
							<Checkbox
								checked={options.autoExecute}
								onChange={(_e, _vall) =>
									setOptions({
										...options,
										autoExecute: !options.autoExecute,
									})
								}
							/>
						}
						label="Auto-execute"
					/>
				</>
			)}
			{isKnowledgeOpen && (
				<KnowledgeOverlay
					knowledge={options.knowledge}
					onClose={(success, knowledge) => {
						// if its successful, update the options
						if (success) {
							setOptions({
								...options,
								knowledge: knowledge,
							});
						}

						// close the modal
						setIsKnowledgeOpen(false);
					}}
				/>
			)}
			{isToolsOpen && (
				<ToolsOverlay
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
});
