import { useCallback, useState } from "react";
import { cn } from "@semoss/ui/next";

interface PromptTokenChipProps {
	label: string;
	size?: "small" | "medium";
	isChipSelected: boolean;
	disableHover: boolean;
	onClick?: () => void;
}

export const PromptTokenChip = ({
	label,
	isChipSelected,
	disableHover,
	onClick,
}: PromptTokenChipProps) => {
	const [hovered, setHovered] = useState(false);

	const onMouseOver = useCallback(() => setHovered(true), []);
	const onMouseOut = useCallback(() => setHovered(false), []);

	return (
		<button
			type="button"
			onMouseOver={onMouseOver}
			onFocus={onMouseOver}
			onMouseOut={onMouseOut}
			onBlur={onMouseOut}
			onClick={onClick}
			className={cn(
				"mx-px mb-0.5 inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 font-semibold text-xs transition-colors",
				disableHover && "cursor-default",
				isChipSelected
					? "bg-primary text-primary-foreground"
					: hovered && !disableHover
						? "bg-secondary text-secondary-foreground"
						: "bg-primary/10 text-primary",
			)}
		>
			{label}
		</button>
	);
};
