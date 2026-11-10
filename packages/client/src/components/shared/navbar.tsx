// biome-ignore-all lint/correctness/useUniqueElementIds: shared navbar slot IDs
import { Bell } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useConfig } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { usePage } from "@/hooks/use-page";
import { NotificationDrawer } from "../notifications/notification-drawer";

// the search loads only once a page turns it on, so the navbar does not wait for it
const PlatformSearch = lazy(() =>
	import("./platform-search").then((module) => ({
		default: module.PlatformSearch,
	})),
);

/**
 * The bar across the top of the app: slots that pages fill (`navbar--left` and
 * `navbar--right`), the platform search when the page asks for it, and the
 * notifications bell when notifications are on, which checks for unread ones
 * every minute.
 */
export const Navbar: React.FC = () => {
	const page = usePage();
	const setNavbarElement = usePage((state) => state.setNavbarElement);
	const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const notificationsEnabled = useConfig(
		(state) => state.config?.notificationEnabled ?? false,
	);

	useEffect(() => {
		if (!notificationsEnabled) {
			setUnreadCount(0);
			return;
		}

		let isActive = true;

		async function poll() {
			try {
				const pixel = `PollNotifications()`;
				const res = await runPixel(pixel);
				const count = res.pixelReturn[0].output;
				if (isActive) {
					setUnreadCount(typeof count === "number" ? count : 0);
				}
			} catch (e) {
				console.error("Pixel call failed:", e);
			}
		}

		poll(); // initial call
		const pollInterval = setInterval(() => {
			poll();
		}, 60000); // every 1 min

		return () => {
			isActive = false;
			clearInterval(pollInterval);
		};
	}, [notificationsEnabled]);

	const handleBellClick = () => {
		setDrawerOpen(true);
		setUnreadCount(0);
	};

	return (
		<div
			ref={setNavbarElement}
			className="absolute top-0 flex h-14 w-full flex-row items-center justify-between gap-4 border-border border-b bg-background px-8 text-foreground sm:gap-2 sm:px-2 md:gap-3 md:px-4"
		>
			{/* Left slot */}
			<div
				id="navbar--left"
				className="flex min-w-6 flex-1 flex-row items-center justify-start gap-2 overflow-hidden"
			/>

			{/* Center spacer */}
			{/* <div className="flex-1" /> */}

			{/* Right slot */}
			<div
				id="navbar--right"
				className="flex flex-row items-center justify-end gap-0.5"
			>
				{/* Search — Popover with Tooltip */}
				{page.navbar?.search && (
					<Suspense fallback={null}>
						<PlatformSearch />
					</Suspense>
				)}

				{/* Notification bell */}
				{notificationsEnabled && (
					<>
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleBellClick}
									aria-label="Notifications"
									className="relative text-muted-foreground"
								>
									<Bell />
									{unreadCount > 0 && (
										<Badge
											variant="destructive"
											className="absolute top-0 right-0 flex h-4 px-1 text-[8px]"
										>
											{unreadCount > 9
												? "9+"
												: unreadCount}
										</Badge>
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Notifications
							</TooltipContent>
						</Tooltip>

						<NotificationDrawer
							open={drawerOpen}
							onClose={() => setDrawerOpen(false)}
							data-testid="notification-drawer"
						/>
					</>
				)}
			</div>
		</div>
	);
};
