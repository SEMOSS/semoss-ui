// biome-ignore-all lint/correctness/useUniqueElementIds: shared navbar slot IDs
import { Bell } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Badge,
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useConfig, usePage } from "@/hooks";
import { NotificationDrawer } from "../notifications/notification-drawer";

const PlatformSearch = lazy(() =>
	import("./platform-search").then((module) => ({
		default: module.PlatformSearch,
	})),
);

export const Navbar: React.FC = () => {
	const page = usePage();
	const setNavbarElement = usePage((state) => state.setNavbarElement);
	const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
	const [hasUnread, setHasUnread] = useState<number>(0);
	const notificationsEnabled = useConfig(
		(state) => state.config.notificationEnabled,
	);

	useEffect(() => {
		if (!notificationsEnabled) {
			setHasUnread(0);
			return;
		}

		let isActive = true;

		async function poll() {
			try {
				const pixel = `PollNotifications()`;
				const res = await runPixel(pixel);
				const num = res.pixelReturn[0].output;
				if (isActive) {
					setHasUnread(num as number);
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
		setHasUnread(0);
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
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleBellClick}
									aria-label="Notifications"
									className="relative text-muted-foreground"
								>
									<Bell />
									{typeof hasUnread === "number" &&
										hasUnread > 0 && (
											<Badge
												variant="destructive"
												className="absolute top-0 right-0 flex h-4 px-1 text-[8px]"
											>
												{hasUnread > 9
													? "9+"
													: hasUnread}
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
