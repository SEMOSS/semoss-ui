import { CallMade, Delete } from "@mui/icons-material";
import type React from "react";
import {
	Box,
	Button,
	Chip,
	IconButton,
	Link,
	styled,
	Typography,
} from "@semoss/ui";
import { formatDate } from "@/utility/general";
import { getNotificationMessage } from "./NotificationTemplates";
import type { NotificationRecord } from "./types";

const StyledItem = styled("div")<{ is_read: boolean }>(
	({ theme, is_read }) => ({
		position: "relative",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		padding: 8,
		fontSize: 14,
		borderRadius: 8,
		border: `1px solid ${theme.palette.divider}`,
		borderLeft: is_read
			? `1px solid ${theme.palette.divider}`
			: `5px solid ${theme.palette.primary.main}`,
		cursor: "pointer",
		"&:hover": {
			boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
		},
		".deleteOverlay": { display: "none" },
		"&:hover .deleteOverlay": { display: "inline-flex" },
	}),
);

const StyledNotificationMessage = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 1,
});

const StyledLink = styled(Link)({
	textDecoration: "none",
	alignItems: "center",
	display: "flex",
	ml: 0.5,
});

const StyledChip = styled(Chip)(({ theme }) => ({
	fontWeight: 400,
	color: theme.palette.common.white,
}));

const StyledRedirectionIcon = styled(IconButton)(({ theme }) => ({
	"& .MuiSvgIcon-root": {
		width: 18,
		height: 18,
		color: theme.palette.primary.main,
	},
}));

const StyledTimeFormat = styled(Typography)({
	mt: 0.25,
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "flex-start",
	gap: 3,
	fontSize: "14px",
});

const StyledBox = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	padding: theme.spacing(2),
}));

interface NotificationItemProps {
	notifications: NotificationRecord[];
	getHrefFromNotification: (n: NotificationRecord) => string | null;
	onMarkAsRead: (id: string) => void;
	onDelete: (id: string) => void;
	onLinkClick: () => void;
	onLoadMore?: () => void;
	hasMore?: boolean;
	loading?: boolean;
	loggedInUser?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
	notifications,
	getHrefFromNotification,
	onMarkAsRead,
	onDelete,
	onLinkClick,
	onLoadMore,
	hasMore,
	loading,
	loggedInUser,
}) => {
	// Empty state
	if (!notifications || notifications.length === 0) {
		return (
			<StyledBox>
				<Typography variant="body2" color="textSecondary">
					No notifications yet.
				</Typography>
			</StyledBox>
		);
	}

	return (
		<>
			{notifications.map((n) => {
				const href =
					n.notification_type === "USER_REQUEST"
						? getHrefFromNotification(n)
						: null;

				return (
					<StyledItem
						key={n.notification_id}
						data-testid="notification-item"
						is_read={n.notification_isread}
						onClick={() => onMarkAsRead(n.notification_id)}
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onMarkAsRead(n.notification_id);
							}
						}}
					>
						<StyledNotificationMessage>
							<Box>
								<Box sx={{ paddingBottom: 1 }}>
									<StyledChip
										label={
											n.notification_priority
												? n.notification_priority
														.charAt(0)
														.toUpperCase() +
													n.notification_priority
														.slice(1)
														.toLowerCase()
												: ""
										}
										size="small"
										variant="filled"
										color={
											n.notification_priority === "HIGH"
												? "red"
												: n.notification_priority ===
														"MEDIUM"
													? "yellow"
													: "green"
										}
									/>
								</Box>

								<Typography variant="body2">
									{getNotificationMessage(n, loggedInUser)}
								</Typography>

								{n.notification_createdat && (
									<StyledTimeFormat
										variant="caption"
										color="textSecondary"
										title={n.notification_createdat}
									>
										{formatDate(n.notification_createdat)}
										{href && (
											<StyledLink
												href={href}
												data-testid="notification-link"
												onClick={(e) => {
													e.stopPropagation();
													onMarkAsRead(
														n.notification_id,
													);
													onLinkClick();
												}}
											>
												<StyledRedirectionIcon>
													<CallMade />
												</StyledRedirectionIcon>
											</StyledLink>
										)}
									</StyledTimeFormat>
								)}
							</Box>

							<IconButton
								className="deleteOverlay"
								data-testid="delete-notification"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(n.notification_id);
								}}
							>
								<Delete fontSize="small" color="error" />
							</IconButton>
						</StyledNotificationMessage>
					</StyledItem>
				);
			})}

			{hasMore && (
				<Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
					<Button
						variant="text"
						onClick={onLoadMore}
						disabled={loading}
						data-testid="load-more"
					>
						{loading ? "Loading…" : "Load more"}
					</Button>
				</Box>
			)}
		</>
	);
};
