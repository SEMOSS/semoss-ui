import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	ACTIONS_DISPLAY,
	type BlockDef,
	type ListenerActions,
	useBlocks,
} from "@semoss/renderer";
import {
	Button,
	Dialog,
	DialogContent,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { ListenerActionOverlay } from "./ListenerActionOverlay";

/**
 * TODO: reorganize and update the styling once app/blocks is up and working
 */
interface ListenerSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Lisetner to update
	 */
	listener: Extract<keyof D["listeners"], string>;
}

export const ListenerSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		listener,
	}: ListenerSettingsProps<D>) => {
		const { state } = useBlocks();
		const { listeners, setListener } = useBlockSettings(id);
		const blockListeners: ListenerActions[] =
			toJS(listeners)[listener]?.order;
		const type = toJS(listeners)[listener]?.type;

		const [actionIndex, setActionIndex] = useState(-1);
		const [openModal, setOpenModal] = useState(false);

		/**
		 * Open the overlay to create a edit action
		 *
		 * @param action - index of the action to edit. Will create a new one if -1
		 */
		const runAction = (action: ListenerActions) => {
			try {
				// dispatch it
				state.dispatch(action);
			} catch (e) {
				toast.error((e as Error).message);
				console.error(e);
			}
		};

		/**
		 * Get the status of the query to display icon
		 *
		 */
		const getQueryStatusIcon = (a) => {
			if (a.message === "RUN_QUERY") {
				const query = state.getQuery(a.payload.queryId);
				if (query?.isSuccessful) {
					return (
						<span className="inline-block h-2 w-2 rounded-full bg-green-500" />
					);
				} else if (query?.isError) {
					return (
						<span className="inline-block h-2 w-2 rounded-full bg-red-500" />
					);
				} else {
					return;
				}
			} else {
				return;
			}
		};

		/**
		 * Open the overlay to create a edit action
		 *
		 * @param actionIdx - index of the action to edit. Will create a new one if -1
		 */
		const openActionOverlay = (actionIdx = -1) => {
			setActionIndex(actionIdx);
			setOpenModal(true);
		};

		/**
		 * Open the overlay to create a edit action
		 *
		 * @param actionIdx - index of the action to edit. Will create a new one if -1
		 */
		const deleteListener = (actionIdx: number) => {
			// copy it
			const updated = [...listeners[listener].order];

			// remove it
			updated.splice(actionIdx, 1);

			setListener(listener, updated, type);
		};

		/**
		 * Handle drag end
		 * @param event - event object from dnd context
		 */
		const handleDragEnd = ({ active, over }) => {
			if (!active || !over) {
				console.error("Invalid item!");
				return;
			}

			// If the active item is over a different item, swap them
			if (over && active.id !== over.id) {
				const oldIndex = Number(active.id);
				const newIndex = Number(over.id);

				// copy it
				const updated = [...listeners[listener].order];
				// remove it
				const [removed] = updated.splice(oldIndex, 1);
				// add it at the new location
				updated.splice(newIndex, 0, removed);
				// update the data
				setListener(listener, updated, type);
			}
		};

		/**
		 * Handle drag end
		 * @param event - event object from dnd context
		 */
		const updateExecutionType = (t: "sync" | "async") => {
			setListener(listener, listeners[listener].order, t);
		};

		// Sortable encapsulation elements based on the sortable context
		const SortableItems = ({
			id,
			children,
		}: {
			id: string;
			children: React.ReactNode;
		}) => {
			// Use the sortable context
			const { attributes, listeners, setNodeRef, transform, transition } =
				useSortable({ id });

			// Apply styles to the list items based on their state
			const style: React.CSSProperties = {
				transform: CSS.Transform.toString(transform),
				transition,
				cursor: "grab",
			};

			return (
				<div
					key={`action-${id}`}
					ref={setNodeRef}
					{...attributes}
					{...listeners}
					style={style}
				>
					{children}
				</div>
			);
		};

		// Transform items for sortable list
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		const transformedItems = useMemo(() => {
			return (blockListeners ? blockListeners : []).map((item, index) => {
				console.log(item);
				let display = "";

				if (item.payload.queryId) {
					if (item.payload.cellId) {
						display = state.getAlias(
							item.payload.queryId,
							item.payload.cellId,
						);
					} else {
						display = state.getAlias(item.payload.queryId);
					}
				} else if (item.payload.destinationType) {
					if (item.payload.destination)
						display = item.payload.destination;
				} else if (item.payload.variable) {
					display = item.payload.variable;
				} else {
					if (item.payload.name) {
						display = item.payload.name;
					}
				}

				return {
					id: index.toString(),
					content: display,
					original: item, // Keep reference to the original item
				};
			});
		}, [blockListeners]);

		const isLink = (content: string) => {
			return content.match(/https?:\/\/[^\s/$.?#].[^\s]*/);
		};

		return (
			<>
				<DndContext
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
					modifiers={[restrictToParentElement]}
				>
					<SortableContext
						items={transformedItems?.map((item) => item.id)}
						strategy={verticalListSortingStrategy}
					>
						<ul className="m-0 list-none p-0">
							{transformedItems?.map(
								({ id, content, original: a }, aIdx) => (
									<SortableItems key={id} id={id}>
										<li className="flex items-center gap-1 border-b py-1 last:border-b-0">
											<div className="flex w-6 items-center">
												{getQueryStatusIcon(a)}
											</div>
											<div className="min-w-0 flex-1">
												<p
													className="truncate text-sm"
													title={
														ACTIONS_DISPLAY[
															a.message
														]
													}
												>
													{ACTIONS_DISPLAY[a.message]}
												</p>
												{content && (
													<p
														className="w-4/5 truncate text-muted-foreground text-xs"
														title={content}
													>
														{isLink(content) ? (
															<a
																href={content}
																target="_blank"
																rel="noopener noreferrer"
																className="underline"
															>
																{content}
															</a>
														) : (
															content
														)}
													</p>
												)}
											</div>
											<div className="flex shrink-0 items-center gap-0.5">
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => runAction(a)}
													onPointerDown={(e) =>
														e.stopPropagation()
													}
												>
													<Play className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() =>
														openActionOverlay(aIdx)
													}
													onPointerDown={(e) =>
														e.stopPropagation()
													}
												>
													<Pencil className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() =>
														deleteListener(aIdx)
													}
													onPointerDown={(e) =>
														e.stopPropagation()
													}
												>
													<Trash2 className="size-4" />
												</Button>
											</div>
										</li>
									</SortableItems>
								),
							)}
						</ul>
					</SortableContext>
				</DndContext>
				<div className="flex flex-row gap-1">
					<Button
						className="flex-1"
						variant="outline"
						size="sm"
						onClick={() => openActionOverlay(-1)}
					>
						<Plus className="mr-1 size-4" />
						New Action
					</Button>
					<ToggleGroup
						type="single"
						variant="outline"
						value={type}
						onValueChange={(val) => {
							if (val)
								updateExecutionType(val as "sync" | "async");
						}}
					>
						<ToggleGroupItem value="async" size="sm">
							Async
						</ToggleGroupItem>
						<ToggleGroupItem value="sync" size="sm">
							Sync
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
				<Dialog open={openModal} onOpenChange={(o) => setOpenModal(o)}>
					<DialogContent className="max-w-sm">
						<ListenerActionOverlay
							id={id}
							type={type}
							listener={listener}
							actionIdx={actionIndex}
							onClose={() => setOpenModal(false)}
						/>
					</DialogContent>
				</Dialog>
			</>
		);
	},
);
