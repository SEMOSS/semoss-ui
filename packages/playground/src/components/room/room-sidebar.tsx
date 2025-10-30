import { XIcon } from "lucide-react";
import { Button } from "@semoss/ui/next";

// Styles are now handled with Tailwind classes inline

interface RoomSidebarProps {
	/** Header in the menu */
	header: React.ReactNode;

	/** Content */
	children: React.ReactNode;

	/** Close the Menu */
	onClose?: () => void;
}

export const RoomSidebar = (props: RoomSidebarProps) => {
	const { children, header, onClose } = props;
	return (
		<div className="relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar p-2 shadow-sm">
			<div className="flow-row flex items-center justify-between overflow-hidden">
				<div className="flex-1 truncate font-medium text-base">
					{header}
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => {
						onClose?.();
					}}
				>
					<XIcon />
				</Button>
			</div>
			<div className="w-full flex-1 overflow-hidden rounded-md">
				{children}
			</div>
		</div>
	);
};
