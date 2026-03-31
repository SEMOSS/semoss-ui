/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { Bell } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Badge,
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import { usePage, useRootStore } from "@/hooks";
import { NotificationDrawer } from "../notifications/notification-drawer";
import { PlatformSearch } from "./platform-search";

export const Navbar: React.FC = observer(() => {
	const { page } = usePage();
	const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
	const [hasUnread, setHasUnread] = useState<number>(0);
	const { configStore } = useRootStore();
	const notificationsEnabled = configStore?.config?.notificationEnabled;

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
		<TooltipProvider delayDuration={300}>
			<div
				ref={(n) => page.setNavbarElement(n)}
				className="absolute top-0 flex h-14 w-full flex-row items-center justify-between gap-4 border-border border-b bg-background px-8 text-foreground sm:gap-2 sm:px-2 md:gap-3 md:px-4"
			>
				{/* Left slot */}
				<div
					id="navbar--left"
					className="flex min-w-6 flex-1 flex-row items-center justify-start gap-2 overflow-hidden"
				/>

				{/* Center spacer */}
				<div className="flex-1" />

				{/* Right slot */}
				<div
					id="navbar--right"
					className="flex min-w-6 flex-1 flex-row items-center justify-end gap-0.5"
				>
					{/* Search — Popover with Tooltip */}
					{page.navbar?.search && <PlatformSearch />}

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
										className="relative h-9 w-9 text-muted-foreground hover:bg-accent hover:text-foreground"
									>
										<Bell className="h-[18px] w-[18px]" />
										{typeof hasUnread === "number" &&
											hasUnread > 0 && (
												<Badge
													variant="destructive"
													className="-right-[0.5px] -top-[0.5px] absolute flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 font-sans text-[10px]"
												>
													{hasUnread > 9
														? "9+"
														: hasUnread}
												</Badge>
											)}
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="bottom"
									className="text-xs"
								>
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
		</TooltipProvider>
	);
});
