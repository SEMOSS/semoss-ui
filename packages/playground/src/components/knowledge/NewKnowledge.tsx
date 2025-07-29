import { FileDropzone, Stack, TextField, Typography } from "@semoss/ui";

export interface NewKnowledgeData {
	name: string;
	description: string;
	files: File[];
}

interface NewKnowledgeProps {
	/** Track if it is disabled */
	isDisabled: boolean;

	/** Data in the component */
	data: NewKnowledgeData;

	/** update the data */
	setData: (data: NewKnowledgeData) => void;
}

export const NewKnowledge: React.FC<NewKnowledgeProps> = ({
	isDisabled,
	data,
	setData,
}) => {
	return (
		<>
			<Stack spacing={2}>
				<Typography variant="subtitle1" fontWeight={"medium"}>
					Name
				</Typography>
				<TextField
					size="small"
					variant={"outlined"}
					placeholder="Enter Name"
					disabled={isDisabled}
					value={data.name}
					onChange={(e) => {
						const value = e.target.value;

						setData({
							...data,
							name: value,
						});
					}}
					fullWidth
				></TextField>
			</Stack>
			<Stack spacing={2}>
				<Typography variant="subtitle1" fontWeight={"medium"}>
					Description
				</Typography>
				<TextField
					size="small"
					variant={"outlined"}
					placeholder="Enter Description"
					multiline
					minRows={1}
					maxRows={4}
					disabled={isDisabled}
					value={data.description}
					onChange={(e) => {
						const value = e.target.value;

						setData({
							...data,
							description: value,
						});
					}}
					fullWidth
				></TextField>
			</Stack>
			<Stack spacing={2}>
				<Typography variant="subtitle1" fontWeight={"medium"}>
					Upload Files
				</Typography>
				<FileDropzone
					value={data.files}
					disabled={isDisabled}
					multiple={true}
					onChange={(value) => {
						console.log(value);

						setData({
							...data,
							files: value as File[],
						});
					}}
				/>
			</Stack>
		</>
	);
};
