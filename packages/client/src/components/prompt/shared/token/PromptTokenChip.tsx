import { useCallback, useState } from "react";

interface PromptTokenChipProps {
	isChipSelected?: boolean;
	disableHover?: boolean;
	label?: string;
	size?: "small" | "medium";
	onClick?: () => void;
	[key: string]: unknown;
}

export const PromptTokenChip = (props: PromptTokenChipProps) => {
	const {
		disableHover,
		isChipSelected,
		label,
		size = "medium",
		onClick,
		...rest
	} = props;
	const [hovered, setHovered] = useState(false);

	const mouseOver = useCallback(() => {
		setHovered(true);
	}, []);

	const mouseOut = useCallback(() => {
		setHovered(false);
	}, []);

	const isHoveredActive = hovered && !disableHover;

	return (
		<span
			role="button"
			tabIndex={0}
			onMouseOver={mouseOver}
			onMouseOut={mouseOut}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick?.();
			}}
			className={`inline-flex items-center rounded-full font-semibold ${
				size === "small" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
			} ${disableHover ? "cursor-default" : "cursor-pointer"}`}
			style={{
				margin: "0 1px 2px",
				backgroundColor: isHoveredActive
					? "hsl(var(--secondary))"
					: isChipSelected
						? "#16a34a"
						: "#e3f2fd",
				color: isHoveredActive
					? "hsl(var(--secondary-foreground))"
					: isChipSelected
						? "#e3f2fd"
						: "#16a34a",
			}}
		>
			{label}
		</span>
	);
};
