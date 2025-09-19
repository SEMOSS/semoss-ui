import { observer } from "mobx-react-lite";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { ArraySettings } from "../../shared/ArraySettings";

interface TabBlockArraySettingsProps {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to display above the array
	 */
	label: string;

	/**
	 * Path to the array in the block data
	 */
	path: string;

	/**
	 * Description text to help users understand the setting
	 */
	description?: string;

	/**
	 * Placeholder text for new items
	 */
	placeholder?: string;

	/**
	 * Minimum number of items required
	 */
	minItems?: number;

	/**
	 * Maximum number of items allowed
	 */
	maxItems?: number;
}

export const TabBlockArraySettings = observer(
	({
		id,
		label,
		path,
		description,
		placeholder,
		minItems,
		maxItems,
	}: TabBlockArraySettingsProps) => {
		const { state } = useBlocks();

		/**
		 *
		 * @param _newItem
		 * @param _index
		 * @param _allItems
		 */
		const addTab = (
			_newItem: string,
			_index: number,
			_allItems: string[],
		) => {
			state.dispatch({
				message: ActionMessages.ADD_DYNAMIC_SLOT,
				payload: {
					id: id,
				},
			});
		};

		/**
		 *
		 * @param _removedItem
		 * @param index
		 * @param _allItems
		 */
		const removeTab = (
			_removedItem: string,
			index: number,
			_allItems: string[],
		) => {
			state.dispatch({
				message: ActionMessages.REMOVE_DYNAMIC_SLOT,
				payload: {
					id: id,
					indexToRemove: index,
				},
			});

			state.dispatch({
				message: ActionMessages.SET_BLOCK_DATA,
				payload: {
					id: id,
					path: "activeTab",
					value: 1,
				},
			});
		};

		return (
			<ArraySettings
				id={id}
				label={label}
				path={path}
				description={description}
				placeholder={placeholder}
				minItems={minItems}
				maxItems={maxItems}
				onRemoveItem={removeTab}
				onAddItem={addTab}
			/>
		);
	},
);
