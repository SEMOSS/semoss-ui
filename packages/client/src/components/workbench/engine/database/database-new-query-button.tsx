import { DatabaseIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useDatabaseWorkbench } from "@/hooks";
import { CHROME_BUTTON, CHROME_ICON } from "../../core/workbench.chrome";

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
					className={cn(
						"border border-transparent text-muted-foreground",
						CHROME_BUTTON,
					)}
				>
					<DatabaseIcon className={CHROME_ICON} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">New query</TooltipContent>
		</Tooltip>
	);
};
