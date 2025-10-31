import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";

// Styles are now handled with Tailwind classes inline

interface RoomSidebarProps {
	/** Header in the menu */
	header: React.ReactNode;

	/** Content */
	children: React.ReactNode;

	/** Allow the menu to be maximized */
	maximize?: boolean;

	/** Close the Menu */
	onClose?: () => void;
}

export const RoomSidebar = ({
	children,
	header,
	maximize = false,
	onClose = () => null,
}: RoomSidebarProps) => {
	const [isMaximized, setIsMaximized] = useState(false);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div
				className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
					isMaximized
						? "pointer-events-auto opacity-100"
						: "pointer-events-none hidden opacity-0"
				}`}
			/>
			<div
				className={`flex flex-col gap-2 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar p-2 shadow-sm transition-all duration-200 ease-in-out ${isMaximized ? "fixed inset-4 z-50" : "h-full w-full"}`}
			>
				<div className="flow-row flex items-center justify-between overflow-hidden">
					<div className="flex-1 truncate font-medium text-base">
						{header}
					</div>
					{maximize ? (
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								setIsMaximized(!isMaximized);
							}}
						>
							{isMaximized ? (
								<Minimize2Icon />
							) : (
								<Maximize2Icon />
							)}
						</Button>
					) : null}
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							setIsMaximized(false);
							onClose();
						}}
					>
						<XIcon />
					</Button>
				</div>
				<div className="w-full flex-1 overflow-hidden rounded-md">
					{children}
				</div>
			</div>
		</div>
	);
};
