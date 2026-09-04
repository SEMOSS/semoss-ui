import { Columns2Icon, Rows2Icon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../workbench/core/workbench.chrome";

/** Value shape stored in diff panel state for the chrome control. */
export interface GitDiffControlValue {
	renderSideBySide: boolean;
	setRenderSideBySide: (value: boolean) => void;
}

/** Render layout mode toggle (side-by-side vs inline) in workbench chrome. */
export const GitDiffControl: FC<
	WorkbenchChromeProps<unknown, GitDiffControlValue>
> = ({ value }) => {
	if (!value) return null;

	const isSideBySide = value.renderSideBySide;
	const label = isSideBySide
		? "Switch to inline view"
		: "Switch to side-by-side view";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
					aria-label={label}
					onClick={() => value.setRenderSideBySide(!isSideBySide)}
				>
					{isSideBySide ? (
						<Columns2Icon
							className={WORKBENCH_STYLES.chromeIcon}
							aria-hidden="true"
						/>
					) : (
						<Rows2Icon
							className={WORKBENCH_STYLES.chromeIcon}
							aria-hidden="true"
						/>
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
};
