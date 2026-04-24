import { observer } from "mobx-react-lite";
import type React from "react";
import { type CSSProperties, useEffect } from "react";
import { iconMap } from "../../../constants";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ChipBlockDef extends BlockDef<"chip"> {
	widget: "chip";
	data: {
		type: string;
		label: string;
		style: CSSProperties;
		variant: "filled" | "outlined";
		disabled?: boolean;
		avatar?: React.ReactElement;
		size: "small" | "medium";
		clickable?: boolean;
		multiSelect?: boolean;
		link?: string;
		icon?: string;
		src: string;
		title: string;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
	slots: never;
}

const getContrastColor = (hexColor: string) => {
	hexColor = hexColor.replace("#", "");
	const r = parseInt(hexColor.substring(0, 2), 16);
	const g = parseInt(hexColor.substring(2, 4), 16);
	const b = parseInt(hexColor.substring(4, 6), 16);
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness >= 128 ? "#000000" : "#FFFFFF";
};

const darkenColor = (color: string): string => color;

export const ChipBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ChipBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const color = data.style?.color || "";
	const Icon = iconMap[data.icon ?? ""] || iconMap.Face;

	const chipStyle: React.CSSProperties =
		data.variant === "outlined"
			? {
					border: color ? `1px solid ${color}` : undefined,
					color: color || undefined,
				}
			: {
					backgroundColor: color || undefined,
					color: color ? getContrastColor(color) : undefined,
				};

	const sizeClass =
		data.size === "small" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

	const baseClass = `inline-flex items-center gap-1 rounded-full border font-medium ${sizeClass}${data.variant === "outlined" ? " bg-transparent" : " border-transparent"}${data.clickable ? " cursor-pointer" : ""}${data?.disabled ? " opacity-50 pointer-events-none" : ""}`;

	const label = data.label ?? data.type ?? "Chip";

	const renderChip = (children?: React.ReactNode) => (
		<span className={baseClass} style={chipStyle}>
			{children}
			{label}
		</span>
	);

	const displayChip = (key: string): React.ReactNode => {
		const link = data?.link || null;

		switch (key) {
			case "Avatar":
				return renderChip(
					<span
						className="flex size-5 items-center justify-center rounded-full text-xs"
						style={{
							backgroundColor: color
								? darkenColor(color)
								: undefined,
						}}
					>
						{data.avatar}
					</span>,
				);
			case "Icon":
				return renderChip(
					<Icon
						className="size-4"
						style={{
							color:
								data.variant !== "outlined" && color
									? getContrastColor(color)
									: undefined,
						}}
					/>,
				);
			case "Link":
				return (
					<a
						href={link ?? undefined}
						target="_blank"
						rel="noreferrer"
					>
						{renderChip()}
					</a>
				);
			default:
				return renderChip();
		}
	};

	return (
		<div
			{...attrs}
			className="flex h-fit w-fit items-center justify-center"
		>
			{displayChip(data.type)}
		</div>
	);
});
