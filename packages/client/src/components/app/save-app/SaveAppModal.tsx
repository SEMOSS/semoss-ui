import { ChevronRight, X } from "lucide-react";
import { createElement, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import type { AppFormStep } from "./save-app.types";

interface SaveAppProps {
	open: boolean;
	handleClose: (appId?: string) => void;
	title: string;
	steps: AppFormStep[];
	defaultFormValues: object;
	handleFormSubmit: (data: object) => void;
	errorMessage: string;
	submitBtnText: string;
}

export const SaveAppModal = (props: SaveAppProps) => {
	const {
		errorMessage,
		defaultFormValues,
		handleFormSubmit,
		handleClose,
		open,
		steps,
		title,
		submitBtnText = "Upload",
	} = props;

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);
	const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

	const { getValues, handleSubmit, watch, control } = useForm({
		defaultValues: defaultFormValues,
	});

	const watchAll = watch();

	// biome-ignore lint/correctness/useExhaustiveDependencies: watchAll triggers re-evaluation on any field change
	const isStepComplete = useMemo(() => {
		return (steps[currentStepIndex].requiredFields as string[]).every(
			(field) => !!getValues(field as never),
		);
	}, [watchAll, currentStepIndex, steps, getValues]);

	const isStepSelected = (index: number) => currentStepIndex === index;

	const handlePreviousStep = () => {
		if (currentStepIndex === 0) handleClose();
		else setCurrentStepIndex(currentStepIndex - 1);
	};

	const previousStepLabel = currentStepIndex === 0 ? "Cancel" : "Back";

	const handleNextStep = () => {
		if (currentStepIndex === steps.length - 1) createApp();
		else setCurrentStepIndex(currentStepIndex + 1);
	};

	const nextStepLabel =
		currentStepIndex === steps.length - 1 ? submitBtnText : "Next";

	const createApp = handleSubmit(async (data) => {
		setIsLoading(true);
		try {
			await handleFormSubmit(data);
		} catch (e) {
			console.error(e);
			setShowErrorMessage(true);
		} finally {
			setIsLoading(false);
		}
	});

	return (
		<Dialog open={open} onOpenChange={() => !isLoading && handleClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>{title}</DialogTitle>
						<Button
							variant="ghost"
							size="icon"
							aria-label="close"
							onClick={() => handleClose()}
							disabled={isLoading}
						>
							<X className="size-4" />
						</Button>
					</div>
					<div className="flex items-center gap-1 pt-2">
						{steps.map((step, i) => (
							<div
								key={step.name}
								className="flex items-center gap-1"
							>
								{i > 0 && (
									<ChevronRight className="size-3 text-muted-foreground" />
								)}
								<Badge
									variant={
										isStepSelected(i)
											? "default"
											: "secondary"
									}
									className="flex items-center gap-1"
								>
									{step.icon}
									{step.name}
								</Badge>
							</div>
						))}
					</div>
				</DialogHeader>
				<form onSubmit={createApp}>
					<div className="h-[300px] overflow-auto py-2">
						<div className="flex flex-col gap-3">
							<span className="font-semibold text-sm">
								{steps[currentStepIndex].title}
							</span>
							{createElement(steps[currentStepIndex].component, {
								control: control,
								disabled: isLoading,
							})}
						</div>
					</div>
					<DialogFooter className="flex items-center justify-end gap-2">
						{showErrorMessage && (
							<span className="text-destructive text-xs">
								{errorMessage}
							</span>
						)}
						<Button
							type="button"
							variant="ghost"
							disabled={isLoading}
							onClick={handlePreviousStep}
						>
							{previousStepLabel}
						</Button>
						<Button
							type="button"
							disabled={isLoading || !isStepComplete}
							onClick={handleNextStep}
						>
							{nextStepLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
