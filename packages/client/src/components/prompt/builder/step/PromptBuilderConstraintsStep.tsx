import { useEffect, useState } from "react";
import { Switch } from "@semoss/ui/next";
import { StyledStepPaper } from "../../prompt.styled";
import type { Builder, ConstraintSettings } from "../../prompt.types";

interface Constraint {
	title: string;
	description: string;
	key: string;
}
type Constraints = Constraint[];
const inputConstraints: Constraints = [
	{
		title: "Restrict user input to dropdown options",
		description: "Provide a list of options for user to select from",
		key: "restrictInput",
	},
];
const outputConstraints: Constraints = [
	{
		title: "Filter hate speech",
		description: "Filter words with negative connotations",
		key: "filterHateSpeech",
	},
	{
		title: "Limit response to 100 words",
		description: "Enforce a word limit to elicit a concise response",
		key: "limitResponseWords",
	},
	{
		title: "Limit response to 150 characters",
		description:
			"Enforce a character count limit to elicit a concise response",
		key: "limitResponseCharacters",
	},
	{
		title: "Set tone of voice",
		description:
			"Select a tone of voice to give responses a specific inflection or personality",
		key: "setTone",
	},
	{
		title: "Use bullet points",
		description: "Formulate responses in bullet point form",
		key: "bulletpoints",
	},
];

const initialConstraintSettings: ConstraintSettings = {
	restrictInput: false,
	filterHateSpeech: true,
	limitResponseWords: false,
	limitResponseCharacters: false,
	setTone: false,
	bulletpoints: false,
};

export const PromptBuilderConstraint = (props: {
	constraint: Constraint;
	constraintSettings: ConstraintSettings;
	setBuilderValue: (
		builderStepKey: string,
		value: ConstraintSettings,
	) => void;
}) => {
	return (
		<div className="flex items-center justify-start [&:not(:last-child)]:mb-4">
			<Switch
				checked={
					props.constraintSettings[props.constraint.key] ?? false
				}
				onCheckedChange={() => {
					const copy = props.constraintSettings;
					copy[props.constraint.key] = !copy[props.constraint.key];
					props.setBuilderValue("constraints", copy);
				}}
				className="!h-7 !w-12 data-[state=checked]:!bg-[#16a34a] [&>span]:!h-6 [&>span]:!w-6 [&>span[data-state=checked]]:!translate-x-[calc(48px-24px-2px)]"
			/>
			<div className="ml-3 flex flex-col">
				<p className="text-base">
					{props.constraint.title}
				</p>
				<p className="text-sm">
					{props.constraint.description}
				</p>
			</div>
		</div>
	);
};

export function PromptBuilderConstraintsStep(props: {
	builder: Builder;
	setBuilderValue: (
		builderStepKey: string,
		value: ConstraintSettings,
	) => void;
}) {
	const builderConstraintSettings = props.builder.constraints
		.value as ConstraintSettings;

	const [constraintSettings, setConstraintSettings] =
		useState<ConstraintSettings | null>(null);

	useEffect(() => {
		if (!builderConstraintSettings) {
			props.setBuilderValue("constraints", initialConstraintSettings);
			return;
		} else {
			setConstraintSettings(builderConstraintSettings);
		}
	}, [builderConstraintSettings]);

	if (!constraintSettings) {
		return <></>;
	}

	console.log({ inputConstraintValues: Object.values(inputConstraints) });
	console.log({ outputConstraintsValues: Object.values(outputConstraints) });

	return (
		<StyledStepPaper elevation={2} square>
			<div>
				<h6 className="text-lg font-semibold">Set Constraints</h6>
				<p className="text-base">
					Add constraints or rules to your prompt to help the LLM
					tailor a response based on specific requirements
				</p>
			</div>
			<div className="flex flex-col py-6">
				<h6 className="text-lg font-semibold">Input Constraints</h6>
				{Array.from(
					Object.values(inputConstraints),
					(constraint: Constraint, i) => (
						<PromptBuilderConstraint
							key={constraint.key}
							constraint={constraint}
							constraintSettings={constraintSettings}
							setBuilderValue={props.setBuilderValue}
						/>
					),
				)}
				<h6 className="text-lg font-semibold">Ouput Constraints</h6>
				{Array.from(
					Object.values(outputConstraints),
					(constraint: Constraint, i) => (
						<PromptBuilderConstraint
							key={constraint.key}
							constraint={constraint}
							constraintSettings={constraintSettings}
							setBuilderValue={props.setBuilderValue}
						/>
					),
				)}
			</div>
		</StyledStepPaper>
	);
}
