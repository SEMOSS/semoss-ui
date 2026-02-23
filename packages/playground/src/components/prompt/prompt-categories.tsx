import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@semoss/ui/next";
// import IconAnalysisEvaluation from "../../assets/img/icon_analysis_and_evaluation_grey.svg";
// import IconCodingAssistance from "../../assets/img/icon_coding_assistance_grey.svg";
// import IconMyPrompts from "../../assets/img/icon_my_prompts_grey.svg";
// import IconWritingAssistance from "../../assets/img/icon_writing_assistance_grey.svg";

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
	selectedCategory: { label: string; value: string };
	containerClassName?: string;
}

const CategoryButtons: React.FC<CategoryButtonsProps> = ({
	buttons,
	onButtonClick,
	selectedCategory,
	containerClassName,
}) => {
	const isMobile = useMediaQuery("(max-width: 640px)");
	const location = useLocation();

	const iconByLabel = useMemo(
		() => ({
			// "My Prompts": IconMyPrompts,
			// "Content & Writing Assistance": IconWritingAssistance,
			// "Analysis and Evaluation": IconAnalysisEvaluation,
			// "Coding Assistance": IconCodingAssistance,
		}),
		[],
	);

	const getMyIcon = (label: string) =>
		iconByLabel[label as keyof typeof iconByLabel] || "";

	return (
		<div
			className={[
				"flex flex-wrap justify-center",
				isMobile ? "mb-1 min-w-fit flex-nowrap gap-1" : "mb-2 gap-2",
				containerClassName || "",
			].join(" ")}
		>
			{buttons.map((button) => {
				const isSelected =
					location.pathname === "/prompt-library" &&
					selectedCategory.label === button.label;

				return (
					<Button
						key={button.value}
						variant={isSelected ? "default" : "outline"}
						onClick={() => onButtonClick(button)}
						className={[
							"rounded-lg border border-slate-200 font-medium normal-case",
							"bg-transparent text-slate-500 hover:border-slate-300 hover:border-l-4 hover:border-l-[#b18950] hover:bg-slate-50",
							isSelected
								? "bg-[#b18950] text-white hover:border-[#9a7341] hover:border-l-0 hover:bg-[#9a7341]"
								: "",
							isMobile
								? "px-1 py-1 text-[0.6rem]"
								: "px-4 py-2 text-sm",
						].join(" ")}
					>
						{!isMobile && getMyIcon(button.label) ? (
							<img
								src={getMyIcon(button.label)}
								width={20}
								height={20}
								alt=""
								className="mr-2"
							/>
						) : null}
						{button.label}
					</Button>
				);
			})}
		</div>
	);
};

export interface PromptCategoriesProps {
	categoryArray: string[];
	handleButtonClick: (category: CategoryOption) => void;
	selectedCategory: { label: string; value: string };
	className?: string;
	style?: React.CSSProperties;
	buttonsContainerClassName?: string;
}

const PromptCategories: React.FC<PromptCategoriesProps> = ({
	categoryArray,
	handleButtonClick,
	selectedCategory,
	className,
	style,
	buttonsContainerClassName,
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
				selectedCategory={selectedCategory}
				containerClassName={buttonsContainerClassName}
			/>
		</div>
	);
};

export default PromptCategories;
