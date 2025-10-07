import {
	FormatListNumbered,
	LightbulbOutlined,
	Tune,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Resizable } from "re-resizable";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Container,
	IconButton,
	Stack,
	styled,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { PromptLibrary, RoomConfiguration, RoomInput } from "@/components";
import { AgentChip } from "@/components/agent";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { useChat, useLoadingPixel } from "@/hooks";
import type { RoomStore } from "@/stores";

const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION
	? import.meta.env.VITE_APP_DESCRIPTION
	: "";

const ENABLE_PLANNING = import.meta.env.VITE_ENABLE_PLANNING === "true";

const StyledPage = styled(Stack)(() => ({
	height: "100%",
	width: "100%",
	padding: "16px",
}));

const StyledContent = styled(Stack)(() => ({
	height: "100%",
	width: "100%",
	overflow: "auto",
}));

const StyledButton = styled("button")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	padding: "8px 16px",
	gap: "8px",
	border: `none`,
	borderRadius: theme.shape.borderRadiusSm,
	background: theme.palette.background.paper,
	boxShadow: theme.shadows[1],
	cursor: "pointer",
	"&:hover": {
		background: theme.palette.action.hover,
	},
}));

export const NewRoomPage = observer(() => {
	/**
	 * Library Hooks
	 */
	const { chat } = useChat();
	const navigate = useNavigate();
	const { system } = useInsight();
	const { agentId } = useParams() as { agentId?: string };
	const [agent, isLoadingAgent] = useLoadingPixel(
		`GetWorkspace("${agentId}");`,
		null,
		!agentId,
	);

	const loginType = Object.keys(system.config.logins)[0];
	const userName: string =
		typeof system.config.logins[loginType] === "string"
			? (system.config.logins[loginType] as unknown as string)
			: "";

	/**
	 * State
	 */
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<RoomStore["options"]>({
		instructions: "",
		// knowledge: null,
		tools: [],
		tokenLength: TOKEN_LENGTH,
		temperature: TEMPERATURE,
	});

	const [isPlanning, setIsPlanning] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

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

		// create a new room
		const room = await chat.createRoom(
			prompt,
			isPlanning ? "planning" : "chat",
			chat.models.selected,
			options,
		);

		// ask the room
		await room.askMessage(prompt, files);

		// turn the loading screen off
		setIsLoading(false);

		// go to the new room
		navigate(`/room/${room.roomId}`);
	};

	return (
		<StyledPage direction={"row"} spacing={2}>
			<StyledContent
				direction={"column"}
				alignItems={"center"}
				justifyContent={"center"}
			>
				<Container maxWidth="md" sx={{ padding: "0 !important" }}>
					<Stack
						direction={"column"}
						alignItems={"center"}
						justifyContent={"center"}
						spacing={3}
					>
						<Typography
							variant="h3"
							fontWeight="bold"
							sx={{
								background:
									"linear-gradient(90deg, #6C53FF 0%, #71DCF0 100%)",
								backgroundClip: "text",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
							}}
						>
							Welcome
							{userName ? `, ${userName?.split(" ")[0]}` : ""}
						</Typography>
						<Typography
							variant={"body1"}
							sx={{ color: "text.secondary" }}
						>
							{APP_DESCRIPTION}
						</Typography>
						<RoomInput
							isLoading={isLoading}
							isDisabled={false}
							minRows={4}
							maxRows={8}
							actions={
								<Stack direction="row" alignItems="center">
									{agentId ? (
										<AgentChip
											agent={agent}
											loading={isLoadingAgent}
										/>
									) : (
										<Tooltip
											title={"Open Configuration Menu"}
											placement="top"
										>
											<IconButton
												size={"medium"}
												type="button"
												aria-label="Open Configuration Menu"
												disabled={isLoading}
												color={
													isMenuOpen
														? "primary"
														: "default"
												}
												onClick={() => {
													setIsMenuOpen(!isMenuOpen);
												}}
											>
												<Tune color="inherit" />
											</IconButton>
										</Tooltip>
									)}
									{ENABLE_PLANNING && (
										<Tooltip
											title={
												"Note: This is a beta feature. Use this to generate plan"
											}
											placement="top"
										>
											<IconButton
												size={"medium"}
												type="button"
												aria-label="Generate plan"
												disabled={isLoading}
												color={
													isPlanning
														? "primary"
														: "default"
												}
												onClick={() => {
													setIsPlanning(!isPlanning);
												}}
											>
												<FormatListNumbered color="inherit" />
											</IconButton>
										</Tooltip>
									)}
								</Stack>
							}
							onPrompt={async (prompt, files) => {
								await askMessage(prompt, files);

								return true;
							}}
						/>
						<Stack direction="row" spacing={2} maxWidth={"80%"}>
							<StyledButton
								onClick={() => setIsPromptLibraryOpen(true)}
							>
								<LightbulbOutlined
									color="primary"
									fontSize="small"
								/>
								<Typography variant="body2">Library</Typography>
							</StyledButton>
						</Stack>
					</Stack>
				</Container>
			</StyledContent>
			{isMenuOpen && (
				<Resizable
					minWidth={340}
					handleStyles={{
						top: { pointerEvents: "none" },
						right: { pointerEvents: "none" },
						bottom: { pointerEvents: "none" },
						topRight: { pointerEvents: "none" },
						bottomRight: { pointerEvents: "none" },
						bottomLeft: { pointerEvents: "none" },
						topLeft: { pointerEvents: "none" },
					}}
				>
					<RoomConfiguration
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

			{isPromptLibraryOpen && (
				<PromptLibrary
					onClose={(success, p) => {
						// if there is a prompt ask
						if (success) {
							askMessage(p.INTENT, []);
						}

						setIsPromptLibraryOpen(false);
					}}
				/>
			)}
		</StyledPage>
	);
});
