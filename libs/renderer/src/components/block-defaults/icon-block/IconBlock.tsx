import { observer } from "mobx-react-lite";
import type { CSSProperties } from "react";
import { Badge } from "@semoss/ui/next";
import { iconMap } from "../../../constants";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";

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
	slots: never;
}

export const IconBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data } = useBlock<IconBlockDef>(id);

	const displayIcon = (key: string) => {
		const Icon = iconMap[key] || iconMap["Icon"];
		const color = data.style.color || "currentColor";
		const width = data.style.width ?? undefined;
		const maxWidth = data.style.maxWidth ?? undefined;
		const height = data.style.height ?? undefined;
		const maxHeight = data.style.maxHeight ?? undefined;
		const iconElement = (
			<Icon
				style={{ width, maxWidth, height, maxHeight, color }}
			/>
		);

		if (data.showBadge && data.badgeContent > 0) {
			return (
				<div className="relative inline-flex">
					{iconElement}
					<Badge
						variant={data.color === "error" ? "destructive" : "default"}
						className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full text-[10px] flex items-center justify-center"
					>
						{data.badgeContent}
					</Badge>
				</div>
			);
		}

		return iconElement;
	};

	return (
		<div
			{...attrs}
			className="flex items-center justify-center h-fit w-fit px-2.5"
		>
			{displayIcon(data.icon)}
		</div>
	);
});
