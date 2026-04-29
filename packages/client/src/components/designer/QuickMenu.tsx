import type React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";

interface QuickMenuProps {
	parentId: string;
	anchorEl: HTMLElement | null;
	quickMenu: {
		name: string;
		value: string;
		icon: React.ReactElement;
	}[];
	onClose: () => void;
	onSelect: (item: {
		name: string;
		value: string;
		icon: React.ReactElement;
	}) => void;
	color?: string;
	iconSize?: "small" | "medium" | "large";
}

export const QuickMenu: React.FC<QuickMenuProps> = ({
	parentId,
	anchorEl,
	quickMenu,
	onClose,
	onSelect,
}) => {
	const rect = anchorEl?.getBoundingClientRect();

	return (
		<DropdownMenu
			open={Boolean(anchorEl)}
			onOpenChange={(open) => !open && onClose()}
		>
			<DropdownMenuTrigger asChild>
				<span
					style={{
						position: "fixed",
						top: rect?.bottom ?? 0,
						left: rect?.left ?? 0,
						width: 0,
						height: 0,
					}}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{quickMenu.map((item) => (
					<DropdownMenuItem
						key={`${parentId}-${item.value}`}
						onClick={() => {
							onSelect(item);
							onClose();
						}}
					>
						<div className="flex items-center gap-2">
							{item.icon}
							<span className="text-sm">{item.name}</span>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
