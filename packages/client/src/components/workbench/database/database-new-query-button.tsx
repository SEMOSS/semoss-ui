import { DatabaseIcon } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useDatabaseWorkbench } from "@/hooks";

/** Opens a blank query editor in the database workbench. */
export const DatabaseNewQueryButton: React.FC = () => {
	const addQueryPanel = useDatabaseWorkbench((state) => state.addQueryPanel);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="New query"
					data-testid="workbench-new-query-button"
					onClick={() => addQueryPanel("")}
					className="border border-transparent text-muted-foreground"
				>
					<DatabaseIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">New query</TooltipContent>
		</Tooltip>
	);
};
