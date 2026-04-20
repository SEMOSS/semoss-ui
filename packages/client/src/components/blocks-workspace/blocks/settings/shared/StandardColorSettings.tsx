import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActionMessages,
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import { Muted } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface StandardColorSettingProps<D extends BlockDef = BlockDef> {
	id: string;
	label: string;
	path: Paths<Block<D>["data"], 4>;
	onChange?: (color: string) => void;
}

export const StandardColorSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label,
		path,
		onChange,
	}: StandardColorSettingProps<D>) => {
		const [color, setColor] = useState("#FFFFFF");
		const { state } = useBlocks();
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		const { data, setData } = useBlockSettings<any>(id);

		const computedColor = useMemo(() => {
			return computed(() => {
				if (!data) return "#FFFFFF";
				const v = getValueByPath(data, path);
				if (typeof v === "string") return v;
				return "#FFFFFF";
			});
		}, [data, path]).get();

		useEffect(() => {
			setColor(computedColor);
		}, [computedColor]);

		const handleColorChange = useCallback(
			// biome-ignore lint/suspicious/noExplicitAny: TODO
			(newColor: any) => {
				const hexColor = newColor.hex ?? newColor;
				setColor(hexColor);
				setData(path, hexColor as PathValue<D["data"], typeof path>);
				onChange?.(hexColor);
				state.dispatch({
					message: ActionMessages.DISPATCH_EVENT,
					payload: { name: "blockResized" },
				});
			},
			[setData, path, state.dispatch, onChange],
		);

		return (
			<div className="flex flex-col gap-1">
				<Muted>{label}</Muted>
				<div className="flex items-center gap-2">
					<div className="relative h-7 w-7 shrink-0">
						<input
							type="color"
							value={color}
							onChange={(e) => handleColorChange(e.target.value)}
							className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
							autoComplete="off"
							data-testid={`colorSettings-${label}-txt`}
						/>
						<div
							className="h-full w-full rounded border border-input shadow-xs"
							style={{ backgroundColor: color }}
						/>
					</div>
					<Muted className="font-mono text-xs">{color}</Muted>
				</div>
			</div>
		);
	},
);
