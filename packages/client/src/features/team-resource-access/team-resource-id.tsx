import { Copy } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import type { TeamResource } from "@/api/teams";

export interface TeamResourceIdProps {
	/** The project or engine whose id to show. */
	resource: TeamResource;
}

/** A project's or engine's id, with a button that copies it, as the catalog cards have. */
export const TeamResourceId = ({ resource }: TeamResourceIdProps) => (
	<div className="flex min-w-0 items-center gap-1">
		<p className="truncate text-muted-foreground text-xs">
			id: {resource.id}
		</p>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="size-5 shrink-0 text-muted-foreground"
					aria-label={`Copy the id of ${resource.name}`}
					onClick={() =>
						void copyTextToClipboard(resource.id, {
							onSuccess: () =>
								toast.success("Copied to clipboard"),
							onError: () => toast.error("Failed to copy"),
						})
					}
				>
					<Copy className="size-3" aria-hidden="true" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Copy ID</TooltipContent>
		</Tooltip>
	</div>
);
