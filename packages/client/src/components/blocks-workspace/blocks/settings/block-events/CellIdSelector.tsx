import { type Control, Controller } from "react-hook-form";
import {
	type CellState,
	type ListenerActions,
	useBlocks,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface CellIdSelectorProps {
	control: Control<ListenerActions>;
	cells: CellState[];
	queryId: string;
}

export const CellIdSelector = ({
	control,
	cells,
	queryId,
}: CellIdSelectorProps) => {
	const { state } = useBlocks();

	return (
		<Controller
			name="payload.cellId"
			control={control}
			render={({ field }) => (
				<Select
					value={field.value || ""}
					onValueChange={field.onChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Cell" />
					</SelectTrigger>
					<SelectContent>
						{cells.map((cell) => {
							const variableName = state.getAlias(
								queryId,
								cell.id,
							);
							return (
								<SelectItem key={cell.id} value={cell.id}>
									{variableName}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			)}
		/>
	);
};
