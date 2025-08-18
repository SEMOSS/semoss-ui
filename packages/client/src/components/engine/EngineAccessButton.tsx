import { Add, EditRounded, RemoveRedEyeRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
	Avatar,
	Box,
	Button,
	Card,
	Modal,
	RadioGroup,
	Stack,
	styled,
	TextArea,
	useNotification,
} from "@semoss/ui";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useEngine, useRootStore } from "@/hooks";
import type { Role } from "@/types";

const StyledCard = styled(Card)({
	borderRadius: "12px",
});

const StyledButton = styled(Button)(({ theme }) => ({
	borderRadius: "12px",
	border: `1px solid ${theme.palette.primary.main}`,
	fontSize: theme.typography.pxToRem(13),
	height: "30px",
	padding: theme.spacing(0, 1.5),
}));

const HeaderRow = styled(Box)(({ theme }) => ({
	display: "flex",
	fontSize: theme.typography.pxToRem(16),
}));

const TitleAvatar = styled(Avatar)(({ theme }) => ({
	width: "22px",
	height: "22px",
	marginTop: theme.spacing(0.25), // ~2px
	marginRight: theme.spacing(1.5), // 12px
	fontSize: theme.typography.pxToRem(12),
	fontWeight: 700,
	backgroundColor: "rgba(0, 0, 0, .5)",
}));

const IconWrapper = styled("span")(({ theme }) => ({
	display: "inline-flex",
	marginTop: theme.spacing(0.25),
	marginRight: theme.spacing(1.5),
	fontWeight: 700,
	color: "rgba(0, 0, 0, .5)",
}));

const SubheaderOffset = styled(Box)(() => ({
	marginLeft: "30px",
}));

const EditRoundedIcon = styled(EditRounded)(() => ({
	width: "22px",
	height: "22px",
}));
const RemoveRedEyeRoundedIcon = styled(RemoveRedEyeRounded)(() => ({
	width: "22px",
	height: "22px",
}));

type EngineAccessButtonProps = {
	fromApp?: boolean;
};

export const EngineAccessButton = ({ fromApp }: EngineAccessButtonProps) => {
	const { type, active } = useEngine();

	const { monolithStore } = useRootStore();
	const notification = useNotification();

	// track if open
	const [open, setOpen] = useState(false);
	const [requestedRole, setRequestedRole] = useState<Role>(active.role);

	const [comment, setComment] = useState<string>("");

	// close when the id changes
	useEffect(() => {
		setOpen(false);
	}, [active.id]);

	// update the requested whenever the role changes
	useEffect(() => {
		setRequestedRole(active.role);
	}, [active.role]);

	/**
	 * Request the new access
	 */
	const requestAccess = async () => {
		try {
			const response = await monolithStore.runQuery(
				`META | RequestEngine(engine=['${
					active.id
				}'], permission=['${requestedRole}']${
					comment && `, comment=['${comment}']`
				})`,
			);

			const { operationType, output } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output,
				});

				return;
			}

			notification.add({
				color: "success",
				message: output,
			});

			// close is
			setOpen(false);
		} catch (e) {
			console.log(e);
		}
	};

	// cannot request access if the owner
	if (active?.role === "OWNER" && !fromApp) {
		return null;
	}
	return (
		<>
			{fromApp ? (
				<StyledButton onClick={() => setOpen(true)}>
					{active?.role === "DISCOVERABLE" || !active.role
						? "Request Access"
						: "Change Access"}
				</StyledButton>
			) : (
				<Button
					startIcon={<Add />}
					variant="outlined"
					onClick={() => setOpen(true)}
				>
					{active?.role === "DISCOVERABLE" || !active.role
						? "Request Access"
						: "Change Access"}
				</Button>
			)}

			<Modal
				open={open}
				maxWidth={"md"}
				onClose={() => {
					setOpen(false);
				}}
			>
				<Modal.Title>
					{active?.role === "DISCOVERABLE"
						? "Request Access"
						: "Change Access"}
				</Modal.Title>
				<Modal.Content>
					<RadioGroup
						label={""}
						defaultValue={active?.role}
						onChange={(e) => {
							setRequestedRole(e.target.value as Role);
						}}
					>
						<Stack spacing={1}>
							<StyledCard>
								<Card.Header
									title={
										<HeaderRow>
											<TitleAvatar>A</TitleAvatar>
											Author
										</HeaderRow>
									}
									subheader={
										<SubheaderOffset>
											{
												PERMISSION_DESCRIPTION_MAP[type]
													.author
											}
										</SubheaderOffset>
									}
									action={
										<RadioGroup.Item
											value="OWNER"
											label=""
										/>
									}
								/>
							</StyledCard>
							<StyledCard>
								<Card.Header
									title={
										<HeaderRow>
											<IconWrapper>
												<EditRoundedIcon />
											</IconWrapper>
											Editor
										</HeaderRow>
									}
									subheader={
										<SubheaderOffset>
											{
												PERMISSION_DESCRIPTION_MAP[type]
													.editor
											}
										</SubheaderOffset>
									}
									action={
										<RadioGroup.Item
											value="EDIT"
											label=""
										/>
									}
								/>
							</StyledCard>
							<StyledCard>
								<Card.Header
									title={
										<HeaderRow>
											<IconWrapper>
												<RemoveRedEyeRoundedIcon />
											</IconWrapper>
											Read-Only
										</HeaderRow>
									}
									subheader={
										<SubheaderOffset>
											{
												PERMISSION_DESCRIPTION_MAP[type]
													.readonly
											}
										</SubheaderOffset>
									}
									action={
										<RadioGroup.Item
											value="READ_ONLY"
											label=""
										/>
									}
								/>
							</StyledCard>

							{/* tom---> comment textarea if we want this here, can be removed */}
							<Card.Header title={<Box>Comment:</Box>} />
							<TextArea
								required={false}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								rows={3}
							></TextArea>
						</Stack>
					</RadioGroup>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant={"outlined"}
						onClick={() => {
							setOpen(false);
						}}
					>
						Cancel
					</Button>
					<Button
						variant={"contained"}
						disabled={
							!requestedRole || requestedRole === active?.role
						}
						onClick={() => {
							requestAccess();
						}}
					>
						{fromApp ? "Submit" : "Request"}
					</Button>
				</Modal.Actions>
			</Modal>
		</>
	);
};
