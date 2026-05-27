import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface StepperContextValue {
	activeStep: number;
	orientation?: "horizontal" | "vertical";
}

const StepperContext = React.createContext<StepperContextValue>({
	activeStep: 0,
	orientation: "horizontal",
});

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
	activeStep?: number;
	orientation?: "horizontal" | "vertical";
	children: React.ReactNode;
}

function Stepper({
	activeStep = 0,
	orientation = "horizontal",
	className,
	children,
	...props
}: StepperProps) {
	return (
		<StepperContext.Provider value={{ activeStep, orientation }}>
			<div
				data-slot="stepper"
				className={cn(
					"flex gap-2",
					orientation === "horizontal"
						? "flex-row items-center"
						: "flex-col",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</StepperContext.Provider>
	);
}

interface StepContextValue {
	index: number;
	isActive: boolean;
	isCompleted: boolean;
}

const StepContext = React.createContext<StepContextValue>({
	index: 0,
	isActive: false,
	isCompleted: false,
});

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	active?: boolean;
	completed?: boolean;
}

function StepperStep({
	children,
	active,
	completed,
	className,
	...props
}: StepProps) {
	const { activeStep, orientation } = React.useContext(StepperContext);
	const index = 0; // Will be managed by parent context in future enhancement

	const isActive = active ?? index === activeStep;
	const isCompleted = completed ?? index < activeStep;

	return (
		<StepContext.Provider value={{ index, isActive, isCompleted }}>
			<div
				data-slot="step"
				className={cn(
					"flex items-center gap-2",
					orientation === "horizontal" ? "flex-row" : "flex-col",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</StepContext.Provider>
	);
}

interface StepLabelProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	optional?: React.ReactNode;
	error?: boolean;
}

function StepperStepLabel({
	children,
	optional,
	error,
	className,
	...props
}: StepLabelProps) {
	const { isActive, isCompleted, index } = React.useContext(StepContext);
	const { orientation } = React.useContext(StepperContext);

	return (
		<div
			data-slot="step-label"
			className={cn(
				"flex items-center gap-2",
				orientation === "horizontal" ? "flex-row" : "flex-col",
				className,
			)}
			{...props}
		>
			<div
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-medium text-sm transition-colors",
					isCompleted &&
						"border-primary bg-primary text-primary-foreground",
					isActive && !isCompleted && "border-primary text-primary",
					!isActive &&
						!isCompleted &&
						"border-muted-foreground/30 text-muted-foreground",
					error && "border-destructive text-destructive",
				)}
			>
				{isCompleted ? (
					<Check className="h-4 w-4" />
				) : (
					<span>{index + 1}</span>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<span
					className={cn(
						"font-medium text-sm transition-colors",
						isActive && "text-foreground",
						!isActive && "text-muted-foreground",
						error && "text-destructive",
					)}
				>
					{children}
				</span>
				{optional && (
					<span className="text-muted-foreground text-xs">
						{optional}
					</span>
				)}
			</div>
		</div>
	);
}

interface StepContentProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
}

function StepperStepContent({
	children,
	className,
	...props
}: StepContentProps) {
	const { isActive } = React.useContext(StepContext);
	const { orientation } = React.useContext(StepperContext);

	if (!isActive) {
		return null;
	}

	return (
		<div
			data-slot="step-content"
			className={cn(
				"transition-all",
				orientation === "vertical" && "ms-4 ps-6 pb-4",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export { Stepper, StepperStep, StepperStepLabel, StepperStepContent };
export type { StepperProps, StepProps, StepLabelProps, StepContentProps };
