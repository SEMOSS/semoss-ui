import {
	type BlockComponent,
	type GridDynamicFrameBlockDef,
	useBlocksPixel,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

export const DynamicGridMenu: BlockComponent = ({ id }) => {
	const { data, setData } = useBlockSettings<GridDynamicFrameBlockDef>(id);
	// get all of the frames
	const getFrames = useBlocksPixel<string[]>("GetFrames();", {
		data: [],
	});

	// options for the select
	const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

	return (
		<div>
			<Select
				disabled={getFrames.status !== "SUCCESS"}
				value={data.frame.name}
				onValueChange={(value) => {
					// update the frame
					setData("frame.name", value);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select frame" />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
