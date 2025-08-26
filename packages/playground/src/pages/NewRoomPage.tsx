import {
	ArrowForward,
	ConstructionRounded,
	MoreVertRounded,
	SchoolRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Resizable } from "re-resizable";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	Badge,
	Button,
	Chip,
	CircularProgress,
	Container,
	Grid,
	IconButton,
	Link,
	Menu,
	Select,
	Stack,
	styled,
	Tooltip,
	Typography,
} from "@semoss/ui";
import {
	KnowledgeOverlay,
	OptionsMenu,
	OptionsPicker,
	PromptLibrary,
	RoomInput,
	ToolsOverlay,
} from "@/components";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Prompt } from "@/types";

const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION
	? import.meta.env.VITE_APP_DESCRIPTION
	: "";

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";
const ENABLE_KNOWLEDGE = import.meta.env.VITE_ENABLE_KNOWLEDGE === "true";
const ENABLE_TOOLS = import.meta.env.VITE_ENABLE_TOOLS === "true";

const StyledPage = styled(Stack)(() => ({
	height: "100%",
	width: "100%",
}));

const StyledContent = styled(Stack)(() => ({
	height: "100%",
	width: "100%",
	overflow: "auto",
}));

const StyledHolder = styled("div")(() => ({
	height: "98px",
}));

const StyledItem = styled("div", {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
	padding: theme.spacing(2),
	color: theme.palette.text.primary,
	height: "82px",
	boxShadow: "0px 5px 8px 0px rgba(0, 0, 0, 0.08)",
	borderRadius: theme.shape.borderRadius,
	borderColor: disabled ? `${theme.palette.action.disabled} !important` : "",
	borderTop: "3px solid",
	borderLeft: "3px solid",
	cursor: disabled ? undefined : "pointer",
	pointerEvents: disabled ? "none" : undefined,
}));

const StyledDescription = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledSelect = styled(Select)(({ theme }) => ({
	fontSize: "14px",
	maxWidth: "220px",
	"& .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline":
		{
			border: "none",
			borderRadius: theme.shape.borderRadiusSm,
		},
	"& .MuiSelect-icon": {
		color: theme.palette.text.primary,
		top: "calc(50% - 10px)",
		height: "20px",
		width: "20px",
	},
	"& .MuiSelect-select": {
		padding: theme.spacing(1),
	},
})) as unknown as typeof Select;

const StyledAlert = styled(Alert)(({ theme }) => ({
	background: "linear-gradient(90deg, #DCD7F9 0%, #EBF4FE 100%)",
	border: "1px solid #BAB5F4",
	borderRadius: "8px",
	color: theme.palette.text.primary,
}));

const StyledChip = styled(Chip)(() => ({
	background: "#BAB5F4",
}));

const StyledLink = styled(Link)(() => ({
	color: "inherit",
	textDecorationColor: "inherit",
}));

export const NewRoomPage = observer(() => {
	const { chat } = useChat();
	const navigate = useNavigate();
	const { system } = useInsight();

	const loginType = Object.keys(system.config.logins)[0];
	const userName: string =
		typeof system.config.logins[loginType] === "string"
			? (system.config.logins[loginType] as unknown as string)
			: "";

	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<RoomStore["options"]>({
		instructions: "",
		knowledge: null,
		tools: [],
		tokenLength: TOKEN_LENGTH,
		temperature: TEMPERATURE,
		autoExecute: false,
	});
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
	const [isToolsOpen, setIsToolsOpen] = useState(false);
	const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

	const getPrompts = usePixel<Prompt[]>(`ListPrompt(collect=[3]);`, {
		data: [],
	});

	/**
	 * Open a prompt prompt
	 * @param prompt - prompt to trigger
	 */
	const askPrompt = (prompt: Prompt) => {
		// ignore if loading
		if (isLoading) {
			return;
		}

		// TODO: Fix
		askModel(prompt.CONTEXT, []);
	};

	/**
	 * Ask the model
	 *
	 * @param - input
	 */
	const askModel = async (prompt: string, files: File[]) => {
		// ignore if loading
		if (isLoading) {
			return;
		}

		// turn the loading screen
		setIsLoading(true);

		// create a new room
		const room = await chat.createRoom(chat.models.selected, prompt);

		// initialize it
		await room.initialize();

		// ask the room
		await room.askModel(prompt, files, options);

		// turn the loading screen off
		setIsLoading(false);

		// go to the new room
		navigate(`/room/${room.roomId}`);
	};

	return (
		<StyledPage direction={"column"} spacing={3}>
			<Stack
				direction={"row"}
				padding={1}
				alignItems={"center"}
				justifyContent={"flex-end"}
				spacing={1}
				width={"100%"}
			>
				<Stack direction={"row"} alignItems={"center"} spacing={1}>
					<IconButton
						size="small"
						color={"default"}
						onClick={() => {
							setIsMenuOpen(!isMenuOpen);
						}}
					>
						<MoreVertRounded fontSize="small" />
					</IconButton>
				</Stack>
			</Stack>
			<Stack
				flex={1}
				direction={"row"}
				width={"100%"}
				spacing={3}
				overflow={"hidden"}
			>
				<StyledContent
					direction={"column"}
					alignItems={"center"}
					justifyContent={"center"}
				>
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
					{!isPromptLibraryOpen && (
						<Container maxWidth="md">
							<Stack direction={"column"} spacing={3}>
								<Stack
									direction="row"
									alignItems="center"
									justifyContent="center"
								>
									<Typography variant="h3" fontWeight="bold">
										Welcome
										{userName
											? `, ${userName?.split(" ")[0]}`
											: ""}
									</Typography>
								</Stack>
								<Stack
									direction="row"
									alignItems="center"
									justifyContent="center"
								>
									<StyledDescription variant={"body1"}>
										{APP_DESCRIPTION}
									</StyledDescription>
								</Stack>
								<StyledAlert
									icon={
										<StyledChip size="small" label="NEW" />
									}
									color="info"
								>
									<Alert.Title>Agent Tools</Alert.Title>
									Explore tools for file search, code, and
									function calling.{" "}
									<StyledLink
										href="#"
										onClick={(event) => {
											event.preventDefault();
											setIsToolsOpen(true);
										}}
									>
										Try it out!
									</StyledLink>
								</StyledAlert>
								<Stack direction={"column"} spacing={1}>
									{ENABLE_MODEL_SELECT ? (
										<StyledSelect
											size="small"
											placeholder="Select a Model"
											disabled={isLoading}
											value={chat.models.selected}
											onChange={(e) => {
												chat.setSelectedModel(
													e.target.value,
												);
											}}
											// Icon={
											//     KeyboardArrowDownRounded
											// }
										>
											{chat.models.options.map((m) => (
												<Menu.Item
													key={m.app_id}
													value={m.app_id}
												>
													{m.app_name}
												</Menu.Item>
											))}
										</StyledSelect>
									) : null}

									<RoomInput
										isLoading={isLoading}
										isDisabled={false}
										minRows={4}
										maxRows={8}
										actions={
											<>
												<OptionsPicker
													isDisabled={isLoading}
													options={options}
													setOptions={(o) =>
														setOptions({
															...options,
															...o,
														})
													}
												/>
												{ENABLE_TOOLS && (
													<Tooltip
														title={"Add Tools"}
														placement="top"
													>
														<IconButton
															size={"medium"}
															type="button"
															aria-label="Add Tools"
															disabled={isLoading}
															color={
																isToolsOpen
																	? "primary"
																	: "default"
															}
															onClick={() => {
																setIsToolsOpen(
																	true,
																);
															}}
														>
															<Badge
																color="primary"
																variant="dot"
																invisible={
																	options
																		.tools
																		.length ===
																	0
																}
															>
																<ConstructionRounded fontSize="medium" />
															</Badge>
														</IconButton>
													</Tooltip>
												)}
												{ENABLE_KNOWLEDGE && (
													<Tooltip
														title={"Add Knowledge"}
														placement="top"
													>
														<IconButton
															size={"medium"}
															type="button"
															aria-label="Add Knowledge"
															disabled={isLoading}
															color={
																isKnowledgeOpen
																	? "primary"
																	: "default"
															}
															onClick={() => {
																setIsKnowledgeOpen(
																	true,
																);
															}}
														>
															<Badge
																color={
																	"primary"
																}
																variant="dot"
																invisible={
																	!options.knowledge
																}
															>
																<SchoolRounded fontSize="medium" />
															</Badge>
														</IconButton>
													</Tooltip>
												)}
											</>
										}
										onPrompt={async (prompt, files) => {
											await askModel(prompt, files);

											return true;
										}}
									/>
								</Stack>
								<Stack
									direction={"column"}
									spacing={2}
									width={"100%"}
								>
									<Stack
										direction={"row"}
										alignItems={"center"}
										justifyContent={"space-between"}
									>
										<Typography
											variant="body1"
											fontWeight={"medium"}
										>
											Start Now
										</Typography>
										<Button
											size="medium"
											color="inherit"
											variant="text"
											endIcon={<ArrowForward />}
											disabled={isLoading}
											onClick={() =>
												setIsPromptLibraryOpen(true)
											}
										>
											View All
										</Button>
									</Stack>
									<StyledHolder>
										{getPrompts.status === "LOADING" && (
											<CircularProgress color="primary" />
										)}
										{getPrompts.status !== "LOADING" && (
											<Grid container spacing={2}>
												{getPrompts.data.map(
													(p, index) => {
														const borderColor = [
															"#BAB5F4",
															"#8CD98D",
															"#93CEF8",
														];

														if (!p) {
															return null;
														}

														return (
															<Grid
																item
																key={p.ID}
																xs={4}
															>
																<StyledItem
																	disabled={
																		isLoading
																	}
																	onClick={() => {
																		askPrompt(
																			p,
																		);
																	}}
																	sx={{
																		borderColor:
																			borderColor[
																				index
																			],
																	}}
																>
																	<Typography
																		variant={
																			"body1"
																		}
																		noWrap={
																			true
																		}
																	>
																		{
																			p.TITLE
																		}
																	</Typography>
																</StyledItem>
															</Grid>
														);
													},
												)}
											</Grid>
										)}
									</StyledHolder>
								</Stack>
							</Stack>
						</Container>
					)}

					{isPromptLibraryOpen && (
						<PromptLibrary
							onClose={(success, p) => {
								// if there is a prompt ask
								if (success) {
									askPrompt(p);
								}

								setIsPromptLibraryOpen(false);
							}}
						/>
					)}
				</StyledContent>
				{isMenuOpen && (
					<Resizable
						defaultSize={{
							width: 360,
							height: "100%",
						}}
						minWidth={280}
						handleStyles={{
							top: { pointerEvents: "none" },
							right: { pointerEvents: "none" },
							bottom: { pointerEvents: "none" },
							topRight: { pointerEvents: "none" },
							bottomRight: { pointerEvents: "none" },
							bottomLeft: { pointerEvents: "none" },
							topLeft: { pointerEvents: "none" },
						}}
						style={{
							// paddingTop: '8px',
							paddingRight: "8px",
							paddingBottom: "8px",
						}}
					>
						<OptionsMenu
							options={options}
							setOptions={(o) => {
								setOptions(o);
							}}
							onClose={() => {
								setIsMenuOpen(false);
							}}
						/>
					</Resizable>
				)}
			</Stack>
		</StyledPage>
	);
});
