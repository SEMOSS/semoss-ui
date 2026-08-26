import { DatabaseIcon } from "lucide-react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useDatabaseWorkbench } from "@/hooks";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";

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
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<DatabaseIcon className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">New query</TooltipContent>
		</Tooltip>
	);
};
