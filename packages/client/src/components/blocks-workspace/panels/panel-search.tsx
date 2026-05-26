import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn, Input } from "@semoss/ui/next";

interface PanelSearchProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	/** Optional element rendered inside the input on the right (e.g. filter button). */
	trailing?: ReactNode;
	"data-testid"?: string;
}

/**
 * Shared search input for left-side panels (Variables, Notebooks, Layers,
 * Blocks). Keeps spacing + visual treatment consistent across all four.
 */
export const PanelSearch = ({
	value,
	onChange,
	placeholder = "Search",
	className,
	trailing,
	"data-testid": dataTestId,
}: PanelSearchProps) => {
	return (
		<div className={cn("px-3 pb-2", className)}>
			<div className="relative">
				<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
				<Input
					placeholder={placeholder}
					className={cn("w-full pl-9", trailing && "pr-10")}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					data-testid={dataTestId}
				/>
				{trailing && (
					<div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center">
						{trailing}
					</div>
				)}
			</div>
		</div>
	);
};
