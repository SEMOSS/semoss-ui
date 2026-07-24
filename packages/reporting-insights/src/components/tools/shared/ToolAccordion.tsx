import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

/** Query string provided by ToolsPanel's search bar. Empty string = show all. */
export const ToolSearchContext = createContext("");

interface ToolAccordionProps {
	title: string;
	children: ReactNode;
	defaultExpanded?: boolean;
}

export function ToolAccordion({
	title,
	children,
	defaultExpanded = false,
}: ToolAccordionProps) {
	const query = useContext(ToolSearchContext);
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	useEffect(() => {
		setIsExpanded(false);
	}, [query]);

	if (query && !title.toLowerCase().includes(query.toLowerCase()))
		return null;

	return (
		<div className="border-stone-200 border-b last:border-b-0">
			{/* Header */}
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="group flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-stone-50"
			>
				<span className="font-semibold text-sm text-stone-700 group-hover:text-stone-900">
					{title}
				</span>
				<ChevronDown
					className={`h-4 w-4 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Content */}
			{isExpanded && (
				<div className="border-stone-100 border-t bg-stone-50/50 px-5 py-4">
					<div className="space-y-4">{children}</div>
				</div>
			)}
		</div>
	);
}
