import {
	CloudDownloadRounded,
	DeleteForeverRounded,
} from "@mui/icons-material";
import { useMemo } from "react";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
import { Typography } from "../Typography";

interface FileDisplayProps {
	/** Displayed File */
	file: File;

	/** Name of the file */
	name?: string;

	/** Disable deleting of the file */
	disabled?: boolean;

	/** Callback triggered on deleting of the file */
	onDelete: () => void;
}

export const FileDisplay = (props: FileDisplayProps): JSX.Element => {
	const { disabled, file, onDelete } = props;

	const href = useMemo(() => {
		return URL.createObjectURL(file);
	}, [file]);

	return (
		<Stack direction="row" alignItems={"center"} spacing={1}>
			<IconButton
				href={href}
				color="secondary"
				download={file.name}
				title={`Download ${file.name}`}
				aria-label={`Download ${file.name}`}
			>
				<CloudDownloadRounded fontSize="small" />
			</IconButton>
			<Typography
				title={file.name}
				aria-label={file.name}
				variant="caption"
				noWrap={true}
				sx={{
					width: "100%",
				}}
			>
				{file.name}
			</Typography>
			<IconButton
				size="small"
				disabled={disabled}
				onClick={() => onDelete()}
				title={`Remove ${file.name} from list`}
				aria-label={`Remove ${file.name} from list`}
			>
				<DeleteForeverRounded fontSize="small" />
			</IconButton>
		</Stack>
	);
};
