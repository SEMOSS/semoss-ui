import { Add, Delete } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	Box,
	Button,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@semoss/ui";
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
			<Box>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					{label}
				</Typography>
				{description && (
					<Typography
						variant="caption"
						color="text.secondary"
						gutterBottom
					>
						{description}
					</Typography>
				)}
				<Stack spacing={2} sx={{ mt: 1 }}>
					{items.map((item, index) => (
						<Box
							key={index}
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<TextField
								fullWidth
								size="small"
								value={item}
								onChange={(e) =>
									updateItem(index, e.target.value)
								}
								placeholder={placeholder}
								variant="outlined"
							/>
							<IconButton
								size="small"
								onClick={() => removeItem(index)}
								color="error"
								disabled={items.length <= minItems}
								title="Remove item"
							>
								<Delete />
							</IconButton>
						</Box>
					))}
					<Button
						startIcon={<Add />}
						onClick={addItem}
						variant="outlined"
						size="small"
						disabled={items.length >= maxItems}
						fullWidth
					>
						Add Item
					</Button>
					{items.length >= maxItems && (
						<Typography variant="caption" color="warning.main">
							Maximum {maxItems} items reached
						</Typography>
					)}
				</Stack>
			</Box>
		);
	},
);
