import { Search, X } from "lucide-react";
import type React from "react";
import { Button, Input } from "@semoss/ui/next";
import type { SearchBarProps } from "./types";

export const SearchBar: React.FC<SearchBarProps> = ({
	value,
	onChange,
	onClear,
	placeholder = "Search functions by name, title, or description...",
	className = "",
}) => {
	return (
		<div className={`relative ${className}`}>
			<Search
				className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
				size={18}
			/>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full py-2 pr-10 pl-10 text-sm"
			/>
			{value && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onClear}
					className="-translate-y-1/2 absolute top-1/2 right-3 transform text-gray-400 transition-colors hover:text-gray-600"
				>
					<X size={18} />
				</Button>
			)}
		</div>
	);
};
