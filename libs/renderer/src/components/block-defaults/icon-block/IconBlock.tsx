import { Badge } from "@mui/material";
import { observer } from "mobx-react-lite";
import type { CSSProperties } from "react";
import { iconMap } from "../../../constants";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface IconBlockDef extends BlockDef<"icon"> {
	widget: "icon";
	data: {
		icon: string;
		style: CSSProperties;
		src: string;
		title: string;
		show: string;
		badgeContent: number;
		color:
			| "primary"
			| "default"
			| "secondary"
			| "error"
			| "info"
			| "success"
			| "warning";
		showBadge: boolean;
	};
	listeners: {
		onClick: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
	slots: never;
}

export const IconBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<IconBlockDef>(id);

	const displayIcon = (key: string) => {
		const Icon = iconMap[key] || iconMap["Icon"];
		const color = data.style.color || "primary";
		const width = data.style.width ?? null;
		const maxWidth = data.style.maxWidth ?? null;
		const height = data.style.height ?? null;
		const maxHeight = data.style.maxHeight ?? null;
		const iconElement = (
			<Icon sx={{ width, maxWidth, height, maxHeight, color }} />
		);

		if (data.showBadge && data.badgeContent > 0) {
			return (
				<Badge badgeContent={data.badgeContent} color={data.color}>
					{iconElement}
				</Badge>
			);
		}

		return iconElement;
	};

	return (
		<div
			{...attrs}
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "fit-content",
				width: "fit-content",
				paddingInline: "10px",
			}}
			onClick={() => {
				listeners.onClick();
				}}
		>
			{displayIcon(data.icon)}
		</div>
	);
});
