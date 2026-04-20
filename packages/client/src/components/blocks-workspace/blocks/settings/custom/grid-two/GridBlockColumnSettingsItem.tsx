import { Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { GridBlockColumn, GridBlockDef } from "@semoss/renderer";
import { Button } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface GridBlockColumnSettingsItemProps {
	/** Id of the block */
	id: string;

	/** Index of the column */
	column: GridBlockColumn;

	/** Index of the column */
	index: number;
}

export const GridBlockColumnSettingsItem = observer(
	({ id, column, index }: GridBlockColumnSettingsItemProps) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);

		return (
			<div className="flex items-center justify-between border-b px-3 py-2">
				<div className="flex min-w-0 flex-1 flex-col">
					<span
						className="truncate font-medium text-sm"
						title={column.name}
					>
						{column.name}
					</span>
					<span
						className="truncate text-muted-foreground text-xs"
						title={column.selector}
					>
						{column.selector}
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					disabled={false}
					onClick={() => {
						// get the columns except the current one
						const columns = data.columns.filter(
							(_v, idx) => index !== idx,
						);

						// update the data
						setData("columns", columns);
					}}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		);
	},
);
