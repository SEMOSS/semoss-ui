// import IconAnalysisEvaluation from "@/assets/img/icon_analysis_and_evaluation_grey.svg";
// import IconCodingAssistance from "@/assets/img/icon_coding_assistance_grey.svg";
// import IconMyPrompts from "@/assets/img/icon_my_prompts_grey.svg";
// import IconWritingAssistance from "@/assets/img/icon_writing_assistance_grey.svg";
// import type { Prompt } from "@/components/prompt/prompt-grid";

// interface SuggestedPromptCategory {
// 	option: string;
// 	description: string;
// 	subOptions: SubOption[];
// 	icon?: string;
// }

// interface SubOption {
// 	option: string;
// 	promptText: string;
// }

// /**
//  * Keep the original category structure (if you need it elsewhere),
//  * but export `suggestedPrompts` as `Prompt[]` so Prompt Library can pass it
//  * directly to PromptGrid without a type error.
//  */
// const suggestedPromptCategories: SuggestedPromptCategory[] = [
// 	{
// 		option: "My Prompts",
// 		description: "Users Prompts.",
// 		subOptions: [
// 			{ option: "My Prompt 1", promptText: "My Prompt 1" },
// 			{ option: "My Prompt 2", promptText: "My Prompt 2" },
// 		],
// 		icon: IconMyPrompts,
// 	},
// 	{
// 		option: "Writing Assistance",
// 		description:
// 			"text to a more professional tone using formal, clear and precise language.",
// 		subOptions: [
// 			{
// 				option: "Help me write an email",
// 				promptText: "Help me write an email",
// 			},
// 			{
// 				option: "Draft meeting agenda",
// 				promptText: "Draft meeting agenda",
// 			},
// 			{
// 				option: "Create step by step instructions",
// 				promptText: "Create step by step instructions",
// 			},
// 		],
// 		icon: IconWritingAssistance,
// 	},
// 	{
// 		option: "Analysis & Evaluation",
// 		description: "a list of ideas related to a specific topic.",
// 		subOptions: [
// 			{
// 				option: "Analyze",
// 				promptText: "Analyze the following information:",
// 			},
// 		],
// 		icon: IconAnalysisEvaluation,
// 	},
// 	{
// 		option: "Coding Assistance",
// 		description: "Coding Assitance.",
// 		subOptions: [
// 			{
// 				option: "Explain Code Snippets",
// 				promptText: "Explain Code Snippets",
// 			},
// 			{ option: "Write Code", promptText: "Write Code" },
// 			{ option: "Write Unit Tests", promptText: "Write Unit Tests" },
// 			{
// 				option: "Organize Information into JSON format",
// 				promptText: "Organize Information into JSON format",
// 			},
// 		],
// 		icon: IconCodingAssistance,
// 	},
// ];

// function toPrompts(categories: SuggestedPromptCategory[]): Prompt[] {
// 	return categories.flatMap((category) =>
// 		category.subOptions.map((s, idx) => ({
// 			ID: `${category.option}:${idx}:${s.option}`,
// 			TITLE: s.option,
// 			INTENT: s.promptText,
// 		})),
// 	);
// }

// /**
//  * Import this in Prompt Library wherever a `Prompt[]` is expected.
//  * Name is intentionally `suggestedPrompts` to avoid changing imports.
//  */
// export const suggestedPrompts: Prompt[] = toPrompts(suggestedPromptCategories);

// /** Optional: export categories if another UI needs them */
// export { suggestedPromptCategories };
