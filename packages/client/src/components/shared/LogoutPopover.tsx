import { CircleUserRound, LogOut } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
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
	const [loggingOut, setLoggingOut] = useState(false);
	const [open, setOpen] = useState(false);

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
