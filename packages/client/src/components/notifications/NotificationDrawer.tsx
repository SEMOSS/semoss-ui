import { Close } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type * as React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Box,
	Button,
	Drawer,
	IconButton,
	Stack,
	styled,
	Tab,
	Tabs,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";
import { NotificationItem } from "./NotificationItem";
import type { NotificationRecord } from "./types";

const StyledDrawer = styled(Drawer)(() => ({
	"& .MuiDrawer-paper": {
		width: 537,
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		borderRadius: "8px",
		margin: "8px",
		height: "calc(100% - 16px)",
	},
}));

const Header = styled(Box)(({ theme }) => ({
	padding: theme.spacing(1, 0, 1, 0),
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	margin: theme.spacing(0, 3, 0, 3),
}));

const List = styled(Stack)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	margin: theme.spacing(1),
	padding: theme.spacing(1, 2, 1, 2),
	overflow: "auto",
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
}));

const PillTab = styled(Tab)(({ theme }) => ({
	minWidth: "auto",
	width: "auto",
	height: 36,
	minHeight: 36,
	padding: "6px 16px",
	fontWeight: 500,
	color: theme.palette.text.secondary,
	borderRight: `1px solid ${theme.palette.divider}`,
	borderRadius: 0,
	"&:last-of-type": { borderRight: "none" },
	"&:hover": { backgroundColor: theme.palette.action.hover },
	"&.Mui-selected": {
		color: theme.palette.text.secondary,
		backgroundColor: theme.palette.action.selected,
	},
}));

const ClearButton = styled(Button)(({ theme }) => ({
	fontWeight: 600,
	color: theme.palette.primary.main,
	minWidth: 0,
	"&:hover": { backgroundColor: "transparent" },
}));

interface NotificationDrawerProps {
	open: boolean;
	onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = observer(
	(props: NotificationDrawerProps) => {
		const { open, onClose } = props;
		const { configStore } = useRootStore();
		const loggedInUser = configStore?.store?.user?.name;
		const LIMIT = 10;
		const [offset, setOffset] = useState(0);
		const [hasMore, setHasMore] = useState(true);
		const [loading, setLoading] = useState(false);
		const notification = useNotification();
		const [selectedTab, setSelectedTab] = useState<
			"all" | "read" | "unread"
		>("all");
		const [notifications, setNotifications] = useState<
			NotificationRecord[]
		>([]);
		const notificationListId = useId();

		/**
				 * Fetch notifications from the backend.
				 *
				 * @param limit - The number of notifications to fetch.
				 * @param offset - The offset to start fetching from.
				 * @returns A promise that resolves to the fetched notifications.
				 */
				const fetchNotifications = async (
					limit: number,
					offset: number,
				) => {
					try {
						// Construct the pixel command
						const pixel = `GetNotifications(limit = "${limit}", offset = "${offset}")`;

						// Run the pixel command
						const res = await runPixel(pixel);

						const first = res?.pixelReturn?.[0];

						if (!first) {
							throw new Error("No pixel return from server");
						}

						// Check for operationType error
						if (
							Array.isArray(first.operationType) &&
							first.operationType.includes("ERROR")
						) {
							const outputMsg =
								typeof first.output === "string"
									? first.output
									: JSON.stringify(first.output);
							throw new Error(outputMsg);
						}

						// Extract the output as notifications
						const notifications =
							first.output as NotificationRecord[];
						return notifications;
					} catch (e) {
						notification.add({
							color: "error",
							message:
								e?.message ?? "Failed to fetch notifications",
						});
						return []; // return empty list so caller doesn’t break
					}
				};

		useEffect(() => {
			const listEl = document.getElementById(notificationListId);
			if (listEl) {
				listEl.scrollTop = 0;
			}
		}, [selectedTab, notificationListId]);

		useEffect(() => {
			if (!open) return;
			(async () => {
				setLoading(true);
				try {
					const notifications = await fetchNotifications(LIMIT, 0);
					setNotifications(notifications);
					setOffset(notifications.length);
					setHasMore(notifications.length === LIMIT);
					setSelectedTab("all");
				} catch (err) {
					console.error("Pixel call failed:", err);
				} finally {
					setLoading(false);
				}
			})();
		}, [open]);

		/**
		 * Load more notifications.
		 *
		 * This function is called when the user reaches the bottom of the notification list,
		 * and it fetches more notifications from the backend. It sets the loading state to true,
		 * fetches the notifications using the `fetchNotifications` function, and appends the
		 * new notifications to the existing list of notifications. It then sets the offset to
		 * the new number of notifications, and sets the `hasMore` state to true if the length
		 * of the new notifications is equal to the limit.
		 */
		const loadMore = async () => {
			if (loading || !hasMore) return;
			setLoading(true);
			try {
				// Fetch more notifications from the backend.
				const more = await fetchNotifications(LIMIT, offset);
				setNotifications((prev) => [...prev, ...more]);
				setOffset(offset + more.length);
				setHasMore(more.length === LIMIT);
			} catch (err) {
				console.error("Pixel call failed (loadMore):", err);
			} finally {
				// Set the loading state to false.
				setLoading(false);
			}
		};

		useEffect(() => {
			if (selectedTab !== "all") return; // enable infinite scroll only for "All"
			const listEl = document.getElementById(notificationListId);
			if (!listEl) return;
			const onScroll = () => {
				if (
					listEl.scrollTop + listEl.clientHeight >=
						listEl.scrollHeight - 50 &&
					hasMore &&
					!loading
				) {
					loadMore();
				}
			};
			listEl.addEventListener("scroll", onScroll);
			return () => listEl.removeEventListener("scroll", onScroll);
		}, [hasMore, loading, offset, notifications, selectedTab]);

		const showLoadMoreButton = selectedTab !== "all" && hasMore;

		const unread = useMemo(
			() => notifications.filter((n) => !n.notification_isread),
			[notifications],
		);
		const read = useMemo(
			() => notifications.filter((n) => n.notification_isread),
			[notifications],
		);
		const unreadCount = unread.length;

		const displayedNotifications = useMemo(() => {
			switch (selectedTab) {
				case "unread":
					return unread;
				case "read":
					return read;
				default:
					return notifications;
			}
		}, [selectedTab, notifications, unread, read]);

		/**
		 * Handle tab change event.
		 * @param {React.SyntheticEvent} _e - Event object.
		 * @param {("all" | "unread" | "read")} v - New tab value.
		 * @returns {void}
		 */
		const handleTabChange = (
			_e: React.SyntheticEvent,
			v: "all" | "unread" | "read",
		) => {
			setSelectedTab(v);
		};

		/**
		 * Mark notifications as read.
		 * @param id - Read only the notification with the given id.
		 */
		const MarkAsRead = async (id: string) => {
			try {
				setNotifications((prev) =>
					prev.map((n) =>
						n.notification_id === id
							? { ...n, notification_isread: true }
							: n,
					),
				);
				const UpdateReadNotificationsPixel = `UpdateReadNotifications ( notificationId = "${id}" )`;
				await runPixel(UpdateReadNotificationsPixel);
			} catch (e) {
				console.error("UpdateReadNotifications failed:", e);
				setNotifications((prev) =>
					prev.map((n) =>
						n.notification_id === id
							? { ...n, notification_isread: false }
							: n,
					),
				);
			}
		};
		/**
		 * Delete notifications.
		 * @param id - If provided, delete only the notification with the given id.
		 *             Otherwise, delete all notifications.
		 */
		const deleteNotifications = async (id?: string) => {
			try {
				// If an id is provided, delete only the notification with that id.
				// Otherwise, delete all notifications.
				const DeleteNotificationsPixel = id
					? `DeleteNotifications(notificationId = "${id}")`
					: "DeleteNotifications()";
				// Run the pixel to delete the notifications.
				await runPixel(DeleteNotificationsPixel);
				setNotifications((prev) =>
					id ? prev.filter((n) => n.notification_id !== id) : [],
				);
			} catch (err) {
				console.error("DeleteNotifications failed:", err);
				if (id) {
					setNotifications((prev) => [...prev]);
				}
			}
		};

		/**
		 * Given a notification record, returns a URL that the user should be taken
		 * to when the notification is clicked. The URL is constructed as follows:
		 *
		 * 1. If the notification is not a user request, or if the notification does
		 *    not have a project ID or source, return null.
		 * 2. If the notification is from the current user, return null.
		 * 3. Otherwise, construct a URL of the form `/source/project_id?tab=accesscontrol`.
		 * 4. If the current URL has a hash, append the hash to the constructed URL.
		 * 5. Return the constructed URL.
		 *
		 * @param n - The notification record.
		 * @returns The URL to take the user to when the notification is clicked, or null.
		 */
		const getHrefFromNotification = (
			n: NotificationRecord,
		): string | null => {
			if (
				n.notification_type !== "USER_REQUEST" ||
				!n.notification_source ||
				!n.catalog_id
			) {
				return null;
			}
			if (n.user_name === loggedInUser) return null;

			let appPath: string;
			switch (n.notification_source) {
				case "app":
					appPath = `/${n.notification_source}/${n.catalog_id}?tab=accesscontrol`;
					break;
				case "model":
				case "database":
				case "function":
				case "storage":
				case "vector":
					appPath = `/engine/${n.notification_source}/${n.catalog_id}/access-control`;
					break;
				default:
					return null; // unsupported source
			}
			const currentUrl = window.location.href;
			const hashNeedle = "#";
			const idx = currentUrl.indexOf(hashNeedle);
			if (idx !== -1) {
				const base = currentUrl.substring(0, idx + hashNeedle.length);
				return `${base}${appPath}`;
			}
			return appPath;
		};

		const onLinkClick = () => {
			onClose();
		};

		if (!open) return null;
		return (
			<StyledDrawer
				anchor="right"
				open={open}
				onClose={onClose}
				ModalProps={{ keepMounted: true }}
			>
				<Header>
					<Typography variant="subtitle1" fontWeight="bold">
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
						onClick={() => deleteNotifications()}
						variant="outlined"
						data-testid="clear-all-notifications"
					>
						Clear All
					</ClearButton>
				</Wrap>

				<List id={notificationListId}>
					<NotificationItem
						notifications={displayedNotifications}
						getHrefFromNotification={getHrefFromNotification}
						onMarkAsRead={MarkAsRead}
						onDelete={deleteNotifications}
						onLinkClick={onLinkClick}
						loggedInUser={loggedInUser}
						onLoadMore={loadMore}
						hasMore={showLoadMoreButton}
						loading={loading}
					/>
				</List>
			</StyledDrawer>
		);
	},
);
