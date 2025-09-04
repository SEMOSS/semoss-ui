import { useState } from "react";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Stepper } from "./index";

export default {
	title: "Components/Stepper",
	component: Stepper,
};

const steps = new Array(10).fill(null).map((_, index) => ({
	label: `Step ${index + 1}`,
	description: `Description for Step ${index + 1}`,
}));

const Template = (args) => {
	const [activeStep, setActiveStep] = useState(0);

	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	return (
		<Stepper {...args} activeStep={activeStep}>
			{steps.map((step, index) => (
				<Stepper.Step key={step.label}>
					<Stepper.StepLabel>{step.label}</Stepper.StepLabel>
					<Stepper.StepContent>
						{step.description}
						<Stack direction="row" spacing={1}>
							<Button variant="contained" onClick={handleNext}>
								{index === steps.length - 1
									? "Finish"
									: "Continue"}
							</Button>
							<Button disabled={index === 0} onClick={handleBack}>
								Back
							</Button>
						</Stack>
					</Stepper.StepContent>
				</Stepper.Step>
			))}
		</Stepper>
	);
};

export const Default = Template.bind({});

Default.args = {};

export const Vertical = Template.bind({});

Vertical.args = {
	orientation: "vertical",
};
