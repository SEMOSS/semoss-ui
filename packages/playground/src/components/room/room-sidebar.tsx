import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { FlexLayout } from "@semoss/shared";
import { Button } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { RoomConfiguration } from "./room-configuration";
import { RoomTool } from "./room-tool";

interface RoomSidebarProps {
	/** Room to render */
	room: RoomStore;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = observer(({ room }) => {
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
				className={`flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all duration-200 ease-in-out ${isMaximized ? "fixed inset-4 z-50" : "h-full w-full"}`}
			>
				<div className="flow-row flex items-center justify-between overflow-hidden px-2 pt-2">
					<div className="flex-1 truncate font-medium text-base">
						&nbsp;
					</div>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							setIsMaximized(!isMaximized);
						}}
					>
						{isMaximized ? <Minimize2Icon /> : <Maximize2Icon />}
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							// turn off maximized state when closing sidebar
							setIsMaximized(false);

							room.closeSidebar();
						}}
					>
						<XIcon />
					</Button>
				</div>
				<div className="w-full flex-1 overflow-hidden rounded-md">
					<div className="relative h-full w-full overflow-hidden">
						<FlexLayout.Layout
							model={room.sidebar.model}
							factory={(node) => {
								const component = node.getComponent();

								if (component === "room-tool") {
									return <RoomTool node={node} />;
								} else if (component === "room-configuration") {
									return <RoomConfiguration room={room} />;
								}

								return null;
							}}
							icons={{
								close: <XIcon />,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});
