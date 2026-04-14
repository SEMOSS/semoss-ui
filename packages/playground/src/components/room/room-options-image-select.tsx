import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";

interface ImageSelectOption {
	value: string;
	label: string;
	svgTitle: string;
	svgContent: ReactNode;
}

interface RoomOptionsImageSelectProps {
	options: ImageSelectOption[];
	value: string;
	onChange: (value: string) => void;
}

export const RoomOptionsImageSelect = ({
	options,
	value,
	onChange,
}: RoomOptionsImageSelectProps) => {
	return (
		<div className="grid grid-cols-3 gap-2">
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onChange(option.value)}
					className={cn(
						"flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
						value === option.value
							? "border-primary bg-primary/10 text-primary"
							: "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
					)}
				>
					<div className="flex size-10 items-center justify-center">
						<svg viewBox="0 0 40 40" className="size-full">
							<title>{option.svgTitle}</title>
							{option.svgContent}
						</svg>
					</div>
					{option.label}
				</button>
			))}
		</div>
	);
};
