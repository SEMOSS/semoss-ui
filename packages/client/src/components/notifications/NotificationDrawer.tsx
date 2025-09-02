import { Close } from "@mui/icons-material";
import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Box,
	Button,
	IconButton,
	Stack,
	styled,
	Tab,
	Tabs,
	Typography,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";
import { formatDate } from "@/utility/general";
import { getNotificationMessage } from "./NotificationTemplates";
import type { NotificationRecord } from "./types";

const Backdrop = styled("div")(({ theme }) => ({
	position: "fixed",
	inset: 0,
	background: "rgba(0,0,0,0.1)",
	//background: theme.palette.text.disabled,
	zIndex: 1200,
	display: "flex",
	justifyContent: "flex-end",
}));

const Panel = styled("div")(({ theme }) => ({
	width: "530px",
	borderRadius: "8px",
	margin: "8px",
	background: theme.palette.background.paper,
	display: "flex",
	flexDirection: "column",
}));

const Header = styled("div")(({ theme }) => ({
	padding: theme.spacing(1, 0, 1, 0),
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	margin: theme.spacing(0, 3, 0, 3),
}));

const List = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
  margin: theme.spacing(1),
	padding: theme.spacing(1, 2, 1, 2),
  overflow: "auto",
}));

const Item = styled("div")<{ is_read: boolean }>(({ theme, is_read }) => ({
	height: 76,
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	padding: 16,
	fontSize: 14,
	borderRadius: 8,
	border: `1px solid ${theme.palette.divider}`,
	background: is_read
		? theme.palette.background.paper
		: theme.palette.primary.hover,
	cursor: "pointer",
	"&:hover": {
		boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
	},
}));

const StyledIconButton = styled(IconButton)({
	"& .MuiSvgIcon-root": { width: 20, height: 20 },
});

const Wrap = styled(Box)(({ theme }) => ({
	borderBottom: `1px solid ${theme.palette.divider}`,
	background: theme.palette.background.paper,
	padding: theme.spacing(1, 0, 1, 0),
	marginBottom: theme.spacing(2),
	paddingBottom: theme.spacing(2),
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	margin: theme.spacing(0, 3, 0, 3),
}));

const SegmentedTabs = styled(Tabs)(({ theme }) => ({
	height: 36,
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius * 1.5 || 12,
	overflow: "hidden",
	minHeight: 36,
	"& .MuiTabs-indicator": { display: "none" },
	"& .MuiTabs-flexContainer": { height: "100%" },
}));

const PillTab = styled(Tab)(({ theme }) => ({
	minWidth: "auto",
	width: "auto",
	height: 36,
	minHeight: 36,
	padding: "6px 16px",
	textTransform: "none",
	fontWeight: 500,
	lineHeight: 1,
	color: theme.palette.text.secondary,
	borderRight: `1px solid ${theme.palette.divider}`,
	borderRadius: 0,
	"&:last-of-type": { borderRight: "none" },
	"&:hover": { backgroundColor: theme.palette.action.hover },
	"&.Mui-selected": {
		color: theme.palette.text.secondary,
		backgroundColor: theme.palette.action.selected,
	},
	transition: theme.transitions.create(["background-color", "color"], {
		duration: theme.transitions.duration.shorter,
	}),
}));

const ClearButton = styled(Button)(({ theme }) => ({
	textTransform: "none",
	fontWeight: 600,
	color: theme.palette.primary.main,
	minWidth: 0,
	"&:hover": { backgroundColor: "transparent" },
}));

const StyledBox = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	padding: theme.spacing(2),
}));

const StyledTimeFormat = styled(Typography)({
	mt: 0.25,
	display: "inline-block",
});

export const NotificationDrawer: React.FC<{
	open: boolean;
	onClose: () => void;
}> = ({ open, onClose }) => {
	const { configStore } = useRootStore();
	const loggedInUser = configStore?.store?.user?.name;

	useEffect(() => {
		if (!open) return;

		(async () => {
			try {
				const pixel = `GetNotifications()`; //`GetNotificationsReactor`
				const res = await runPixel(pixel);
				setLocalNotifications(
					res.pixelReturn[0].output as NotificationRecord[],
				);
				setSelectedTab("all");
			} catch (err) {
				console.error("Pixel call failed:", err);
			}
		})();
	}, [open]);

	const [selectedTab, setSelectedTab] = useState<"all" | "read" | "unread">(
		"all",
	);
	const [localNotifications, setLocalNotifications] = useState<
		NotificationRecord[]
	>([]);

	const unread = useMemo(
		() => localNotifications.filter((n) => !n.notification_isread),
		[localNotifications],
	);
	const read = useMemo(
		() => localNotifications.filter((n) => n.notification_isread),
		[localNotifications],
	);
	const unreadCount = unread.length;

	const displayedNotifications = useMemo(() => {
		switch (selectedTab) {
			case "unread":
				return unread;
			case "read":
				return read;
			default:
				return localNotifications;
		}
	}, [selectedTab, localNotifications, unread, read]);

	const handleTabChange = (_e: React.SyntheticEvent, v: string) => {
		setSelectedTab(v as "all" | "unread" | "read");
	};

	const handleItemActivate = async (id: string) => {
		setLocalNotifications((prev) =>
			prev.map((n) =>
				n.notification_id === id
					? { ...n, notification_isread: true }
					: n,
			),
		);

		const pixel = `UpdateReadNotifications ( notificationId = "${id}" )`;

		try {
			await runPixel(pixel);
		} catch (e) {
			console.error("UpdateReadNotifications failed:", e);
			setLocalNotifications((prev) =>
				prev.map((n) =>
					n.notification_id === id
						? { ...n, notification_isread: false }
						: n,
				),
			);
		}
	};
	const clearAll = async () => {
		try {
			const pixel = `DeleteNotifications()`;
			const res = await runPixel(pixel);
			console.log("Pixel response (clearAll):", res);
			setLocalNotifications([]);
		} catch (err) {
			console.error("Pixel call failed in clearAll:", err);
		} finally {
			// Clear everything after the pixel call (success or fail)
			setLocalNotifications([]);
		}
	};

	if (!open) return null;

	return (
		<Backdrop onClick={onClose}>
			<Panel onClick={(e) => e.stopPropagation()}>
				<Header>
					<Typography variant="subtitle1" fontWeight={600}>
						Notifications
					</Typography>
					<Stack direction="row" spacing={1}>
						<StyledIconButton onClick={onClose}>
							<Close />
						</StyledIconButton>
					</Stack>
				</Header>

				<Wrap>
					<SegmentedTabs
						value={selectedTab}
						onChange={handleTabChange}
						aria-label="Notification filters"
					>
						<PillTab label="All" value="all" />
						<PillTab label="Read" value="read" />
						<PillTab
							label={`Unread${unreadCount ? `(${unreadCount})` : ""}`}
							value="unread"
						/>
					</SegmentedTabs>

					<ClearButton
						size="small"
						onClick={clearAll}
						variant="outlined"
					>
						Clear All
					</ClearButton>
				</Wrap>

				<List>
					{displayedNotifications.length === 0 ? (
						<StyledBox>
							<Typography variant="body2" color="text.secondary">
								No notifications yet.
							</Typography>
						</StyledBox>
					) : (
						displayedNotifications.map((n) => (
							<Item
								key={n.notification_id}
								is_read={n.notification_isread}
								tabIndex={0}
								onClick={() =>
									handleItemActivate(n.notification_id)
								}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleItemActivate(n.notification_id);
									}
								}}
							>
								{/* message from your template file */}
								<Typography variant="body2">
									{getNotificationMessage(n, loggedInUser)}
								</Typography>

								{/* timestamp */}
								{n.notification_createdat && (
									<StyledTimeFormat
										variant="caption"
										color="text.secondary"
										title={n.notification_createdat}
									>
										{formatDate(n.notification_createdat)}
									</StyledTimeFormat>
								)}
							</Item>
						))
					)}
				</List>
			</Panel>
		</Backdrop>
	);
};
