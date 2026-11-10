import { Copy } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";

interface ResourceIdProps {
	/** The project's or engine's id. */
	id: string;
	/** Its name, which says which id the button copies. */
	name: string;
}

/** A project's or engine's id, with a button that copies it, as the catalog cards have. */
export const ResourceId = ({ id, name }: ResourceIdProps) => (
	<div className="flex min-w-0 items-center gap-1">
		<p className="truncate text-muted-foreground text-xs">id: {id}</p>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="size-5 shrink-0 text-muted-foreground"
					aria-label={`Copy the id of ${name}`}
					onClick={() =>
						void copyTextToClipboard(id, {
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
