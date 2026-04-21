import {
	DeleteOutline,
	InfoOutlined,
	ReportRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { ActionMessages, INPUT_BLOCK_TYPES, useBlocks } from "@semoss/renderer";
import {
	Box,
	ButtonGroup,
	Card,
	IconButton,
	Stack,
	styled,
	Tooltip,
} from "@semoss/ui";
import { toast } from "@semoss/ui/next";
import { useDesigner, useRootStore } from "@/hooks";
import type {
	BlockLocalStorageData,
	DesignerMenuItem,
} from "../blocks-workspace/menus/menu-types";
import { BlockCardContent } from "./BlockMenuCardContent";

const addBlocksCardWidth = "120px";
const addBlocksCardHeight = "94px";

const StyledCard = styled(Card)({
	cursor: "grab",
	border: `1px solid rgba(0, 0, 0, 0.12)`,
	borderRadius: "6px",
	justifyContent: "center",
});

const StyledDiv = styled("div")({
	position: "relative",
	display: "inline-block",
	paddingTop: "6px",
	paddingRight: "6px",
});

const StyledContainer = styled(Box)({
	position: "absolute",
	top: 10,
	right: -24,
	zIndex: 1000,
	display: "flex",
	flexDirection: "column",
	gap: 1,
	backgroundColor: "#fff",
	borderRadius: "8px",
	p: 0.5,
});

const StyleButtonGroup = styled(ButtonGroup)(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
	flexDirection: "column",
	backgroundColor: "white",
	padding: theme.spacing(1),
	borderRadius: "6px",
	boxShadow:
		"0px 5px 22px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
	width: "35px",
	"& .MuiButtonBase-root.MuiButton-root": {
		justifyContent: "unset",
	},
}));

const StyledButtonGroupIconButton = styled(IconButton)(({ theme }) => ({
	backgroundColor: "white",
	borderRadius: theme.shape.borderRadius,
}));

export interface AddBlocksMenuItemProps {
	/** Item that can be dragged onto the block */
	item: DesignerMenuItem;

	/** Determined for snapshot code */
	isCommunity: boolean;

	/** Handle the trash click */
	handleOnTrashClick: (blockId: string, blockName: string) => void;

	/** Handle the edit click */
	handleOnEditClick: (blockId: string, item: DesignerMenuItem) => void;
}

/**
 * Individaul block that can be dragged onto the UI
 */
export const AddBlocksMenuCard = observer((props: AddBlocksMenuItemProps) => {
	const { item, isCommunity, handleOnTrashClick } = props;
	const { state } = useBlocks();
	const { designer } = useDesigner();
	const { configStore } = useRootStore();

	const [imageSrc, _setImageSrc] = useState(null);

	// track if it is this one that is dragging
	const [local, setLocal] = useState(false);

	// track if this is being hovered
	const [hovered, setHovered] = useState<boolean>(false);

	/**
	 * Handle the mousedown on the widget.
	 */
	const handleMouseDown = () => {
		// set the dragged
		designer.activateDrag(
			item.json.widget,
			() => {
				return true;
			},
			item.name,
			item.hoverImage,
		);

		// clear the hovered
		designer.setHovered("");

		// clear the selected
		designer.setSelected("");

		// set as inactive
		setLocal(true);
	};

	/**
	 * Handle the mouseup event on the document
	 */
	const handleDocumentMouseUp = useCallback(async () => {
		if (!designer.drag.active) {
			return;
		}

		// ID of newly added block
		let id = "";

		// put a placeholder action to check if it is valid
		const placeholderAction = designer.drag.placeholderAction;
		if (!placeholderAction || !placeholderAction.id) {
			designer.deactivateDrag();
			designer.setHovered("");
			designer.setSelected("");
			setLocal(false);
			return;
		}

		// Track block in session storage
		localStorage.setItem(
			"blocks--frequently-used",
			(() => {
				const map: Record<string, BlockLocalStorageData> =
					JSON.parse(
						localStorage.getItem("blocks--frequently-used"),
					) ?? {};
				map[item.json.widget] = {
					widget: item.json.widget,
					name: item.name,
					use_count: (map[item.json.widget]?.use_count ?? 0) + 1,
					last_used: Date.now(),
				};
				return JSON.stringify(map);
			})(),
		);

		// apply the action
		const sw = state.getBlock(placeholderAction.id);

		// Safely get the block associated with the placeholder action
		if (!sw) {
			designer.deactivateDrag();
			designer.setHovered("");
			designer.setSelected("");
			setLocal(false);
			return;
		}

		// TODO: Add logic to prevent adding block it iter block if one is already present

		if (sw.widget === "iteration") {
			if (sw.slots.children.children.length) {
				toast.error(
					"Please delete block within iterator before adding another child",
				);
				return;
			}
		}

		if (placeholderAction) {
			if (
				placeholderAction.type === "before" ||
				placeholderAction.type === "after"
			) {
				const siblingWidget = state.getBlock(placeholderAction.id);

				if (siblingWidget?.parent) {
					if (!sw.parent || !sw.parent.id) {
						designer.deactivateDrag();
						setLocal(false);
						return;
					}
					const parent = state.getBlock(sw.parent.id);
					if (!parent) {
						designer.deactivateDrag();
						setLocal(false);
						return;
					}
					if (parent.widget === "iteration") {
						if (parent.slots.children.children.length) {
							toast.error(
								"Please delete block within iterator before adding another child",
							);
							designer.deactivateDrag();
							return;
						}
					}
					id = await state.dispatch({
						message: ActionMessages.ADD_BLOCK,
						payload: {
							json: item.json,
							position: {
								parent: siblingWidget.parent.id,
								slot: siblingWidget.parent.slot,
								sibling: siblingWidget.id,
								type: placeholderAction.type,
							},
							isCommunity: isCommunity,
							communityBlockDependents: {
								queries: item.queries,
								variables: item.variable,
							},
						},
					}) as string;
				}
			} else if (placeholderAction.type === "replace") {
				id = await state.dispatch({
					message: ActionMessages.ADD_BLOCK,
					payload: {
						json: item.json,
						position: {
							parent: placeholderAction.id,
							slot: placeholderAction.slot,
						},
						isCommunity: isCommunity,
						communityBlockDependents: {
							queries: item.queries,
							variables: item.variable,
						},
					},
				}) as string;

				if (sw.widget === "iteration") {
					await state.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: placeholderAction.id,
							path: "child",
							value: state.getBlock(id),
						},
					});
				}
			}
		}

		// TODO: REFACTOR
		// Add variables for all blocks that are inputs from user
		if (INPUT_BLOCK_TYPES.indexOf(item.json.widget) > -1 && !isCommunity) {
			await state.dispatch({
				message: ActionMessages.ADD_VARIABLE,
				payload: {
					id: id,
					type: "block",
					to: id,
				},
			});
		}

		// clear the drag
		designer.deactivateDrag();

		// clear the hovered
		designer.setHovered("");

		// clear the selected
		designer.setSelected(id ? id : "");

		// clear the selectedBlocks
		designer.addBlockToSelected("clear");

		// set as active
		setLocal(false);
	}, [
		item.name,
		item.json,
		isCommunity,
		designer.drag.active,
		designer.drag.placeholderAction,
		designer,
		state,
	]);

	// add the mouse up listener when dragged
	useEffect(() => {
		if (!designer.drag.active || !local) {
			return;
		}

		document.addEventListener("mouseup", handleDocumentMouseUp);

		return () => {
			document.removeEventListener("mouseup", handleDocumentMouseUp);
		};
	}, [designer.drag.active, local, handleDocumentMouseUp]);

	return (
		<Stack
			spacing={0.25}
			alignItems="center"
			height="100%"
			justifyContent="flex-end"
		>
			<div
				className="flex select-none flex-wrap items-center justify-center gap-1 text-center font-medium text-foreground text-xs"
				style={{ width: addBlocksCardWidth, overflowWrap: "anywhere" }}
			>
				{item.name}
				{item.recentChanges && (
					<Tooltip title={item.recentChanges}>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
							}}
						>
							<InfoOutlined fontSize="small" color="info" />
						</span>
					</Tooltip>
				)}
				{item.isBeta && (
					<Tooltip title={"This block is currently in beta"}>
						<span
							style={{
								display: "inline-flex",
								alignItems: "center",
							}}
						>
							<ReportRounded fontSize="small" color="warning" />
						</span>
					</Tooltip>
				)}
			</div>
			<StyledDiv
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				onMouseDown={handleMouseDown}
			>
				{/* TODO: FIX */}
				{hovered && isCommunity && configStore.store.user.admin && (
					<StyledContainer>
						<StyleButtonGroup>
							{/* <StyledButtonGroupIconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOnEditClick(item['id'], item);
                                }}
                            >
                                <EditOutlined sx={{ color: '#757575' }} />
                            </StyledButtonGroupIconButton> */}
							<StyledButtonGroupIconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									handleOnTrashClick(
										item.id ?? "",
										item.name,
									);
								}}
							>
								<DeleteOutline sx={{ color: "#757575" }} />
							</StyledButtonGroupIconButton>
						</StyleButtonGroup>
					</StyledContainer>
				)}

				{/* Card */}
				<StyledCard>
					<Tooltip
						title={item.helperText ?? item.name}
						arrow
						placement="bottom"
					>
						<div>
							<BlockCardContent
								image={
									isCommunity
										? imageSrc
										: hovered
											? item.hoverImage
											: item.activeImage
								}
								name={item.name}
								width={addBlocksCardWidth}
								height={addBlocksCardHeight}
								paddingX={0.75}
								paddingY={1}
							/>
						</div>
					</Tooltip>
				</StyledCard>
			</StyledDiv>
		</Stack>
	);
});
