import {
	Add,
	Check,
	DeleteOutlineOutlined,
	Hardware,
	Link,
	SouthEastOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	IconButton,
	Stack,
	Stepper,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { AddStepOverlay, LinkStepOverlay } from "@/components";
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

const StyledTool = styled(Stack)(({ theme }) => ({
	padding: "8px",
	borderRadius: "12px",
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: theme.palette.secondary.border,
}));

interface PlanMessageProps {
	/** Message to render */
	message: PlanMessageStore;

	/** Track if it is the last message */
	isLast: boolean;
}

export const PlanMessage: React.FC<PlanMessageProps> = observer(
	({ message, isLast }) => {
		const notification = useNotification();

		const [isAddStepOpen, setIsAddStepOpen] = useState(false);
		const [isLinkOpen, setIsLinkOpen] = useState(false);

		/**
		 * Accept the plan
		 */
		const acceptPlan = () => {
			try {
				message.confirmPlan();
			} catch (e) {
				notification.add({
					color: "error",
					message: String(e),
				});
			}
		};

		/**
		 * Remove a step from the plan
		 * @param step_number Step number to remove
		 */
		const removeStep = (step_number: number) => {
			try {
				message.removeStep(step_number);

				notification.add({
					color: "success",
					message: `Successfully removed step ${step_number} from plan`,
				});
			} catch (e) {
				notification.add({
					color: "error",
					message: String(e),
				});
			}
		};

		// only accept if all tools are there
		let canAccept = true;
		for (const step of message.plan.steps) {
			if (step.details.stepType === "no_tool_available") {
				canAccept = false;
				break;
			}
		}

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
				{message.plan.steps.length > 0 && (
					<Stepper orientation="vertical">
						{message.plan.steps.map((s) => (
							<Stepper.Step
								key={s.step_number}
								active={true}
								completed={s.status === "completed"}
							>
								<Stepper.StepLabel
									error={s.status === "failed"}
									sx={{ paddingBottom: 0 }}
								>
									<StyledHover
										direction={"row"}
										spacing={1}
										alignItems={"center"}
									>
										<Typography
											variant="subtitle2"
											fontWeight={500}
										>
											{s.step_name}
										</Typography>
										<Stack
											flex={1}
											direction={"row"}
											alignItems={"center"}
											justifyContent={"flex-end"}
											spacing={1}
											data-hover={true}
										>
											{isLast && (
												<IconButton
													size="small"
													onClick={() => {
														removeStep(
															s.step_number,
														);
													}}
												>
													<DeleteOutlineOutlined
														color="error"
														fontSize="inherit"
													/>
												</IconButton>
											)}
										</Stack>
									</StyledHover>
								</Stepper.StepLabel>
								<Stepper.StepContent>
									<Stack direction="column" spacing={1}>
										<Typography variant="caption">
											{s.description}
										</Typography>
										{s.details.stepType === "tool_call" && (
											<StyledTool
												direction={"row"}
												alignItems={"center"}
												spacing={2}
											>
												<Hardware
													fontSize="medium"
													sx={{
														color: "#757575",
													}}
												/>

												<Typography
													variant="subtitle2"
													noWrap={true}
												>
													{s.details.tool_name}
												</Typography>
											</StyledTool>
										)}
										{s.details.stepType ===
											"llm_reasoning" &&
											// <Markdown>{s.details.prompt}</Markdown>
											null}

										{s.details.stepType ===
											"human_intervention" &&
											// <Typography variant="body2">
											// 	Ask a {s.details.required_role} to{" "}
											// 	{s.details.instructions}
											// </Typography>
											null}
										{s.details.stepType ===
											"no_tool_available" && (
											<Stack
												direction={"row"}
												justifyContent={"center"}
											>
												<Button
													size="small"
													variant="outlined"
													color="warning"
													startIcon={<Link />}
													onClick={() => {
														setIsLinkOpen(true);
													}}
												>
													Link Tool
												</Button>
											</Stack>
										)}

										{/* <Typography variant="caption">
										{s.details.rationaleForStep}
									</Typography> */}
									</Stack>
								</Stepper.StepContent>
							</Stepper.Step>
						))}
					</Stepper>
				)}
				{isLast && (
					<Stack direction="row" justifyContent={"space-between"}>
						<Button
							size="small"
							variant="text"
							startIcon={<Add />}
							onClick={() => {
								setIsAddStepOpen(true);
							}}
						>
							Add
						</Button>
						<Button
							size="small"
							variant="contained"
							disabled={!canAccept}
							startIcon={<Check />}
							onClick={() => {
								acceptPlan();
							}}
						>
							Accept
						</Button>
					</Stack>
				)}

				{isAddStepOpen && (
					<AddStepOverlay
						onClose={(success, step) => {
							// update the plan if successful
							if (success) {
								message.addStep(step);
							}

							// close it
							setIsAddStepOpen(false);
						}}
					/>
				)}

				{isLinkOpen && (
					<LinkStepOverlay
						onClose={(success) => {
							// close it
							setIsLinkOpen(false);
						}}
					/>
				)}
			</StyledPlanMessage>
		);
	},
);
