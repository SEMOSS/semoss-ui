import { Share2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ShareOverlay } from "@/components/ui";
import { useProject } from "@/hooks";

export const CodeWorkspaceActions = observer(() => {
	const { project } = useProject();
	const [shareOpen, setShareOpen] = useState(false);

	return (
		<div className="flex items-center gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setShareOpen(true)}
					>
						<Share2 className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Share App</TooltipContent>
			</Tooltip>

			<Dialog
				open={shareOpen}
				onOpenChange={(o) => !o && setShareOpen(false)}
			>
				<DialogContent className="max-w-lg p-0">
					<ShareOverlay
						appId={project.project_id}
						onClose={() => setShareOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
});
