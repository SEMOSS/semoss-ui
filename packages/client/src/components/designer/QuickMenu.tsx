import type React from "react";
import { Icon, Menu, Stack, styled, Typography } from "@semoss/ui";

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

const StyledQuickMenu = styled(Menu)(() => ({
	"& .MuiMenu-paper": {
		borderRadius: "4px",
		background: "#FFF",
		boxShadow: "0px 5px 24px 0px rgba(0, 0, 0, 0.32)",
	},
}));

const StyledIcon = styled(Icon)(() => ({
	color: "#757575",
}));

export const QuickMenu: React.FC<QuickMenuProps> = ({
	parentId,
	anchorEl,
	quickMenu,
	onClose,
	onSelect,
	color = "#757575",
	iconSize = "small",
}) => {
	const handleOnSelect = (item) => {
		onSelect(item);
	};
	return (
		<StyledQuickMenu
			anchorEl={anchorEl}
			open={Boolean(anchorEl)}
			onClose={onClose}
		>
			{quickMenu.map((item) => (
				<Menu.Item
					key={`${parentId}-${item.value}`}
					value={item.value}
					onClick={() => handleOnSelect(item)}
				>
					<Stack direction="row" alignItems="center">
						<StyledIcon sx={{ color }} fontSize={iconSize}>
							{item.icon}
						</StyledIcon>
						<Typography variant="body2">{item.name}</Typography>
					</Stack>
				</Menu.Item>
			))}
		</StyledQuickMenu>
	);
};
