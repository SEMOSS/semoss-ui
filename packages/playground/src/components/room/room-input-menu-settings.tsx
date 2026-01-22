import { Settings2Icon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DropdownMenuItem,
	ScrollArea,
	ScrollBar,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { RoomOptionsForm } from "./room-options-form";

interface RoomInputMenuSettingsProps {
	/** Model of the room */
	model: RoomStore["model"];

	/** Options */
	options: RoomStore["options"];

	/** Update options on change */
	onClose: (
		success: boolean,
		data?: { model?: RoomStore["model"]; options?: RoomStore["options"] },
	) => void;
}

export const RoomInputMenuSettings: React.FC<RoomInputMenuSettingsProps> = ({
	model,
	options,
	onClose = () => null,
}) => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	return (
		<>
			<DropdownMenuItem
				onSelect={(e) => {
					e.preventDefault();

					setIsDrawerOpen(true);
				}}
			>
				<Settings2Icon />
				<span className="flex-1">Edit Settings</span>
			</DropdownMenuItem>

			<Drawer
				open={isDrawerOpen}
				onOpenChange={(s) => {
					setIsDrawerOpen(s);
				}}
			>
				<DrawerContent className="h-full max-h-[90vh]">
					<ScrollArea className="h-full w-full whitespace-nowrap">
						<ScrollBar orientation="horizontal"></ScrollBar>
						<div className="mx-auto max-w-4xl px-4 pb-12">
							<RoomOptionsForm
								model={model}
								options={options}
								onClose={(success, { model, options }) => {
									onClose(success, { model, options });
									setIsDrawerOpen(false);
								}}
							/>
						</div>
					</ScrollArea>
					<DrawerClose />
				</DrawerContent>
			</Drawer>
		</>
	);
};
