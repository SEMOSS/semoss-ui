import { Close } from "@mui/icons-material";
import { IconButton, Stack, styled, Typography } from "@semoss/ui";

const StyledRightMenu = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	position: "relative",
	height: "100%",
	width: "100%",
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
}));

export const StyledRightMenuHeader = styled(Stack)(({ theme }) => ({
	position: "sticky",
	top: 0,
	height: theme.spacing(9),
	width: "100%",
	padding: theme.spacing(2),
	background: theme.palette.background.default,
	zIndex: 1,
}));

export const StyledRightMenuContent = styled("div")(({ theme }) => ({
	position: "relative",
	flex: 1,
	width: "100%",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	paddingBottom: theme.spacing(2),
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	background: theme.palette.background.default,
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
						variant={"body1"}
						fontWeight={"bold"}
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
					<Close fontSize="medium" />
				</IconButton>
			</StyledRightMenuHeader>
			<StyledRightMenuContent>{children}</StyledRightMenuContent>
		</StyledRightMenu>
	);
};
