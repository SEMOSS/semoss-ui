import { MoreVertOutlined } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	CircularProgress,
	IconButton,
	List,
	Menu,
	styled,
	useNotification,
} from "@semoss/ui";
import { useChat } from "@/hooks";

const StyledLink = styled(Link)(() => ({
	width: "100%",
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
}));

const StyledListItem = styled(List.Item, {
	shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
	gap: "0px",
	color: selected ? theme.palette.primary.main : undefined,
	backgroundColor: selected ? theme.palette.primary.selected : undefined,
	borderRadius: theme.shape.borderRadiusSm,

	"& * [data-onhover]": {
		visibility: "hidden",
	},

	"&:hover * [data-onhover]": {
		visibility: "visible",
	},
}));

const StyledListItemText = styled(List.ItemText)(() => ({
	padding: "4px 0",
}));

interface SidebarItemProps {
	/** Id of the room */
	roomId: string;
}

export const SidebarRoom = observer((props: SidebarItemProps) => {
	const { roomId } = props;

	const { chat } = useChat();
	const navigate = useNavigate();

	const notification = useNotification();

	const { roomId: activeRoomId } = useParams<{ roomId: string }>();

	// get the room
	const room = chat.getRoom(roomId);

	const [chatMenu, setChatMenu] = React.useState(null);
	const isSettingsMenuOpen = Boolean(chatMenu);

	// set the name of the room
	let name = "Untitled";
	if (room.metadata?.name) {
		name = room.metadata?.name;
	}

	return (
		<StyledLink to={`/room/${roomId}`} aria-label={"Select a room"}>
			<StyledListItem
				selected={activeRoomId === roomId}
				secondaryAction={
					<>
						<IconButton
							id={"settings-control"}
							aria-controls={
								isSettingsMenuOpen ? "settings-menu" : undefined
							}
							aria-label="settings"
							aria-expanded={
								isSettingsMenuOpen ? "true" : undefined
							}
							aria-haspopup="true"
							data-onhover
							onClick={(e) => {
								// cancel the event
								e.preventDefault();

								// open the menu
								setChatMenu(e.currentTarget);
							}}
						>
							<MoreVertOutlined />
						</IconButton>
						<Menu
							id={"settings-menu"}
							// MenuListProps={{
							//     'aria-labelledby': 'long-button',
							// }}
							anchorEl={chatMenu}
							open={isSettingsMenuOpen}
							onClose={() => {
								setChatMenu(null);
							}}
						>
							<Menu.Item
								disabled={!!room}
								onClick={(e) => {
									try {
										// cancel the event
										e.preventDefault();

										room.downloadHistory();

										// close it
										setChatMenu(null);
									} catch (e) {
										notification.add({
											color: "error",
											message: e.message,
										});
									}
								}}
							>
								Download
							</Menu.Item>
							<Menu.Item
								onClick={(e) => {
									try {
										// cancel the event
										e.preventDefault();

										// close it
										chat.closeRoom(roomId);

										// close it
										setChatMenu(null);

										// navigate to new
										navigate("new");
									} catch (e) {
										notification.add({
											color: "error",
											message: e.message,
										});
									}
								}}
							>
								Delete
							</Menu.Item>
						</Menu>
					</>
				}
			>
				<StyledListItemText
					primary={name}
					primaryTypographyProps={{
						variant: "body1",
						noWrap: true,
					}}
				/>
				{room.isLoading && (
					<CircularProgress color={"secondary"} size={"20px"} />
				)}
			</StyledListItem>
		</StyledLink>
	);
});
