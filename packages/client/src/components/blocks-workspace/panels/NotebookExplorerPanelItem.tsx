import {
	AssessmentOutlined,
	DeleteOutline,
	MoreVert,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useRef, useState } from "react";
import {
	alpha,
	Icon,
	IconButton,
	Menu,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { NotebookIcon } from "@/assets/img/NotebookIcon";
import DuplicateIcon from "../../../assets/img/Duplicate.svg";

const StyledItem = styled("li", {
	shouldForwardProp: (prop) => prop !== "isDragging" && prop !== "isSelected",
})<{
	isDragging: boolean;
	isSelected: boolean;
}>(({ theme, isDragging, isSelected }) => ({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	height: theme.spacing(4),
	width: "100%",
	paddingLeft: "16px",
	paddingRight: "16px",
	marginLeft: "16px",
	gap: theme.spacing(0.5),
	opacity: isDragging ? theme.palette.action.hoverOpacity : 1,
	backgroundColor: isSelected
		? alpha(
				theme.palette.primary.main,
				theme.palette.action.selectedOpacity,
			)
		: theme.palette.background.paper,
	cursor: "pointer",
}));

const StyledTypography = styled(Typography)(() => ({
	textAlign: "left",
	overflow: "hidden",
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",
	flex: "1",
	marginLeft: "4px",
}));

const StyledAnchorSpan = styled("span")(({ theme }) => ({
	position: "absolute",
	left: 100,
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
	color: "rgb(0,0,0)",
}));

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
	color: "rgb(0,0,0)",
}));

const StyledMenu = styled(Menu)({
	"& .MuiPaper-root": {
		borderRadius: 0,
	},
});

const StyledDuplicateIcon = styled("img")({
	display: "inline-block",
	verticalAlign: "middle",
	objectFit: "contain",
});

interface NotebookExplorerItemProps {
	/**  Details */
	id: string;

	/*** Track if the item is selected*/
	isSelected: boolean;

	/** Triggered when the item is clicked*/
	onClick: (event: React.MouseEvent<HTMLLIElement>) => void;

	/** Triggered when the item starts dragging */
	onDragStart?: (event: React.DragEvent<HTMLLIElement>) => void;

	/** Triggered when the item ends dragging */
	onDragEnd?: (event: React.DragEvent<HTMLLIElement>) => void;

	/** Triggered when the item's trash icon */
	onTrashClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

	/** Triggered when the item's copy icon */
	onCopyClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const NotebookExplorerItem: React.FC<NotebookExplorerItemProps> =
	observer((props) => {
		const {
			id,
			isSelected = false,
			onClick = () => null,
			onDragStart = () => null,
			onDragEnd = () => null,
			onTrashClick = () => null,
			onCopyClick = () => null,
		} = props;

		const [popoverAnchorEle, setPopoverAnchorEl] =
			useState<HTMLElement | null>(null);
		const [anchorEl, setAnchorEl] = useState(null);
		const [isHovered, setIsHovered] = useState(false);
		const [isDragging, setIsDragging] = useState(false);

		const spanRef = useRef();
		const name = id;

		return (
			<StyledItem
				sx={{ marginLeft: "16px" }}
				draggable={true}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				isDragging={isDragging}
				isSelected={isSelected}
				onDragStart={(e) => {
					setIsDragging(true);

					// trigger the callback
					onDragStart(e);
				}}
				onDragEnd={(e) => {
					setIsDragging(false);

					// trigger the callback
					onDragEnd(e);
				}}
				onClick={(e) => {
					// trigger the callback
					onClick(e);
				}}
			>
				<Icon color={"disabled"} fontSize="small">
					<NotebookIcon />
				</Icon>
				<StyledTypography variant="body2">{name}</StyledTypography>
				{isHovered ? (
					<Stack direction="row" alignItems={"center"} spacing={0}>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							paddingY="8px"
						>
							<IconButton
								title="Open Menu"
								onClick={(e) => {
									e.preventDefault();
									setAnchorEl(e.currentTarget);
								}}
							>
								<MoreVert />
							</IconButton>
							<StyledAnchorSpan ref={spanRef} />
							<StyledMenu
								anchorEl={anchorEl}
								open={Boolean(anchorEl)}
								onClose={() => {
									setAnchorEl(null);
								}}
							>
								{/* TODO : Implement rename functionality */}
								{/* <Menu.Item
                                    value="Rename"
                                    onClick={(e) => {
                                        setPopoverAnchorEl(spanRef.current);
                                        setAnchorEl(null);
                                    }}
                                >
                                    <Stack direction="row" alignItems="center">
                                        <StyledIcon color="secondary">
                                            <SvgIcon>
                                                <path
                                                    d="M0.5 15.4979H3.625L12.8417 6.28125L9.71667 3.15625L0.5 12.3729V15.4979ZM2.16667 13.0646L9.71667 5.51458L10.4833 6.28125L2.93333 13.8313H2.16667V13.0646Z"
                                                    fill="#757575"
                                                />
                                                <path
                                                    d="M13.3094 0.739844C12.9844 0.414844 12.4594 0.414844 12.1344 0.739844L10.6094 2.26484L13.7344 5.38984L15.2594 3.86484C15.5844 3.53984 15.5844 3.01484 15.2594 2.68984L13.3094 0.739844Z"
                                                    fill="#757575"
                                                />
                                            </SvgIcon>
                                        </StyledIcon>
                                        <Typography variant="body2">
                                            Rename
                                        </Typography>
                                    </Stack>
                                </Menu.Item> */}
								<Menu.Item
									value="Duplicate"
									onClick={(e) => {
										setPopoverAnchorEl(spanRef.current);
										setAnchorEl(null);
										onCopyClick(
											e as React.MouseEvent<
												HTMLButtonElement,
												MouseEvent
											>,
										);
									}}
								>
									<Stack direction="row" alignItems="center">
										<StyledDuplicateIcon
											src={DuplicateIcon}
											alt="Duplicate Icon"
										/>
										<Typography variant="body2">
											Duplicate
										</Typography>
									</Stack>
								</Menu.Item>
								<Menu.Item
									value="Delete"
									onClick={(e) => {
										setAnchorEl(null);
										onTrashClick(
											e as React.MouseEvent<
												HTMLButtonElement,
												MouseEvent
											>,
										);
									}}
								>
									<Stack direction="row" alignItems="center">
										<DeleteOutline
											sx={{ color: "#757575" }}
										/>
										<StyledErrorTypography variant="body2">
											Delete
										</StyledErrorTypography>
									</Stack>
								</Menu.Item>
							</StyledMenu>
						</Stack>
					</Stack>
				) : null}
			</StyledItem>
		);
	});
