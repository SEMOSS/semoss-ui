import { DeleteRounded, MoreVert } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
	Card,
	IconButton,
	Menu,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { deleteTeam } from "@/api/teams";
import AMAZON_S3 from "@/assets/loginProviders/Amazon_S3.png";
import ADFS from "@/assets/loginProviders/adfs_microsoft_1.png";
import Dropbox from "@/assets/loginProviders/dropbox.png";
import Github from "@/assets/loginProviders/github.png";
import Gitlab from "@/assets/loginProviders/gitlab.png";
import newGoogle from "@/assets/loginProviders/google.png";
import Keycloak from "@/assets/loginProviders/keycloak.png";
import Linkedin from "@/assets/loginProviders/linkedin.png";
import Microsoft from "@/assets/loginProviders/microsoft.png";
import Okta from "@/assets/loginProviders/okta.png";
import ProductHunt from "@/assets/loginProviders/product_hunt.png";
import Salesforce from "@/assets/loginProviders/salesforce.png";
import Saml from "@/assets/loginProviders/saml.png";
import Siteminder from "@/assets/loginProviders/siteminder.png";
import Surverymonkey from "@/assets/loginProviders/surveymonkey.png";
import Twitter from "@/assets/loginProviders/x_twitter.png";
import { AddTeamModal } from "./add-team-modal";
import { TeamDeleteDialog } from "./team-delete-dialog";

const TypeImageObject = {
	native: AMAZON_S3,
	google: newGoogle,
	github: Github,
	okta: Okta,
	dropbox: Dropbox,
	adfs: ADFS,
	gitlab: Gitlab,
	keycloak: Keycloak,
	linkedin: Linkedin,
	ms: Microsoft,
	product_hunt: ProductHunt,
	salesforce: Salesforce,
	saml: Saml,
	siteminder: Siteminder,
	surveymonkey: Surverymonkey,
	twitter: Twitter,
};

const StyledTileCard = styled(Card)(() => ({
	"&:hover": {
		cursor: "pointer",
	},
	width: "100%",
	padding: "8px",
	borderRadius: "12px",
	minWidth: "288px",
	maxHeight: "200px",
}));

const StyledCardDescription = styled(Typography)({
	display: "-webkit-box",
	minHeight: "80px",
	maxHeight: "80px",
	maxWidth: "256px",
	WebkitLineClamp: 4,
	WebkitBoxOrient: "vertical",
	overflow: "hidden",
	textOverflow: "ellipsis",
	fontSize: "14px",
	color: "rgba(0, 0, 0, 0.6)",
	lineHeight: "20.02px",
	letter: "0.17px",
});

const StyledTitle = styled(Typography)({
	display: "block",
	minHeight: "24px",
	maxHeight: "24px",
	maxWidth: "350px",
	whiteSpace: "pre-wrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
	fontSize: "16px",
	lineHeight: "24px",
	letter: "0.15px",
});

const StyledHeaderActions = styled("div")({
	display: "flex",
	alignItems: "flex-start",
	justifyContent: "flex-end",
});

const StyledMoreVert = styled(MoreVert, {
	shouldForwardProp: (prop) => prop !== "hover",
})<{
	/** Track if the page header is stuck */
	hover: boolean;
}>(({ theme, hover }) => ({
	color: hover ? theme.palette.divider : theme.palette.text.secondary,
}));

interface TeamCardProps {
	/** ID of team */
	id: string;

	/** Description of the team */
	description: string;

	/** Type of the team */
	type: string;

	/** dispatch function */
	dispatch: (val: { type: string; field: string; value: unknown[] }) => void;

	/** databases to update */
	teams;

	/** Callback when this team is deleted */
	onDelete?: () => void;

	onClick?: (value: string) => void;
}

export const TeamTileCard = (props: TeamCardProps) => {
	const { id, description, type, dispatch, teams, onDelete, onClick } = props;
	const notification = useNotification();

	const [hover, setHover] = React.useState(false);
	const [deleteModal, setDeleteModal] = React.useState(false);
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
		null,
	);
	const [editTeam, setEditTeam] = useState(false);

	const descriptionText = description
		? description.replace(/['"]+/g, "")
		: "No description available";

	const deleteGroup = async () => {
		try {
			const response = await deleteTeam(id, type);
			if (
				typeof response === "boolean"
					? response
					: response?.data?.success === false
			) {
				throw new Error("Failed to delete team");
			}
			dispatch({
				type: "field",
				field: "teams",
				value: [...teams.filter((val) => val.id !== id)],
			});
			onDelete?.();
			notification.add({
				color: "success",
				message: "Successfully deleted team",
			});
		} catch (e) {
			console.error(e);
			notification.add({
				color: "error",
				message: e instanceof Error ? e.message : String(e),
			});
		} finally {
			setDeleteModal(false);
		}
	};

	const handleClick = (event) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (event?: React.SyntheticEvent) => {
		event?.stopPropagation();
		setAnchorEl(null);
	};

	const providerKey = type ? type.toLowerCase() : "";
	const providerIcon = TypeImageObject[providerKey];

	return (
		<React.Fragment>
			<StyledTileCard onClick={() => onClick(id)}>
				<Card.Header
					title={
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								gap: "8px",
								alignItems: "center",
							}}
						>
							{providerIcon ? (
								<img
									src={providerIcon}
									alt={`${type} icon`}
									style={{
										height: "20px",
										width: "20px",
									}}
								/>
							) : (
								<Users className="size-4 text-muted-foreground" />
							)}
							<StyledTitle variant={"body1"}>{id}</StyledTitle>
						</div>
					}
					action={
						<StyledHeaderActions>
							<IconButton
								size={"small"}
								color="default"
								onClick={handleClick}
							>
								<StyledMoreVert hover={hover} />
							</IconButton>
							<Menu
								anchorEl={anchorEl}
								open={Boolean(anchorEl)}
								onClose={handleClose}
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "right",
								}}
								transformOrigin={{
									vertical: "top",
									horizontal: "right",
								}}
								sx={{
									"& .MuiPaper-root": {
										borderRadius: "4px",
									},
								}}
							>
								<Menu.Item
									onClick={(e) => {
										e.stopPropagation();
										handleClose(e);
										setEditTeam(true);
									}}
								>
									<Stack direction="row" gap={0.5}>
										<EditIcon
											sx={{
												color: "#0000008A",
												fontSize: 18,
											}}
										/>
										<Typography variant="body2">
											Edit team
										</Typography>
									</Stack>
								</Menu.Item>
								<Menu.Item
									onClick={(e) => {
										e.stopPropagation();
										setDeleteModal(true);
										handleClose(e);
									}}
									onMouseOver={() => {
										setHover(true);
									}}
									sx={{ color: hover ? "red" : "#0000008A" }}
									onMouseLeave={() => {
										setHover(false);
									}}
								>
									<Stack direction="row" gap={0.5}>
										<DeleteRounded
											sx={{
												color: hover
													? "red"
													: "#0000008A",
												fontSize: 18,
											}}
										/>
										<Typography
											variant="body2"
											sx={{
												color: hover ? "red" : "black",
											}}
										>
											Delete team
										</Typography>
									</Stack>
								</Menu.Item>
							</Menu>
						</StyledHeaderActions>
					}
				/>
				<Card.Content>
					<StyledCardDescription variant={"body2"}>
						{descriptionText}
					</StyledCardDescription>
				</Card.Content>
			</StyledTileCard>
			<TeamDeleteDialog
				open={deleteModal}
				onOpenChange={setDeleteModal}
				teamId={id}
				onConfirm={deleteGroup}
			/>
			<AddTeamModal
				open={editTeam}
				isEdit={true}
				type={type}
				id={id}
				description={description}
				onClose={(team) => {
					if (team) {
						const updatedTeams = teams.map((t) =>
							t.id === team.previousTeamName
								? {
										id: team.id,
										description: team.description,
										type: team.type,
									}
								: t,
						);

						dispatch({
							type: "field",
							field: "teams",
							value: updatedTeams, // Update the existing team in the array
						});
					}
					setEditTeam(false);
				}}
			/>
		</React.Fragment>
	);
};
