// biome-ignore-all lint/suspicious/noExplicitAny: TODO
import {
	closestCenter,
	DndContext,
	type DragStartEvent,
	MouseSensor,
	TouchSensor,
	type UniqueIdentifier,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
	BookmarkPlus,
	CircleCheck,
	CircleQuestionMark,
	Copy,
	Home,
	MoreVertical,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import {
	ActionMessages,
	type BlockJSON,
	INPUT_BLOCK_TYPES,
	useBlocks,
} from "@semoss/renderer";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	TreeView,
	TreeViewItem,
	toast,
} from "@semoss/ui/next";
import DuplicateIcon from "@/assets/img/Duplicate.svg";
import { FlexLayout } from "@/components/flex-layout";
import { AddVariableModal } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { useDesigner, useWorkspace } from "@/hooks";
import { getBlockElement } from "@/stores";
import { BlockSettingsRegistry } from "../blocks";
import { PanelSearch } from "./panel-search";

const customCollisionDetection = (args) => {
	const collisions = closestCenter(args);
	// Filter out collisions that are the same as the active item
	return collisions.filter((collision) => collision.id !== args.active.id);
};

export const PAGE_BLOCK: BlockJSON = {
	widget: "page",
	data: {
		style: {
			display: "flex",
			flexDirection: "column",
			padding: "24px",
			gap: "8px",
			fontFamily: "roboto",
		},
		route: "",
	},
	listeners: {
		onPageLoad: {
			type: "sync",
			order: [],
		},
	},
	slots: {
		content: [],
	},
};

type TreeNode = {
	id: string;
	widget: string;
	slots: Record<string, { children: string[] }>;
	children: TreeNode[];
};

const findNode = (
	root,
	id: UniqueIdentifier,
): { node: TreeNode; parent: TreeNode | null; slot: string | null } | null => {
	const stack: {
		node: TreeNode;
		parent: TreeNode | null;
		slot: string | null;
	}[] = [{ node: root, parent: null, slot: null }];

	while (stack.length) {
		// biome-ignore lint/style/noNonNullAssertion: stack.length guard above ensures non-null
		const { node, parent, slot } = stack.pop()!;
		if (node.id === id) return { node, parent, slot };

		for (const currentSlot of Object.keys(node.slots)) {
			for (const childId of node.slots[currentSlot].children) {
				const childNode = {
					id: childId,
					widget: "",
					slots: {},
					children: [],
				};
				stack.push({
					node: childNode,
					parent: node,
					slot: currentSlot,
				});
			}
		}
	}
	return null;
};

export interface AddBlocksLayersProps {
	/** Title to render in the menu */
	title: string;
}

const DroppableContainer = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function DroppableContainer(props, ref) {
	return <div ref={ref} {...props} />;
});

/**
 * Render the Layers
 */
export const LayersPanel = observer(
	(props: AddBlocksLayersProps): JSX.Element => {
		const { title } = props;
		// get the store
		const { state } = useBlocks();
		const { designer } = useDesigner();
		const { workspace } = useWorkspace();
		const [expanded, setExpanded] = useState<string[]>([]);
		const [_selectedLayers, setSelectedLayers] = useState<string[]>([]);
		const [selectedPages, setSelectedPages] = useState<string>("page-1");
		const [selectedLayer, setSelectedLayer] = useState<string[]>([]);
		const [pageHovered, setPageHovered] = useState<string>("");
		const [search, setSearch] = useState<string>("");
		const [variableModal, setVariableModal] = useState("");
		const allPages = state.getAllBlocksOfType("page");
		const [globalDropPositions, setGlobalDropPositions] = useState<
			"top" | "bottom" | "inside" | null
		>(null);
		const accordionRefs = useRef({});

		const [_activeNode, setActiveNode] = useState<TreeNode | null>(null);
		const [editingBlockId, setEditingBlockId] = useState<string | null>(
			null,
		);
		const [editBlockId, setEditBlockId] = useState<string | null>(null);
		const [rename, setRename] = useState(true);
		const editableAreaRef = useRef<HTMLDivElement | null>(null);
		const inputRef = useRef<HTMLInputElement>(null);

		const sensors = useSensors(
			useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
			useSensor(TouchSensor, {
				activationConstraint: { delay: 250, tolerance: 5 },
			}),
		);

		const scrollIntoView = (
			element: Element | null,
			{
				behavior = "smooth" as ScrollBehavior,
				block = "center" as ScrollLogicalPosition,
				inline = "start" as ScrollLogicalPosition,
			} = {},
		) => {
			(element as HTMLElement)?.scrollIntoView({
				behavior,
				block,
				inline,
			});
		};

		// biome-ignore lint/correctness/useExhaustiveDependencies: scrollIntoView, selectLayer, getAllParents are not dependencies
		useEffect(() => {
			const parents = state.getAllParents(designer.selected);
			if (parents.length) {
				const parentPage = parents.find((parent) =>
					parent.includes("page"),
				);
				selectLayer(parentPage);
				setSelectedPages(parentPage);
				setSelectedLayers(parents);
				setExpanded((prev) => [...new Set([...prev, ...parents])]);
			}
			const scrollTimeout = setTimeout(() => {
				// Scroll to the selected block in the accordion
				const refEl = accordionRefs.current[designer.selected];
				if (refEl) {
					scrollIntoView(refEl, {
						block: parents.length > 2 ? "center" : "start",
					});
				}
			}, 100);
			return () => {
				clearTimeout(scrollTimeout);
			};
		}, [designer.selected]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: handlePageSelection is not a dependency
		useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					editableAreaRef.current &&
					!editableAreaRef.current.contains(event.target as Node)
				) {
					const target = event.target as HTMLElement;

					if (target.closest(".MuiOutlinedInput-root")) {
						return;
					}

					setEditingBlockId(null);
				}
			};

			document.addEventListener("mousedown", handleClickOutside);

			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}, []);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const block = state.blocks[selectedPages];
			if (block) {
				handlePageSelection(block);
			}
		}, []);

		// When searching, auto-expand ancestors and scroll to the first matching layer
		// biome-ignore lint/correctness/useExhaustiveDependencies: scrollintoView and getAllParents are not dependencies
		useEffect(() => {
			if (!search) return;

			const lower = search.toLowerCase();

			const collectDescendants = (rootId: string): string[] => {
				const out: string[] = [];
				const visit = (id: string) => {
					const blk = state.blocks[id];
					if (!blk) return;
					out.push(id);
					for (const s in blk.slots) {
						// biome-ignore lint/suspicious/useIterableCallbackReturn: void side-effect, no return needed
						blk.slots[s]?.children?.forEach((cid: string) =>
							visit(cid),
						);
					}
				};
				visit(rootId);
				return out;
			};

			const allIds = collectDescendants(selectedPages);
			const matchId = allIds.find((id) => {
				const blk = state.blocks[id];
				if (!blk) return false;
				const label = `${blk.widget}${blk.id}`.toLowerCase();
				return label.indexOf(lower) > -1;
			});

			if (matchId) {
				// Expand all ancestors so the node will render
				const parents = state.getAllParents(matchId);
				if (parents?.length) {
					setExpanded((prev) => [...new Set([...prev, ...parents])]);
				}
				// After expansion renders, scroll the matched item into view
				setTimeout(() => {
					const el = accordionRefs.current[
						matchId
					] as HTMLElement | null;
					if (el) {
						scrollIntoView(el, { block: "center" });
					}
				}, 120);
			}
		}, [search, selectedPages]);

		const handleRename = (id: string) => {
			state.dispatch({
				message: ActionMessages.SET_BLOCK_DATA,
				payload: {
					id: id,
					path: "id",
					value: editBlockId.trim(),
				},
			});
		};

		const handleDragStart = (event: DragStartEvent) => {
			const { active } = event;
			const block = state.blocks[selectedPages];
			const found = findNode(block, active.id);
			setActiveNode(found?.node || null);
		};

		const handleDragEnd = (event) => {
			// Capture the current drop position immediately
			const currentDropPosition = globalDropPositions;

			const { active, over } = event;

			if (!active || !over) {
				return;
			}

			if (active.id === over.id) {
				console.log("Dropped on itself, ignoring.");
				return;
			}

			const activeBlock = state.getBlock(active.id);
			const overBlock = state.getBlock(over.id);

			if (!activeBlock || !overBlock) {
				return;
			}

			// Check if dropping on non container element
			if (
				currentDropPosition === "inside" &&
				(!overBlock.slots || Object.keys(overBlock.slots).length === 0)
			) {
				return;
			}

			const getSlotForParent = (parentId) => {
				return parentId === selectedPages ? "content" : "children";
			};

			// Check if this is a case of dragging out of a container
			if (
				currentDropPosition === "bottom" &&
				overBlock.slots &&
				Object.keys(overBlock.slots).length > 0
			) {
				// This is dragging to bottom of a container - should place it after the container
				// at the parent level

				state.dispatch({
					message: ActionMessages.MOVE_BLOCK,
					payload: {
						id: active.id,
						position: {
							parent: overBlock.parent?.id || selectedPages,
							sibling: over.id,
							slot: getSlotForParent(
								overBlock.parent?.id || selectedPages,
							),
							type: "after",
						},
					},
				});
			} else if (currentDropPosition === "inside" && overBlock.slots) {
				// Moving inside a container

				state.dispatch({
					message: ActionMessages.MOVE_BLOCK,
					payload: {
						id: active.id,
						position: {
							parent: over.id,
							slot: "children",
						},
					},
				});
			} else {
				// Default movement logic based on currentDropPosition
				if (overBlock.parent) {
					state.dispatch({
						message: ActionMessages.MOVE_BLOCK,
						payload: {
							id: active.id,
							position: {
								parent: overBlock.parent.id,
								slot: getSlotForParent(overBlock.parent.id),
								sibling: over.id,
								type:
									currentDropPosition === "top"
										? "before"
										: "after",
							},
						},
					});
				} else {
					// Fallback if no parent - move to page directly
					state.dispatch({
						message: ActionMessages.MOVE_BLOCK,
						payload: {
							id: active.id,
							position: {
								parent: selectedPages,
								slot: "content",
							},
						},
					});
				}
			}

			setGlobalDropPositions(null);
			selectLayer(selectedPages);
		};

		const DraggableTreeItem = ({ node, children }: { node; children }) => {
			const { attributes, listeners, setNodeRef, transform } =
				useDraggable({
					id: node.id,
				});

			const style = {
				transform: CSS.Translate.toString(transform),
			};

			return (
				<div
					ref={setNodeRef}
					style={style}
					{...listeners}
					{...attributes}
				>
					{children}
				</div>
			);
		};

		const DroppableTreeItem = ({
			node,
			children,
			onDropPositionChange: _onDropPositionChange,
		}: {
			node;
			children;
			onDropPositionChange: (
				position: "top" | "bottom" | "inside",
			) => void;
		}) => {
			const { setNodeRef, isOver, active, over } = useDroppable({
				id: node.id,
			});

			const overBlock = state.getBlock(over?.id as string);

			const isContainer =
				overBlock?.slots && Object.keys(overBlock.slots).length > 0;
			const [dropPosition, setDropPosition] = useState<
				"top" | "bottom" | "inside"
			>("inside");

			const handleMouseMove = (e: React.MouseEvent) => {
				if (!isOver || !active) return;

				const rect = e.currentTarget.getBoundingClientRect();
				const mouseY = e.clientY - rect.top;
				const height = rect.height;

				const topThreshold = Math.min(height * 0.25, 15); // 25% from top or 15px, whichever is smaller
				const bottomThreshold = isContainer
					? height * 0.7
					: height - topThreshold;

				let newDropPosition: "top" | "bottom" | "inside";

				if (mouseY < topThreshold) {
					newDropPosition = "top";
				} else if (mouseY > bottomThreshold) {
					newDropPosition = "bottom";
				} else {
					newDropPosition = "inside";
				}
				setGlobalDropPositions(newDropPosition);

				if (dropPosition !== newDropPosition) {
					setDropPosition(newDropPosition);
				}
			};

			return (
				<DroppableContainer
					ref={setNodeRef}
					data-id={node.id}
					style={{ position: "relative" }}
					onMouseMove={handleMouseMove}
				>
					{isOver && (
						<>
							{/* Top drop zone */}
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									height: "4px",
									background:
										dropPosition === "top"
											? "#1976D2"
											: "transparent",
									zIndex: 10,
								}}
							/>

							{/* Inside drop zone - only visible when hovering in middle area */}
							{isContainer && (
								<div
									style={{
										position: "absolute",
										top: "4px",
										left: "4px",
										right: "4px",
										bottom: "4px",
										border:
											dropPosition === "inside"
												? "2px dashed #E91E63"
												: "none",
										background:
											dropPosition === "inside"
												? "rgba(233, 30, 99, 0.1)"
												: "transparent",
										zIndex: 9,
									}}
								/>
							)}

							{/* Bottom drop zone */}
							<div
								style={{
									position: "absolute",
									bottom: 0,
									left: 0,
									right: 0,
									height: isContainer ? "8px" : "4px",
									background:
										dropPosition === "bottom"
											? "#1976D2"
											: "transparent",
									zIndex: 10,
								}}
							/>
						</>
					)}
					{children}
				</DroppableContainer>
			);
		};

		const TreeViewComponent = ({
			block,
			variableName,
			WidgetIcon,
			canVariabilize,
		}: {
			block;
			variableName: string;
			WidgetIcon;
			canVariabilize: boolean;
		}) => {
			const [menuOpen, setMenuOpen] = React.useState(false);

			const handleDelete = (deletedId: string) => {
				const parentBlock = state.getBlock(block.parent.id);

				state.dispatch({
					message: ActionMessages.REMOVE_BLOCK,
					payload: {
						id: deletedId,
						keep: false,
					},
				});

				// If its within an iteration block, clean up the data.child
				if (parentBlock.widget === "iteration") {
					state.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: parentBlock.id,
							path: "child",
							value: null,
						},
					});
				}

				setTimeout(() => {
					designer.setSelected("");
					designer.setHovered("");
					setSelectedLayers([]);
					const block = state.blocks[selectedPages];
					handlePageSelection(block);
				}, 0);
				setMenuOpen(false);
			};

			const handleDuplicate = async (
				event: React.MouseEvent<HTMLElement>,
				duplicateId: string,
			) => {
				event.preventDefault();
				event.stopPropagation();
				const getJsonForBlock = (id: string) => {
					const block = state.blocks[id];

					const blockJson = {
						widget: toJS(block.widget),
						data: (() => {
							const data = toJS(block.data);
							if (data.id) {
								delete data.id; // Remove the id property if it exists
							}
							return data;
						})(),
						listeners: toJS(block.listeners),
						slots: {},
					};
					// generate the slots
					for (const slot in block.slots) {
						if (block.slots[slot]) {
							blockJson.slots[slot] = block.slots[
								slot
							].children.map((childId) => {
								return getJsonForBlock(childId);
							});
						}
					}

					// return it
					return blockJson;
				};

				const parentBlock = state.getBlock(block.parent.id);
				if (parentBlock.widget === "iteration") {
					toast.error(
						`Unable to duplicate ${block.widget} within an Iterator Block`,
					);
					return;
				}

				const position = block?.parent?.id
					? {
							parent: block.parent.id,
							slot: block.parent.slot,
							sibling: block.id,
							type: "after",
						}
					: undefined;

				const id = await state.dispatch({
					message: ActionMessages.ADD_BLOCK,
					payload: {
						json: getJsonForBlock(duplicateId) as BlockJSON,
						position: position,
					},
				});
				setSelectedLayers([]); // Clear first

				const newId = id as string;
				selectLayer(selectedPages); // Refresh the layer list
				// Apply selection and hover
				designer.setSelected(newId);
				designer.setHovered(newId);
				// Ensure visual selection state is fully synced
				setSelectedLayers([newId]);
				// Render and scroll to the new block (if your system supports it)
				renderBlock(newId);
				setMenuOpen(false);
			};

			const handleRenameBlock = (id: string) => {
				setEditingBlockId(id);
				const block = state.blocks[id];
				setEditBlockId(
					(block?.data?.id as string)
						? (block?.data?.id as string)
						: (block?.id as string),
				);
			};

			const handleValidation = (id: string) => {
				if (!id) {
					setRename(true);
					return;
				}

				const blocks = Object.values(state.blocks);

				const exists = blocks.some(
					(block: any) => block.id === id || block?.data?.id === id,
				);

				setRename(exists);
			};

			return (
				<div className="flex flex-row items-center gap-2 p-2 transition-colors duration-200 hover:[&_[data-onhover]]:block">
					<span className="flex h-full items-center justify-center text-[#757575]">
						<WidgetIcon className="size-4" />
					</span>
					<div
						className={`flex-1 overflow-hidden ${
							search &&
							[block.widget, block.id, block.data.id]
								.join("")
								.toLowerCase()
								.indexOf(search.toLowerCase()) > -1
								? "text-primary"
								: ""
						}`}
					>
						<span className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#111827] text-[0.8125rem]">
							{block.widget.charAt(0).toUpperCase() +
								block.widget.slice(1)}
						</span>
						<div ref={editableAreaRef}>
							{editingBlockId === block.id ? (
								<div className="flex flex-row items-center gap-1">
									<div className="flex flex-row items-center gap-1">
										<Input
											ref={inputRef}
											className="h-5 w-full max-w-xs rounded border border-primary px-1 font-normal font-sans text-muted-foreground text-sm tracking-normal shadow-none focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0"
											value={editBlockId}
											onChange={(e) => {
												const newVal = e.target.value;
												setEditBlockId(newVal);
												handleValidation(newVal);
												const cursorPosition =
													e.target.selectionStart;
												if (
													inputRef.current &&
													cursorPosition !== null
												) {
													requestAnimationFrame(
														() => {
															if (
																inputRef.current
															) {
																inputRef.current.setSelectionRange(
																	cursorPosition,
																	cursorPosition,
																);
															}
														},
													);
												}
											}}
											onClick={(e) => e.stopPropagation()}
											onMouseDown={(e) => {
												e.stopPropagation();
											}}
											autoFocus
										/>
									</div>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Button
														disabled={rename}
														size="icon"
														onMouseDown={(e) =>
															e.stopPropagation()
														}
														className="h-6 w-6 bg-transparent p-0"
														onClick={(e) => {
															e.stopPropagation();
															handleRename(
																block.id,
															);
															setRename(true);
															setEditingBlockId(
																null,
															);
														}}
														variant="secondary"
													>
														<CircleCheck
															className={`h-4 w-4 ${
																rename
																	? "text-muted-foreground"
																	: "text-primary"
															}`}
														/>
													</Button>
												</span>
											</TooltipTrigger>
											{rename && (
												<TooltipContent side="top">
													Block name already exists
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>
								</div>
							) : (
								<span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[#6b7280] text-xs">
									{variableName || block.data.id || block.id}
								</span>
							)}
						</div>
					</div>
					{variableName ? (
						<Button
							aria-label="copy"
							title="Copy variable"
							variant="ghost"
							size="icon-sm"
							className="hidden"
							data-onhover
							onClick={async (e: React.SyntheticEvent) => {
								e.stopPropagation();
								await copy(`{{${variableName}}}`);
							}}
						>
							<Copy className="size-4" />
						</Button>
					) : canVariabilize ? (
						<Button
							aria-label="add"
							title="Add variable"
							variant="ghost"
							size="icon-sm"
							className="hidden text-primary"
							data-onhover
							onClick={(e: React.SyntheticEvent) => {
								e.stopPropagation();
								setVariableModal(block.id);
							}}
						>
							<BookmarkPlus className="size-4" />
						</Button>
					) : null}

					{/* 3-dot menu button */}
					<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="more"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setMenuOpen(true);
								}}
							>
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							side="bottom"
							className="rounded-md border bg-popover p-1 shadow-md"
						>
							{!INPUT_BLOCK_TYPES.includes(block.widget) && (
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										handleRenameBlock(block.id);
										setMenuOpen(false);
									}}
									className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground"
								>
									<Pencil className="relative left-1 mr-3 size-4" />
									Rename
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={(e: React.MouseEvent<HTMLElement>) => {
									e.stopPropagation();
									handleDuplicate(e, block.id);
									setMenuOpen(false);
								}}
								className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground"
							>
								<img
									src={DuplicateIcon}
									alt="Duplicate Icon"
									className="mr-2"
								/>
								Duplicate
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									handleDelete(block.id);
									setMenuOpen(false);
								}}
								className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-outline text-sm outline-hidden focus:bg-accent focus:text-accent-foreground"
							>
								<Trash2 className="mr-1.5 size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		};

		const renderBlock = (id: string) => {
			const block = state.blocks[id];
			if (!block) {
				return null;
			}
			const variableName = state.getAlias(id);
			const canVariabilize = INPUT_BLOCK_TYPES.indexOf(block.widget) > -1;
			const WidgetIcon =
				BlockSettingsRegistry[block.widget]?.icon || CircleQuestionMark;
			const children = [];
			for (const s in block.slots) {
				children.push(...block.slots[s].children);
			}

			return (
				<DroppableTreeItem
					node={block}
					key={block.id}
					onDropPositionChange={setGlobalDropPositions}
				>
					<DraggableTreeItem key={block.id} node={block}>
						<TreeViewItem
							key={block.id}
							id={block.id}
							item={block}
							ref={(node) => {
								accordionRefs.current[block.id] =
									node instanceof HTMLElement ? node : null;
							}}
							label={
								<TreeViewComponent
									block={block}
									variableName={variableName}
									WidgetIcon={WidgetIcon}
									canVariabilize={canVariabilize}
								/>
							}
							onMouseOver={(e: React.SyntheticEvent) => {
								e.stopPropagation();
								designer.setHovered(block.id);
							}}
							onMouseLeave={(e: React.SyntheticEvent) => {
								e.stopPropagation();
								designer.setHovered("");
							}}
						>
							{children.map((c) => {
								return renderBlock(c);
							})}
						</TreeViewItem>
					</DraggableTreeItem>
				</DroppableTreeItem>
			);
		};

		const renderPage = (id: string) => {
			const block = state.blocks[id];
			const isSelected = selectedPages === block.id;
			const isSearchMatch = search
				? [block.widget, block.id]
						.join("")
						.toLowerCase()
						.indexOf(search.toLowerCase()) > -1
				: false;
			return (
				// biome-ignore lint/a11y/useKeyWithClickEvents: layer item
				// biome-ignore lint/a11y/noStaticElementInteractions: layer item
				// biome-ignore lint/a11y/useKeyWithMouseEvents: layer item
				<div
					key={block.id}
					className={`flex h-auto w-full cursor-pointer flex-row items-center justify-between px-4 py-2 ${
						isSelected ? "bg-[#EBF4FE]" : ""
					} ${isSearchMatch ? "text-primary" : ""}`}
					onClick={(_e) => {
						handlePageSelection(block);
					}}
					onMouseOver={(_e) => setPageHovered(block.id)}
					onMouseLeave={(_e) => setPageHovered("")}
				>
					<div className="flex items-center">
						<div className="flex w-6 items-center justify-center">
							{id === "page-1" && (
								<span className="flex h-full items-center justify-center text-[#757575]">
									<Home className="size-4" />
								</span>
							)}
						</div>
						<span className="text-[#374151] text-[0.875rem] leading-normal">
							{id === "page-1"
								? "/page-1"
								: `/${block.data.route as string}`}
						</span>
					</div>
					{id !== "page-1" && pageHovered === block.id && (
						<span className="flex h-full items-center justify-center text-[#757575]">
							<Trash2
								className="size-4 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									handlePageDeletion(block);
								}}
							/>
						</span>
					)}
				</div>
			);
		};

		const handlePageSelection = (block) => {
			selectLayer(block.id);
			setExpanded([]);
			accordionRefs.current = {};
			designer.setSelected(block.id);
			handleOnSelect(block);
			setSelectedPages(block.id);
		};

		/*
		 * Handle the page deletion
		 */
		const handlePageDeletion = (block) => {
			state.dispatch({
				message: ActionMessages.REMOVE_BLOCK,
				payload: {
					id: block.id,
					keep: false,
				},
			});
			if (designer.selected === block.id) {
				designer.setSelected("");
			}
			removePanel(block.id);
		};

		/** Helpers */
		/**
		 * Create a new panel and highlight it
		 *
		 * id - id of the notebook
		 */
		const createPanel = (id: string): boolean => {
			try {
				if (!id) {
					return false;
				}

				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				// get the name
				const name = id;

				// where to add the node
				const addId =
					model.getActiveTabset()?.getId() ||
					model.getRoot().getChildren()[0]?.getId() ||
					"";

				// create and select the panel
				model.doAction(
					FlexLayout.Actions.addNode(
						{
							type: "tab",
							name: name,
							component: "designer",
							config: {
								id: id,
							},
							enableClose: true,
						},
						addId,
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
				);
				// designer.setRendered(id);
			} catch (e) {
				toast.error(String(e));
				return false;
			}

			return true;
		};

		/**
		 * Copy text and add it to the clipboard
		 * @param text - text to copy
		 */
		const copy = async (text: string) => {
			try {
				await navigator.clipboard.writeText(text);
				toast.success("Successfully copied ID");
			} catch (_e) {
				toast.error("Unable to copy ID");
			}
		};

		const selectLayer = (id: string) => {
			const selectedPage = allPages.find((page) => page.id === id);
			if (!selectedPage) return;
			const children = [];
			for (const s in selectedPage.slots) {
				children.push(...selectedPage.slots[s].children);
			}
			setSelectedLayer(children);
		};

		/**
		 * Select a panel and create one if it doesn't exist
		 *
		 * id - id of the layer
		 */
		const handleOnSelect = (blockData) => {
			const id = blockData.id;
			if (blockData.widget !== "page") {
				scrollIntoView(getBlockElement(id));
				return;
			}
			// try to select a panel, if it doesn't exist create it. Save the path
			const IsSelected = selectPanel(id);
			if (!IsSelected) {
				createPanel(id);
			}
			// set the path
			if (blockData.widget !== "page") {
				setSelectedLayers([id]);
			} else {
				setSelectedPages(id);
			}
			// designer.setRendered(id);
		};

		/**
		 * Select a panel if it is there. Return false if not selected.
		 *
		 * id - id of the layer
		 */
		const selectPanel = (id: string): boolean => {
			try {
				if (!id) {
					return false;
				}

				let selectedNode: FlexLayout.TabNode | null = null;

				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				selectedNode = getNodeInfo(id, model);

				// create a new panel if there is no node
				if (!selectedNode) {
					return false;
				}

				const selectedNodeId = selectedNode.getId();
				model.doAction(FlexLayout.Actions.selectTab(selectedNodeId));
			} catch (e) {
				toast.error(String(e));
				return false;
			}

			return true;
		};

		const getNodeInfo = (id, model) => {
			let returnedNode: FlexLayout.TabNode | null = null;
			// visit the notes, and see if it exists
			model.visitNodes((node) => {
				// check if it is a tabNode
				if (node instanceof FlexLayout.TabNode) {
					// it needs to be a notebook-viewer
					const component = node.getComponent();
					if (component !== "designer") {
						return;
					}

					// path and space need to match
					const config = node.getConfig();
					if (config.id !== id) {
						return;
					}

					returnedNode = node;
				}
			});

			return returnedNode;
		};

		/**
		 * Remove a panel if it is there. Return false if not selected.
		 *
		 * id - id of the layer
		 */
		const removePanel = (id: string): boolean => {
			try {
				if (!id) {
					return false;
				}

				let selectedNode: FlexLayout.TabNode | null = null;

				// get the model
				const model = workspace.model;
				if (!model) {
					throw new Error("Missing model");
				}

				selectedNode = getNodeInfo(id, model);

				// create a new panel if there is no node
				if (!selectedNode) {
					return false;
				}

				const selectedNodeId = selectedNode.getId();
				model.doAction(FlexLayout.Actions.deleteTab(selectedNodeId));
			} catch (e) {
				toast.error(String(e));
				return false;
			}

			return true;
		};

		/**
		 * handle the add page
		 */
		const handlePageAdd = async () => {
			try {
				const newPageId = await state.dispatch({
					message: ActionMessages.ADD_BLOCK,
					payload: {
						json: PAGE_BLOCK,
					},
				});

				if (typeof newPageId === "string") {
					const block = state.blocks[newPageId];
					handlePageSelection(block);
				} else {
					console.error("Invalid newPageId:", newPageId);
				}
			} catch (error) {
				console.error("Error adding new page:", error);
				toast.error("Failed to add new page");
			}
		};

		return (
			<Panel
				actions={
					<div className="flex w-full flex-col">
						<div className="flex min-h-12 items-center justify-between px-3 pt-3 pb-2">
							<p className="m-0 font-semibold text-sm">{title}</p>
						</div>
						<PanelSearch value={search} onChange={setSearch} />
					</div>
				}
			>
				<div className="flex h-full w-full flex-col">
					<div
						className="flex flex-col"
						style={{
							flex: "0 0 140px",
							minHeight: "80px",
							maxHeight: "230px",
							overflow: "hidden",
						}}
					>
						<div className="flex h-full max-h-full w-full flex-col pt-1">
							<div className="flex w-full flex-col items-center gap-2 px-4 pt-4 pb-4">
								<div className="flex w-full flex-row items-center justify-between pb-2">
									<p className="m-0 font-semibold text-[#212121] text-sm leading-6 tracking-[0.01em]">
										Pages
									</p>
									<Button
										variant="ghost"
										size="icon-sm"
										className="layers-menu__add-layer-button"
										onClick={async (_e) => {
											await handlePageAdd();
										}}
									>
										<Plus className="size-4" />
									</Button>
								</div>
							</div>
							<div className="w-full flex-1 overflow-auto pb-2">
								{allPages?.length ? (
									allPages.map((page) => renderPage(page.id))
								) : (
									<div className="flex h-full w-full flex-col items-center justify-center">
										<p className="text-muted-foreground text-xs">
											No Pages
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
					<Separator />
					<div
						className="flex flex-col"
						style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
					>
						<DndContext
							sensors={sensors}
							collisionDetection={customCollisionDetection}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							modifiers={[restrictToFirstScrollableAncestor]}
						>
							<div className="flex h-full max-h-full w-full flex-col pt-1">
								<div className="flex w-full flex-col items-center gap-2 px-4 pt-4 pb-2">
									<div className="flex w-full flex-row items-center justify-between pb-2">
										<p className="m-0 font-semibold text-[#212121] text-sm leading-6 tracking-[0.01em]">
											Layers
										</p>
									</div>
								</div>
								<div className="h-full w-full flex-1 overflow-y-auto overflow-x-hidden pb-2">
									<TreeView
										expanded={expanded}
										onExpandChange={setExpanded}
										onItemSelect={(block: any) => {
											designer.setSelected(block.id);
											handleOnSelect(block);
										}}
									>
										{selectedLayer?.length ? (
											selectedLayer.map((c) =>
												renderBlock(c),
											)
										) : (
											<div className="flex h-full w-full flex-col items-center justify-center">
												<p className="text-muted-foreground text-xs">
													No Layers
												</p>
											</div>
										)}
									</TreeView>
								</div>
								{variableModal ? (
									<AddVariableModal
										open={true}
										to={variableModal}
										type={"block"}
										onClose={() => setVariableModal("")}
									/>
								) : null}
							</div>
						</DndContext>
					</div>
				</div>
			</Panel>
		);
	},
);
