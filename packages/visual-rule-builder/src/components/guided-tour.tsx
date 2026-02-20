import {
	ChevronLeft,
	ChevronRight,
	Code2,
	GraduationCap,
	Link2,
	Target,
} from "lucide-react";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface TourStep {
	title: string;
	description: string;
	icon: React.ReactNode;
	visual?: string; // Will be emoji or text representation
}

const TOUR_STEPS: TourStep[] = [
	{
		title: "Welcome to Visual Rule Builder!",
		description:
			"This interactive guide will walk you through creating your first JSON Logic rule using our drag-and-drop interface. You'll learn how to build conditional logic visually without writing code.",
		icon: <GraduationCap className="h-8 w-8 text-purple-600" />,
		visual: "🎓",
	},
	{
		title: "Understanding Nodes",
		description:
			"Rules are built using three types of nodes:\n\n🔵 Operators (blue) - Compare values or combine conditions (==, >, AND, OR)\n🟢 Values (green) - The data you want to check (variables, numbers, text)\n🟣 Results (purple) - What happens when conditions are met",
		icon: <Target className="h-8 w-8 text-blue-600" />,
		visual: "🔵🟢🟣",
	},
	{
		title: "Step 1: Add an Operator",
		description:
			'From the left panel, drag an operator like "Equals (==)" onto the canvas. This will be the heart of your rule - it compares two values to see if they match.',
		icon: <Target className="h-8 w-8 text-blue-600" />,
		visual: "🔵",
	},
	{
		title: "Step 2: Add Values to Compare",
		description:
			'Drag two "Value" nodes onto the canvas. Click on each value node to edit it:\n\n• For variables, type: var.fieldName\n• For text, type: "your text"\n• For numbers, type: 42',
		icon: <Target className="h-8 w-8 text-green-600" />,
		visual: "🟢 🟢",
	},
	{
		title: "Step 3: Connect Your Nodes",
		description:
			"Click and drag from the small circle (handle) on a value node to the operator node. Do this for both values. The operator will now compare these two values!",
		icon: <Link2 className="h-8 w-8 text-blue-600" />,
		visual: "🟢 → 🔵 ← 🟢",
	},
	{
		title: "Step 4: Add Result Nodes",
		description:
			'Drag two "Result" nodes - one for when your condition is TRUE, and one for ELSE (when it\'s false). Click each to set what they return.',
		icon: <Target className="h-8 w-8 text-purple-600" />,
		visual: "🟣 🟣",
	},
	{
		title: "Step 5: Connect to Results",
		description:
			'Connect your operator to both result nodes:\n\n• First connection → labeled "true" (green)\n• Second connection → labeled "else" (orange)\n\nThis creates an if-then-else structure!',
		icon: <Link2 className="h-8 w-8 text-purple-600" />,
		visual: "🔵 → 🟣 (true)\n🔵 → 🟣 (else)",
	},
	{
		title: "Step 6: View Your JSON",
		description:
			'Click the "Show JSON" button in the top-right corner to see your rule converted to JSON Logic format. This is what gets executed!',
		icon: <Code2 className="h-8 w-8 text-green-600" />,
		visual: "{ }",
	},
	{
		title: "Advanced: Combine Conditions",
		description:
			"For complex rules:\n\n• Use AND when ALL conditions must be true\n• Use OR when ANY condition can be true\n• Connect multiple operators to AND/OR nodes\n• Build nested logic by chaining operators",
		icon: <Target className="h-8 w-8 text-orange-600" />,
		visual: "🔵 → AND ← 🔵",
	},
	{
		title: "You're Ready!",
		description:
			"That's it! Start by trying an example template or build from scratch. The contextual hints at the top will guide you as you work. Remember:\n\n✅ Watch for validation messages\n✅ Use the minimap to navigate\n✅ Save your work often",
		icon: <GraduationCap className="h-8 w-8 text-green-600" />,
		visual: "🎉",
	},
];

interface GuidedTourProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GuidedTour({ open, onOpenChange }: GuidedTourProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const step = TOUR_STEPS[currentStep];
	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === TOUR_STEPS.length - 1;

	const handleNext = () => {
		if (!isLastStep) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		if (!isFirstStep) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const handleFinish = () => {
		setCurrentStep(0);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<div className="flex items-center gap-3">
						{step.icon}
						<div>
							<DialogTitle className="text-xl">
								{step.title}
							</DialogTitle>
							<DialogDescription className="mt-1 text-xs">
								Step {currentStep + 1} of {TOUR_STEPS.length}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="mt-4 space-y-6">
					{/* Visual representation */}
					{step.visual && (
						<div className="flex items-center justify-center rounded-lg border-2 border-purple-200 border-dashed bg-linear-to-br from-purple-50 to-blue-50 p-8">
							<div className="whitespace-pre-line text-center font-mono text-4xl">
								{step.visual}
							</div>
						</div>
					)}

					{/* Description */}
					<div className="prose prose-sm max-w-none">
						<p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
							{step.description}
						</p>
					</div>

					{/* Progress dots */}
					<div className="flex items-center justify-center gap-2">
						{TOUR_STEPS.map((step, index) => (
							<button
								key={`step-${step.title}-${index}`}
								type="button"
								onClick={() => setCurrentStep(index)}
								className={`h-2 rounded-full transition-all ${
									index === currentStep
										? "w-8 bg-purple-600"
										: index < currentStep
											? "w-2 bg-purple-400"
											: "w-2 bg-gray-300"
								}`}
								aria-label={`Go to step ${index + 1}`}
							/>
						))}
					</div>

					{/* Navigation */}
					<div className="flex items-center justify-between gap-4 border-t pt-4">
						<Button
							variant="outline"
							onClick={handlePrevious}
							disabled={isFirstStep}
							size="sm"
						>
							<ChevronLeft className="mr-1 h-4 w-4" />
							Previous
						</Button>

						<div className="text-muted-foreground text-xs">
							{currentStep + 1} / {TOUR_STEPS.length}
						</div>

						{isLastStep ? (
							<Button onClick={handleFinish} size="sm">
								Get Started!
								<GraduationCap className="ml-2 h-4 w-4" />
							</Button>
						) : (
							<Button onClick={handleNext} size="sm">
								Next
								<ChevronRight className="ml-1 h-4 w-4" />
							</Button>
						)}
					</div>
				</div>

				{/* Quick skip */}
				{!isLastStep && (
					<div className="mt-4 text-center">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleFinish}
							className="text-muted-foreground text-xs"
						>
							Skip Tutorial
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
