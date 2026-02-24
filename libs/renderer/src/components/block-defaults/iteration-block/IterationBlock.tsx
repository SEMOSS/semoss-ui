import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { useBlock, useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type Block,
	type BlockComponent,
	type BlockDef,
	type BlockJSON,
	type ListenerActions,
} from "../../../store";
import { Slot } from "../../blocks";

export interface IterationBlockDef extends BlockDef<"iteration"> {
	widget: "iteration";
	data: {
		/**
		 * CSS Properties
		 */
		style: CSSProperties;

		/**
		 * Data source
		 */
		source: string | [];

		/**
		 * Block that will be iterated
		 */
		child: Block;

		/**
		 * Conditionally show the block
		 */
		show: string;
	};
	slots: {
		children: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const IterationBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<IterationBlockDef>(id);
	const { state } = useBlocks();

	const [blocksToRemove, setBlocksToRemove] = useState([]);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	/**
	 * Add Blocks at runtime
	 */
	useEffect(() => {
		let list: string | [] = [];
		if (typeof data.source === "string") {
			try {
				list = JSON.parse(data.source);
			} catch {
				list = data.source;
			}
		} else if (Array.isArray(data.source)) {
			list = data.source;
		}

		// Only while we are in app using mode
		if (state.mode === "interactive") {
			if (Array.isArray(list)) {
				const newIds = [];

				blocksToRemove.forEach(async (b) => {
					await state.dispatch({
						message: ActionMessages.REMOVE_BLOCK,
						payload: {
							id: b,
							keep: false,
						},
					});
				});

				// biome-ignore lint/correctness/noUnusedFunctionParameters: though it is not used, to extract index we need it
				list.forEach(async (j, i) => {
					// Skip the first
					if (i === 0) return;

					const getJsonForBlock = (id: string) => {
						const block = state.blocks[id];

						const blockJson = {
							widget: toJS(block.widget),
							data: toJS(block.data),
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

					const position = {
						parent: id,
						slot: data.child.parent.slot,
						sibling: data.child.id,
						type: "after",
					};

					const newBlockId = await state.dispatch({
						message: ActionMessages.ADD_BLOCK,
						payload: {
							json: getJsonForBlock(data.child.id) as BlockJSON,
							position: position,
						},
					});

					const fixListeners = (id: string) => {
						const block = state.blocks[id];

						for (const listener in block.listeners) {
							if (block.listeners[listener].order) {
								// Iterate through the order array of messages
								block.listeners[listener].order.forEach(
									async (message: ListenerActions) => {
										// Check for the "MODIFY_VARIABLE" message
										if (
											message.message ===
											"MODIFY_VARIABLE"
										) {
											// Update the blockId in the payload
											message.payload.blockId = id;

											await state.dispatch({
												message:
													ActionMessages.SET_LISTENER,
												payload: {
													id: id,
													listener: listener,
													type: block.listeners[
														listener
													].type,
													actions:
														block.listeners[
															listener
														].order,
												},
											});
										}
									},
								);
							}
						}
						// Now do the same for all slots recursively
						for (const slot in block.slots) {
							if (block.slots[slot]) {
								block.slots[slot].children.forEach(
									(childId) => {
										fixListeners(childId);
									},
								);
							}
						}
					};
					await fixListeners(newBlockId as string);

					newIds.push(newBlockId);
				});

				setBlocksToRemove(newIds);

				return () => {
					newIds.forEach(async (blockId) => {
						await state.dispatch({
							message: ActionMessages.REMOVE_BLOCK,
							payload: {
								id: blockId,
								keep: false,
							},
						});
					});
				};
			}
		}
		// TODO: FIx Dependency array
	}, [JSON.stringify(data.source), JSON.stringify(data.child)]);

	return (
		<div
			style={{
				...data.style,
				display: "flex",
				overflowWrap: "anywhere",
			}}
			{...attrs}
		>
			<Slot slot={slots.children}></Slot>
		</div>
	);
});
