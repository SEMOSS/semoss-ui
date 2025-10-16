import { PanelLeftIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button, useSidebar } from "@semoss/ui/next";

export const AppHeader = observer(() => {
	const { open, setOpen } = useSidebar();

	if (open) {
		return null;
	}

	return (
		<div className="absolute top-0 left-0 z-10 pt-2 pl-2">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => {
					setOpen(true);
				}}
			>
				<PanelLeftIcon />
				<span className="sr-only">Open Sidebar</span>
			</Button>
		</div>
	);
});
