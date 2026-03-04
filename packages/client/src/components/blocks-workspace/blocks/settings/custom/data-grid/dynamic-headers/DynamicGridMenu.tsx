import {
	type BlockComponent,
	type GridDynamicFrameBlockDef,
	useBlocksPixel,
} from "@semoss/renderer";
import { Autocomplete, Stack, TextField } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

export const DynamicGridMenu: BlockComponent = ({ id }) => {
	const { data, setData } = useBlockSettings<GridDynamicFrameBlockDef>(id);
	// get all of the frames
	const getFrames = useBlocksPixel<string[]>("GetFrames();", {
		data: [],
	});

	// options for the autocomplete
	const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

	return (
		<Stack>
			<Autocomplete
				fullWidth
				multiple={false}
				disabled={getFrames.status !== "SUCCESS"}
				value={data.frame.name}
				options={options}
				getOptionLabel={(option) => {
					return option;
				}}
				onChange={(_, value) => {
					// update the frame
					setData("frame.name", value);
				}}
				freeSolo={false}
				renderInput={(params) => (
					<TextField
						{...params}
						placeholder="Select frame"
						size="small"
						variant="outlined"
					/>
				)}
			/>
		</Stack>
	);
};
