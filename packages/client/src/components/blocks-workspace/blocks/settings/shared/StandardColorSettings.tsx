import { FormatColorFill } from "@mui/icons-material";
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
import {
	Box,
	ClickAwayListener,
	IconButton,
	TextField,
	Typography,
} from "@semoss/ui";
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

		/**
		 * When the color is changed via the SketchPicker, this is called.
		 * It does the following:
		 * 1. Sets the color in the local component state
		 * 2. Sets the color in the block's data
		 * 3. Calls the onChange callback (if provided) with the new color
		 * 4. Dispatches an event to the block editor to resize the block
		 *    (this is necessary because changing the color of the block can change its size)
		 */
		const handleColorChange = useCallback(
			// biome-ignore lint/suspicious/noExplicitAny: TODO
			(newColor: any) => {
				// Get the hex color from the SketchPicker
				const hexColor = newColor.hex;

				// Set the color in the local component state
				setColor(hexColor);

				// Set the color in the block's data
				setData(path, hexColor as PathValue<D["data"], typeof path>);

				// Call the onChange callback (if provided) with the new color
				onChange?.(hexColor);

				// Dispatch an event to the block editor to resize the block
				state.dispatch({
					message: ActionMessages.DISPATCH_EVENT,
					payload: { name: "blockResized" },
				});
			},
			// The dependencies of this useCallback are:
			//  - setData: the function to set the color in the block's data
			//  - path: the path to the color in the block's data
			[setData, path, state.dispatch, onChange],
		);

		return (
			<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
				<Typography variant="body2" color="black">
					{label}
				</Typography>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						justifyContent: "space-between",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
						<Box
							sx={{
								width: 33,
								height: 33,
								borderRadius: "4px",
								backgroundColor: color,
								border: "1px solid #ccc",
							}}
						/>
						<Typography variant="body2" color="textPrimary">
							{color}
						</Typography>
					</Box>
					<IconButton onClick={() => setShowPicker(!showPicker)}>
						<FormatColorFill />
					</IconButton>
				</Box>

				{showPicker && (
					<ClickAwayListener onClickAway={() => setShowPicker(false)}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "flex-end",
								mt: 1,
							}}
						>
							<Box sx={{ borderRadius: 1 }}>
								<TextField
									fullWidth
									type="color"
									value={color}
									onChange={handleColorChange}
									size="small"
									variant="outlined"
									autoComplete="off"
									data-testid={`colorSettings-${label}-txt`}
								/>
							</Box>
						</Box>
					</ClickAwayListener>
				)}
			</Box>
		);
	},
);
