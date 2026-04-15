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

export const ChipBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ChipBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const getContrastColor = (colorStr: string) => {
		let r: number, g: number, b: number;

		const rgbMatch = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
		if (rgbMatch) {
			r = parseInt(rgbMatch[1], 10);
			g = parseInt(rgbMatch[2], 10);
			b = parseInt(rgbMatch[3], 10);
		} else {
			const hex = colorStr.replace("#", "");
			r = parseInt(hex.substring(0, 2), 16);
			g = parseInt(hex.substring(2, 4), 16);
			b = parseInt(hex.substring(4, 6), 16);
		}

		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness >= 128 ? "#000000" : "#FFFFFF";
	};

	const color = data.style.color || "rgb(200, 200, 200)";
	const sizeClass = data.size === "small" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
	const isOutlined = data.variant === "outlined";
	const isFilled = !isOutlined;

	const chipStyle: React.CSSProperties = {
		color: isFilled ? getContrastColor(color) : color,
		backgroundColor: isFilled ? color : "transparent",
		border: isOutlined ? `1px solid ${color}` : "none",
	};

	const chipClasses = `inline-flex items-center gap-2 rounded-full font-medium transition-colors ${sizeClass} ${
		data.disabled ? "opacity-50 cursor-not-allowed" : "cursor-default"
	}`;

	const displayChip = (key): React.ReactNode => {
		const avatar = data?.avatar;
		const link = data?.link || null;
		const Icon = iconMap[data.icon] || iconMap["Face"];

		const chipContent = (
			<div style={chipStyle} className={chipClasses}>
				{key === "Avatar" && avatar && (
					<span
						style={{
							backgroundColor: isOutlined
								? color
								: "transparent",
							color: isFilled
								? getContrastColor(color)
								: color,
							width: data.size === "small" ? "16px" : "20px",
							height: data.size === "small" ? "16px" : "20px",
							borderRadius: "50%",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "0.75rem",
							overflow: "hidden",
						}}
					>
						{avatar}
					</span>
				)}
				{key === "Icon" && Icon && (
					<Icon
						style={{
							color: "#6b7280",
							fontSize: data.size === "small" ? 14 : 18,
						}}
					/>
				)}
				<span>{data.label ?? data.type ?? "Chip"}</span>
			</div>
		);

		if (key === "Link" && link) {
			return (
				<a
					href={link}
					target="_blank"
					rel="noreferrer"
					className="inline-block"
				>
					{chipContent}
				</a>
			);
		}

		return chipContent;
	};

	return (
		<div
			{...attrs}
			className="flex items-center justify-center h-fit w-fit"
		>
			{displayChip(data.type)}
		</div>
	);
});
