import { Plus, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Button, Input, Muted, Small } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface ArraySettingsProps {
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

	/**
	 * Custom callback when adding a new item
	 */
	onAddItem?: (newItem: string, index: number, allItems: string[]) => void;

	/**
	 * Custom callback when removing an item
	 */
	onRemoveItem?: (
		removedItem: string,
		index: number,
		allItems: string[],
	) => void;

	/**
	 * Custom callback when updating an item
	 */
	onUpdateItem?: (
		oldItem: string,
		newItem: string,
		index: number,
		allItems: string[],
	) => void;
}

export const ArraySettings = observer(
	({
		id,
		label,
		path,
		description,
		placeholder = "Enter value",
		minItems = 1,
		maxItems = 10,
		onAddItem,
		onRemoveItem,
		onUpdateItem,
	}: ArraySettingsProps) => {
		const { data } = useBlockSettings(id);
		const [items, setItems] = useState<string[]>([]);

		useEffect(() => {
			// Get current items from the block data
			const currentItems = data?.[path] || [];
			setItems(Array.isArray(currentItems) ? currentItems : []);
		}, [data, path]);

		const updateItems = (newItems: string[]) => {
			setItems(newItems);
			// Update the block data
			if (data) {
				data[path] = newItems;
			}
		};

		const addItem = () => {
			if (items.length >= maxItems) return;

			const newItem = `Item ${items.length + 1}`;
			const newItems = [...items, newItem];
			const newIndex = items.length;

			updateItems(newItems);

			// Call custom add callback if provided
			if (onAddItem) {
				onAddItem(newItem, newIndex, newItems);
			}
		};

		const removeItem = (index: number) => {
			if (items.length <= minItems) return;

			const removedItem = items[index];
			const newItems = items.filter((_, i) => i !== index);

			updateItems(newItems);

			// Call custom remove callback if provided
			if (onRemoveItem) {
				onRemoveItem(removedItem, index, newItems);
			}
		};

		const updateItem = (index: number, value: string) => {
			const oldItem = items[index];
			const newItems = [...items];
			newItems[index] = value;

			updateItems(newItems);

			// Call custom update callback if provided
			if (onUpdateItem) {
				onUpdateItem(oldItem, value, index, newItems);
			}
		};

		return (
			<div>
				<Muted>{label}</Muted>
				{description && (
					<Small className="text-muted-foreground">
						{description}
					</Small>
				)}
				<div className="mt-1 flex flex-col gap-2">
					{items.map((item, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
						<div key={index} className="flex items-center gap-1">
							<Input
								className="flex-1"
								value={item}
								onChange={(e) =>
									updateItem(index, e.target.value)
								}
								placeholder={placeholder}
							/>
							<button
								type="button"
								onClick={() => removeItem(index)}
								disabled={items.length <= minItems}
								title="Remove item"
								className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-40"
							>
								<Trash2 className="size-4" />
							</button>
						</div>
					))}
					<Button
						variant="outline"
						size="sm"
						onClick={addItem}
						disabled={items.length >= maxItems}
						className="flex w-full items-center gap-1"
					>
						<Plus className="size-4" />
						Add Item
					</Button>
					{items.length >= maxItems && (
						<Small className="text-yellow-600">
							Maximum {maxItems} items reached
						</Small>
					)}
				</div>
			</div>
		);
	},
);
