import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { ActionMessages, INPUT_BLOCK_TYPES, useBlocks } from "@semoss/renderer";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useDesigner, useRootStore } from "@/hooks";
import type {
	BlockLocalStorageData,
	DesignerMenuItem,
} from "../blocks-workspace/menus/menu-types";
import { BlockCardContent } from "./BlockMenuCardContent";

const addBlocksCardWidth = "120px";
const addBlocksCardHeight = "94px";

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

export const AddBlocksMenuCard = observer((props: AddBlocksMenuItemProps) => {
	const { item, isCommunity, handleOnTrashClick } = props;
	const { state } = useBlocks();
	const { designer } = useDesigner();
	const { configStore } = useRootStore();

	const [_imageSrc, _setImageSrc] = useState(null);

	const [local, setLocal] = useState(false);
	const [hovered, setHovered] = useState<boolean>(false);

	const handleMouseDown = () => {
		designer.activateDrag(
			item.json.widget,
			() => {
				return true;
			},
			item.name,
			item.hoverImage,
		);

		designer.setHovered("");
		designer.setSelected("");
		setLocal(true);
	};

	const handleDocumentMouseUp = useCallback(async () => {
		if (!designer.drag.active) {
			return;
		}

		let id = "";

		const placeholderAction = designer.drag.placeholderAction;
		if (!placeholderAction || !placeholderAction.id) {
			designer.deactivateDrag();
			designer.setHovered("");
			designer.setSelected("");
			setLocal(false);
			return;
		}

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

		const sw = state.getBlock(placeholderAction.id);

		if (!sw) {
			designer.deactivateDrag();
			designer.setHovered("");
			designer.setSelected("");
			setLocal(false);
			return;
		}

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
					id = (await state.dispatch({
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
						},
					})) as string;
				}
			} else if (placeholderAction.type === "replace") {
				id = (await state.dispatch({
					message: ActionMessages.ADD_BLOCK,
					payload: {
						json: item.json,
						position: {
							parent: placeholderAction.id,
							slot: placeholderAction.slot,
						},
						isCommunity: isCommunity,
					},
				})) as string;

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

		designer.deactivateDrag();
		designer.setHovered("");
		designer.setSelected(id ? id : "");
		designer.addBlockToSelected("clear");
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
		<div className="flex h-full flex-col items-center justify-end gap-1">
			<div
				className="flex select-none flex-wrap items-center justify-center gap-1 text-center font-medium text-foreground text-xs"
				style={{ width: addBlocksCardWidth, overflowWrap: "anywhere" }}
			>
				{item.name}
				{item.recentChanges && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex items-center">
									<Info className="size-4 text-blue-500" />
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{item.recentChanges}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
				{item.isBeta && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex items-center">
									<AlertTriangle className="size-4 text-amber-500" />
								</span>
							</TooltipTrigger>
							<TooltipContent>
								This block is currently in beta
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: drag container — keyboard drag not applicable */}
			<div
				className="relative inline-block pt-1.5 pr-1.5"
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				onMouseDown={handleMouseDown}
			>
				{hovered && isCommunity && configStore.store.user.admin && (
					<div
						className="-right-6 absolute top-2.5 z-[1000] flex flex-col gap-1 rounded-lg border border-border bg-popover p-2"
						style={{
							boxShadow:
								"0px 5px 22px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
						}}
					>
						<button
							type="button"
							className="flex size-8 items-center justify-center rounded hover:bg-accent"
							onClick={(e) => {
								e.stopPropagation();
								handleOnTrashClick(item.id ?? "", item.name);
							}}
						>
							<Trash2 className="size-4 text-muted-foreground" />
						</button>
					</div>
				)}

				<div
					className="cursor-grab rounded-md border transition-colors"
					style={{
						justifyContent: "center",
						borderColor: hovered
							? "var(--primary)"
							: "var(--border)",
					}}
				>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<BlockCardContent
										image={
											isCommunity
												? undefined
												: item.activeImage
										}
										name={item.name}
										width={addBlocksCardWidth}
										height={addBlocksCardHeight}
										paddingX={0.75}
										paddingY={1}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								{item.helperText ?? item.name}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
	);
});
