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

const PromptBuilderConstraint = (props: {
	constraint: Constraint;
	constraintSettings: ConstraintSettings;
	setBuilderValue: (
		builderStepKey: string,
		value: ConstraintSettings,
	) => void;
}) => {
	return (
		<div className="not-last:mb-4 flex items-center gap-3">
			<Switch
				checked={
					props.constraintSettings[props.constraint.key] ?? false
				}
				onCheckedChange={() => {
					const copy = { ...props.constraintSettings };
					copy[props.constraint.key] = !copy[props.constraint.key];
					props.setBuilderValue("constraints", copy);
				}}
			/>
			<div className="flex flex-col">
				<p className="font-medium text-sm">{props.constraint.title}</p>
				<p className="text-muted-foreground text-xs">
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: props.setBuilderValue intentionally omitted
	useEffect(() => {
		if (!builderConstraintSettings) {
			props.setBuilderValue("constraints", initialConstraintSettings);
			return;
		} else {
			setConstraintSettings(builderConstraintSettings);
		}
	}, [builderConstraintSettings]);

	if (!constraintSettings) {
		return null;
	}

	return (
		<StyledStepPaper>
			<div>
				<h2 className="font-semibold text-lg">Set Constraints</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Add constraints or rules to your prompt to help the LLM
					tailor a response based on specific requirements
				</p>
			</div>
			<div className="flex flex-col gap-4 py-6">
				<h3 className="font-semibold text-base">Input Constraints</h3>
				{inputConstraints.map((constraint) => (
					<PromptBuilderConstraint
						key={constraint.key}
						constraint={constraint}
						constraintSettings={constraintSettings}
						setBuilderValue={props.setBuilderValue}
					/>
				))}
				<h3 className="font-semibold text-base">Output Constraints</h3>
				{outputConstraints.map((constraint) => (
					<PromptBuilderConstraint
						key={constraint.key}
						constraint={constraint}
						constraintSettings={constraintSettings}
						setBuilderValue={props.setBuilderValue}
					/>
				))}
			</div>
		</StyledStepPaper>
	);
}
