import {
	Add, DeleteOutlineOutlined,
	GridViewRounded,
	SouthEastOutlined
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import {
	Button,
	IconButton,
	Markdown,
	Stack,
	Stepper,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import type { PlanMessageStore } from "@/stores";

const StyledPlanMessage = styled(Stack)(({ theme }) => ({
	width: "100%",
	padding: "8px 16px",
	background: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
	boxShadow: theme.shadows[1],
}));

const StyledHover = styled(Stack)(() => ({
	'& [data-hover="true"]': {
		opacity: 0,
	},
	"&:hover [data-hover='true']": {
		opacity: 1,
	},
}));


const StyledSidebarOpen = styled(Stack)(({ theme }) => ({
	padding: "8px",
	borderRadius: "12px",
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: theme.palette.secondary.border,
	cursor: "pointer",
}));

interface PlanMessageProps {
	/** Message to render */
	message: PlanMessageStore;
}

export const PlanMessage: React.FC<PlanMessageProps> = observer(
	({ message }) => {
		const notification = useNotification();
		console.log(notification);

		return (
			<StyledPlanMessage direction={"column"} spacing={2}>
				<Stack direction="row" alignItems={"center"} spacing={1}>
					<Typography variant="caption">Plan</Typography>
					<SouthEastOutlined
						sx={{ color: "#757575", fontSize: "1rem" }}
					/>
				</Stack>
				<Typography variant="body1">
					Here is the plan that I have created. Feel free to modify it
					as needed.
				</Typography>
				{message.steps.length > 0 && (
					<Stepper orientation="vertical">
						{message.steps.map((s) => (
							<Stepper.Step
								key={s.step_number}
								active={true}
								completed={s.status === "completed"}
							>
								<Stepper.StepLabel
									error={s.status === "failed"}
								>
									<StyledHover direction={"row"} spacing={1} alignItems={'center'}>
										<Typography
											variant="subtitle2"
											fontWeight={500}
										>
											{`Step ${s.step_number}`}
										</Typography>
										<Stack
											flex={1}
											direction={"row"}
											alignItems={"center"}
											justifyContent={"flex-end"}
											spacing={1}
											data-hover={true}
										>
											<IconButton
												size="small"
												onClick={() => {
													console.log("TODO");
												}}
											>
												<DeleteOutlineOutlined color="error" fontSize="inherit" />
											</IconButton>
										</Stack>
									</StyledHover>
								</Stepper.StepLabel>
								<Stepper.StepContent>
									<Typography variant="caption">
										{s.description}
									</Typography>
									{s.details.stepType === "tool_call" && (
										<StyledSidebarOpen
											direction={"row"}
											alignItems={"center"}
											spacing={2}
											onClick={() => {
												console.log("TODO");
											}}
										>
											<GridViewRounded
												fontSize="medium"
												sx={{ color: "#757575" }}
											/>
											<Stack
												direction={"column"}
												spacing={1}
												flex={1}
											>
												<Typography
													variant="subtitle2"
													noWrap={true}
												>
													{s.details.tool_name}
												</Typography>
												<Typography variant="caption">
													Click to Open
												</Typography>
											</Stack>
										</StyledSidebarOpen>
									)}
									{s.details.stepType === "llm_reasoning" && (
										<Markdown>{s.details.prompt}</Markdown>
									)}

									{s.details.stepType ===
										"human_intervention" && (
											<Typography variant="body2">
												Ask a {s.details.required_role} to{" "}
												{s.details.instructions}
											</Typography>
										)}
									{s.details.stepType ===
										"no_tool_available" && (
											<StyledSidebarOpen
												direction={"row"}
												alignItems={"center"}
												spacing={2}
												onClick={() => {
													console.log("TODO");
												}}
											>
												<GridViewRounded
													fontSize="medium"
													sx={{ color: "#757575" }}
												/>
												<Stack
													direction={"column"}
													spacing={1}
													flex={1}
												>
													<Typography
														variant="body1"
														noWrap={true}
													>
														Missing Tool for{" "}
														{
															s.details
																.missing_capability
														}
													</Typography>
													<Typography variant="caption">
														Click to Add
													</Typography>
												</Stack>
											</StyledSidebarOpen>
										)}

									<Typography variant="caption">
										{s.details.rationaleForStep}
									</Typography>
								</Stepper.StepContent>
							</Stepper.Step>
						))}
					</Stepper>
				)}
				<Stack direction="row">
					<Button
						size="small"
						variant="text"
						startIcon={<Add />}
						onClick={() => {
							console.log("TODO");
						}}
					>
						Add Task
					</Button>
				</Stack>
			</StyledPlanMessage>
		);
	},
);
