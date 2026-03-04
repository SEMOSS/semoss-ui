import type React from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@semoss/ui/next";
import { SearchSlash, CodeXml, PenLine, UserRoundPen } from "lucide-react";

type CategoryOption = { label: string; value: string };

function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(() => {
		if (typeof window === "undefined" || !window.matchMedia) return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;

		const mql = window.matchMedia(query);
		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

		setMatches(mql.matches);

		if (mql.addEventListener) {
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		}

		// eslint-disable-next-line deprecation/deprecation
		mql.addListener(onChange);
		// eslint-disable-next-line deprecation/deprecation
		return () => mql.removeListener(onChange);
	}, [query]);

	return matches;
}

interface CategoryButtonsProps {
	buttons: CategoryOption[];
	onButtonClick: (category: CategoryOption) => void;
	selectedCategories: CategoryOption[]; // Changed from single to array
	containerClassName?: string;
	multiSelect?: boolean; // New prop to enable/disable multi-select
	onClearAll?: () => void; // New prop for clear all functionality
}

const CategoryButtons: React.FC<CategoryButtonsProps> = ({
	buttons,
	onButtonClick,
	selectedCategories,
	containerClassName,
	multiSelect = true
}) => {
	const isMobile = useMediaQuery("(max-width: 640px)");
	const location = useLocation();

	return (
		<div className="space-y-2">
			<div
				className={[
					"flex flex-wrap justify-center",
					isMobile ? "mb-1 min-w-fit flex-nowrap gap-1" : "mb-2 gap-2",
					containerClassName || "",
				].join(" ")}
			>
				{buttons.map((button) => {
					const isSelected = multiSelect
						? selectedCategories.some(cat => cat.label === button.label)
						: location.pathname === "/prompt-library" &&
						  selectedCategories.length > 0 &&
						  selectedCategories[0].label === button.label;

					return (
						<Button
							key={button.value}
							variant={isSelected ? "default" : "outline"}
							onClick={() => onButtonClick(button)}
							className={[
								"rounded-lg border border-slate-200 font-medium normal-case relative",
								"bg-transparent text-slate-500 hover:border-slate-300 hover:border-l-4 hover:border-l-[#b18950] hover:bg-slate-50",
								isSelected
									? "bg-[#b18950] text-white hover:border-[#9a7341] hover:border-l-0 hover:bg-[#9a7341]"
									: "",
								isMobile
									? "px-1 py-1 text-[0.6rem]"
									: "px-4 py-2 text-sm",
							].join(" ")}
						>
							{!isMobile && (
								button.label === "Content & Writing Assistance" ? <SearchSlash className="mr-2" /> :
								button.label === "Analysis and Evaluation" ? <PenLine className="mr-2" /> :
								button.label === "Coding Assistance" ? <CodeXml className="mr-2" /> :
								button.label === "My Prompts" ? <UserRoundPen className="mr-2" /> : null
							)}
							{button.label}
							{/* Selection indicator for multi-select */}
							{multiSelect && isSelected && (
								<span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
									<span className="text-xs">✓</span>
								</span>
							)}
						</Button>
					);
				})}
			</div>

			{/* Selected categories summary - only show in multi-select mode */}
			{multiSelect && selectedCategories.length > 0 && (
				<div className="flex flex-wrap gap-1 justify-center">
					<span className="text-xs text-muted-foreground">
						Selected: {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
					</span>
				</div>
			)}
		</div>
	);
};

export interface PromptCategoriesProps {
	categoryArray: string[];
	handleButtonClick: (category: CategoryOption) => void;
	selectedCategories: CategoryOption[]; // Changed from selectedCategory
	className?: string;
	style?: React.CSSProperties;
	buttonsContainerClassName?: string;
	multiSelect?: boolean; // New prop
	onClearAll?: () => void; // New prop
}

const PromptCategories: React.FC<PromptCategoriesProps> = ({
	categoryArray,
	handleButtonClick,
	selectedCategories,
	className,
	style,
	buttonsContainerClassName,
	multiSelect = true,
	onClearAll,
}) => {
	const isMobile = useMediaQuery("(max-width: 640px)");

	return (
		<div
			className={[
				"w-full",
				isMobile ? "overflow-x-auto overflow-y-hidden" : "",
				className || "",
			].join(" ")}
			style={style}
		>
			<CategoryButtons
				buttons={categoryArray.map((category) => ({
					label: category,
					value: category,
				}))}
				onButtonClick={handleButtonClick}
				selectedCategories={selectedCategories}
				containerClassName={buttonsContainerClassName}
				multiSelect={multiSelect}
				onClearAll={onClearAll}
			/>
		</div>
	);
};

export default PromptCategories;
