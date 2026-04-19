import { PaintBucket } from "lucide-react";
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
import { Button, Input, Muted } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface StandardColorSettingProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * required fields
	 */
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
		const [showPicker, setShowPicker] = useState(false);
		const { state } = useBlocks();
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		const { data, setData } = useBlockSettings<any>(id);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedColor = useMemo(() => {
			return computed(() => {
				if (!data) return "#FFFFFF"; // fallback
				const v = getValueByPath(data, path);
				if (typeof v === "string") return v;
				return "#FFFFFF"; // fallback if not a string
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
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
				<div className="flex items-center justify-between gap-1">
					<div className="flex items-center gap-3">
						<div
							className="h-[33px] w-[33px] rounded border border-[#ccc]"
							style={{ backgroundColor: color }}
						/>
						<Muted>{color}</Muted>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setShowPicker(!showPicker)}
					>
						<PaintBucket />
					</Button>
				</div>

				{showPicker && (
					// biome-ignore lint/a11y/noStaticElementInteractions: color swatch
					<div
						className="mt-1 flex justify-end"
						onMouseLeave={() => setShowPicker(false)}
					>
						<div className="rounded">
							<Input
								className="h-8 w-full p-0.5"
								type="color"
								value={color}
								onChange={(e) =>
									handleColorChange(e.target.value)
								}
								autoComplete="off"
								data-testid={`colorSettings-${label}-txt`}
							/>
						</div>
					</div>
				)}
			</div>
		);
	},
);
