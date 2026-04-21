import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AppFilterProps {
	onChange: (filters) => void;
}

export const AppFilter = (_props: AppFilterProps) => {
	const [filterByVisibility, setFilterByVisibility] = useState(true);

	return (
		<div className="flex h-fit w-[355px] flex-col bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
			<ul className="w-full">
				<li className="flex items-center justify-between px-4 py-2">
					<span className="font-semibold text-base">Filter By</span>
					<button
						type="button"
						onClick={() =>
							setFilterByVisibility(!filterByVisibility)
						}
						className="rounded p-1 hover:bg-accent"
					>
						{filterByVisibility ? (
							<ChevronUp className="size-5" />
						) : (
							<ChevronDown className="size-5" />
						)}
					</button>
				</li>
			</ul>
		</div>
	);
};
