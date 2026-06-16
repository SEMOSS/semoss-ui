import { observer } from "mobx-react-lite";
import type { CSSProperties } from "react";
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

	const Icon = iconMap[data.icon] || iconMap.Icon;
	const { color, width, maxWidth, height, maxHeight } = data.style;

	const iconElement = (
		<Icon
			style={{
				width: width ?? undefined,
				maxWidth: maxWidth ?? undefined,
				height: height ?? undefined,
				maxHeight: maxHeight ?? undefined,
				color,
			}}
		/>
	);

	return (
		<div
			{...attrs}
			className="flex h-fit w-fit items-center justify-center px-2.5"
		>
			{data.showBadge && data.badgeContent > 0 ? (
				<div className="relative inline-flex">
					{iconElement}
					<span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground">
						{data.badgeContent > 99 ? "99+" : data.badgeContent}
					</span>
				</div>
			) : (
				iconElement
			)}
		</div>
	);
});
