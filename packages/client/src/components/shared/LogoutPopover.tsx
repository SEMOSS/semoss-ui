import {
	ChevronRight,
	CircleUserRound,
	LogOut,
	Monitor,
	Moon,
	Sun,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useTheme,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface LogoutPopoverProps {
	/** Content to popover */
	children?: React.ReactNode;
	/** Called when popover open state changes */
	onOpenChange?: (open: boolean) => void;
}

export const LogoutPopover: React.FC<LogoutPopoverProps> = (props) => {
	const { children, onOpenChange } = props;

	const { configStore } = useRootStore();
	const { theme, setTheme } = useTheme();
	const [loggingOut, setLoggingOut] = useState(false);
	const [open, setOpen] = useState(false);
	const darkModeEnabled =
		(
			configStore.theme as {
				featureFlags?: { enableDarkMode?: boolean };
			}
		).featureFlags?.enableDarkMode ?? true;

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		onOpenChange?.(next);
	};

	const handleLogout = async () => {
		// immediately close the popover when the user clicks logout
		handleOpenChange(false);
		try {
			setLoggingOut(true);
			await configStore.logout();
		} catch (error) {
			console.error(error);
			throw error;
		} finally {
			setLoggingOut(false);
		}
	};

	return (
		<>
			{loggingOut && (
				<div className="fixed inset-0 z-[1501] flex flex-col items-center justify-center bg-background/50">
					<Spinner className="size-8" />
					<p className="mt-2 text-foreground text-sm">Logging out</p>
				</div>
			)}

			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					{children ? (
						<span className="flex w-full cursor-pointer items-center">
							{children}
						</span>
					) : (
						<Button variant="ghost" size="icon-sm">
							<CircleUserRound className="size-4" />
						</Button>
					)}
				</PopoverTrigger>

				<PopoverContent
					side="right"
					align="end"
					sideOffset={8}
					className="w-60 p-0"
				>
					{/* User info row */}
					<div className="flex items-center gap-3 border-border border-b px-4 py-3">
						{configStore.store.user.name ? (
							<Avatar>
								<AvatarFallback>
									{configStore.store.user.name[0]}
								</AvatarFallback>
							</Avatar>
						) : null}
						<span className="max-w-[9rem] truncate font-medium text-foreground text-sm">
							{configStore.store.user.name}
						</span>
					</div>
					{configStore.store.user.lastLogin &&
						configStore.store.user.lastLogin !== "null" && (
							<div className="flex items-center justify-center border-border border-b px-4 py-2">
								<span className="text-muted-foreground text-xs">
									Last login:{" "}
									{configStore.store.user.lastLogin} UTC
								</span>
							</div>
						)}
					{darkModeEnabled && (
						<div className="border-border border-b px-4 py-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-accent"
									>
										{theme === "dark" ? (
											<Moon className="size-4" />
										) : theme === "system" ? (
											<Monitor className="size-4" />
										) : (
											<Sun className="size-4" />
										)}
										<span className="ml-2">
											{theme === "dark"
												? "Dark"
												: theme === "system"
													? "System"
													: "Light"}
										</span>
										{(theme === "dark" ||
											theme === "system") && (
											<span className="ms-1 self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
												BETA
											</span>
										)}
										<ChevronRight className="ml-auto size-4 opacity-70" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side="right"
									align="start"
									sideOffset={8}
								>
									<DropdownMenuCheckboxItem
										checked={theme === "light"}
										onCheckedChange={() =>
											setTheme("light")
										}
									>
										<Sun className="size-4" />
										Light
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={theme === "dark"}
										onCheckedChange={() => setTheme("dark")}
									>
										<Moon className="size-4" />
										Dark
										<span className="ms-auto self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
											BETA
										</span>
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={theme === "system"}
										onCheckedChange={() =>
											setTheme("system")
										}
									>
										<Monitor className="size-4" />
										System
										<span className="ms-auto self-center rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
											BETA
										</span>
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
					{/* Logout button row */}
					<div className="flex items-center justify-center border-border border-b px-4 py-3">
						<Button
							variant="default"
							className="w-full"
							onClick={handleLogout}
							disabled={loggingOut}
						>
							{loggingOut ? (
								<Spinner className="size-4" />
							) : (
								<LogOut className="size-4" />
							)}
							Logout
						</Button>
					</div>

					{/* Version info row */}
					<div className="flex flex-col items-center gap-0.5 px-4 py-3">
						<span className="truncate text-muted-foreground text-xs">
							{configStore.store.config.version.version}
						</span>
						<span className="truncate text-muted-foreground text-xs">
							{configStore.store.config.version.datetime}
						</span>
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
};
