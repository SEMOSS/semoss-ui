import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, IconButton, List, styled, Typography } from "@semoss/ui";

const StyledListItem = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
}));

const StyledInfo = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.disabled,
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
	marginTop: 0,
}));

const StyledInfoIcon = styled(InfoOutlinedIcon)({
	fontSize: 2,
});

const SelectedItem = ({ file, setData }) => {
	return file ? (
		<Box>
			<StyledListItem>
				<List.ItemText>{file.fileName}</List.ItemText>
				<IconButton
					data-testid="remove-image"
					edge="end"
					aria-label="delete"
					onClick={() => {
						setData("src", "");
					}}
				>
					<DeleteIcon color="error" />
				</IconButton>
			</StyledListItem>
			<StyledInfo variant="caption">
				<StyledInfoIcon />
				Delete current file to upload a new one.
			</StyledInfo>
		</Box>
	) : null;
};

export default SelectedItem;
