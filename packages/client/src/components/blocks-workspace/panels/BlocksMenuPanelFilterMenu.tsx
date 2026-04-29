import { useEffect, useState } from "react";
import { Button, Checkbox, PopoverContent, Separator } from "@semoss/ui/next";
import type { FilterCategory } from "../menus/menu-types";

export interface BlocksMenuPanelFilterMenuProps {
	categoryMap: Record<string, FilterCategory>;
	setCategoryMap: (newMap: Record<string, FilterCategory>) => void;
	onClose: () => void;
}

export const BlocksMenuPanelFilterMenu = ({
	categoryMap,
	setCategoryMap,
	onClose,
}: BlocksMenuPanelFilterMenuProps) => {
	const [localCategoryMap, setLocalCategoryMap] =
		useState<typeof categoryMap>(categoryMap);

	useEffect(() => {
		setLocalCategoryMap(categoryMap);
	}, [categoryMap]);

	return (
		<PopoverContent side="bottom" align="end" className="w-64 p-0">
			<div className="flex items-center justify-between px-3 py-2">
				<span className="font-medium text-primary text-sm">
					Filter By
				</span>
			</div>
			<Separator />
			<div className="flex flex-col py-1">
				{Object.values(localCategoryMap).map((category) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: filter list item
					// biome-ignore lint/a11y/noStaticElementInteractions: filter list item
					<div
						key={category.id}
						className="flex cursor-pointer items-center gap-3 px-3 py-1.5 transition-colors hover:bg-accent"
						onClick={() =>
							setLocalCategoryMap((prev) => {
								const newMap = { ...prev };
								newMap[category.id] = {
									...newMap[category.id],
									enabled: !newMap[category.id].enabled,
								};
								return newMap;
							})
						}
					>
						<Checkbox
							checked={category.enabled}
							onCheckedChange={() =>
								setLocalCategoryMap((prev) => {
									const newMap = { ...prev };
									newMap[category.id] = {
										...newMap[category.id],
										enabled: !newMap[category.id].enabled,
									};
									return newMap;
								})
							}
							onClick={(e) => e.stopPropagation()}
						/>
						<span className="text-sm">{category.id}</span>
					</div>
				))}
			</div>
			<Separator />
			<div className="flex gap-2 p-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={() => {
						const newMap = { ...categoryMap };
						Object.keys(newMap).forEach((id) => {
							newMap[id] = { ...newMap[id], enabled: false };
						});
						setCategoryMap(newMap);
						onClose();
					}}
				>
					Clear All
				</Button>
				<Button
					size="sm"
					className="flex-1"
					onClick={() => {
						setCategoryMap(localCategoryMap);
						onClose();
					}}
				>
					Apply
				</Button>
			</div>
		</PopoverContent>
	);
};
