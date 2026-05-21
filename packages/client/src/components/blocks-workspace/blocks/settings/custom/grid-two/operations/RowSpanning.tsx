import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	GridBlockDef,
	Paths,
	PathValue,
} from "@semoss/renderer";
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const RowSpanning = observer(
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	<D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		const [rowSpanning, setRowSpanning] = useState(false);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (data.option?.rowSpanning !== rowSpanning) {
				setRowSpanning(data.option.rowSpanning);
			}
		}, [data.option]);

		const handleInputChange = (checked: boolean) => {
			const newOption = {
				...data.option,
				rowSpanning: checked,
			};
			setRowSpanning(checked);

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		return (
			<div className="flex flex-col gap-2">
				<div
					className="flex flex-row items-center gap-2 py-2"
					style={{ marginTop: "8px" }}
				>
					<Switch
						checked={rowSpanning}
						onCheckedChange={handleInputChange}
						title="Show Row Spanning"
					/>
					<p className="text-muted-foreground text-sm">
						Show Row Spanning
					</p>
				</div>
			</div>
		);
	},
);
