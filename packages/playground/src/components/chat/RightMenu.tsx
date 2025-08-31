import { Close } from "@mui/icons-material";
import { IconButton, Stack, styled, Typography } from "@semoss/ui";

const StyledRightMenu = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	position: "relative",
	height: "100%",
	width: "100%",
	padding: "8px 0",
	borderRadius: theme.shape.borderRadiusLg,
	border: `1px solid ${theme.palette.secondary.border}`,
	background: theme.palette.background.paper,
	overflow: "hidden",
	gap: "8px",
}));

export const StyledRightMenuHeader = styled(Stack)(({ theme }) => ({
	position: "sticky",
	top: 0,
	height: "24px",
	width: "100%",
	padding: "0 16px",
	zIndex: 1,
}));

export const StyledRightMenuContent = styled(Stack)(({ theme }) => ({
	flex: 1,
	position: "relative",
	width: "100%",
	overflowX: "hidden",
	overflowY: "auto",
}));

interface RightMenuProps {
	/** Header in the menu */
	header: React.ReactNode;

	/** Content */
	children: React.ReactNode;

	/** Close the Menu */
	onClose?: () => void;
}

export const RightMenu = (props: RightMenuProps) => {
	const { children, header, onClose } = props;
	return (
		<StyledRightMenu>
			<StyledRightMenuHeader
				direction={"row"}
				alignItems={"center"}
				justifyContent={"space-between"}
				spacing={1}
			>
				{header ? (
					<Typography
						variant={"caption"}
						noWrap={true}
						sx={{
							flex: 1,
						}}
					>
						{header}
					</Typography>
				) : null}
				<IconButton
					size="small"
					onClick={() => {
						onClose();
					}}
				>
					<Close fontSize="small" />
				</IconButton>
			</StyledRightMenuHeader>
			<StyledRightMenuContent direction="column" spacing={1}>
				{children}
			</StyledRightMenuContent>
		</StyledRightMenu>
	);
};
