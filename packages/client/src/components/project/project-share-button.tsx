import { Share2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ShareAppDialog } from "@/components/ui/share/share-app-dialog";
import { useProject } from "@/hooks";

export const ProjectShareButton = observer(() => {
	const { project } = useProject();
	const [shareOpen, setShareOpen] = useState(false);

	return (
		<div className="flex items-center gap-1">
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						aria-label={"Share App"}
						variant="ghost"
						size="icon"
						onClick={() => setShareOpen(true)}
					>
						<Share2 className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Share App</TooltipContent>
			</Tooltip>

			<ShareAppDialog
				appId={project.project_id}
				open={shareOpen}
				onOpenChange={setShareOpen}
			/>
		</div>
	);
});
