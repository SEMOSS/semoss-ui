import { Eye, Pencil } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Badge,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	P,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface AddAppProps {
	/** Track if the model is open */
	open: boolean;
	appId: string;
	/** Callback that is triggered on close */
	handleClose: (appId?: string) => void;
}

export const AddAppCloneModal = (props: AddAppProps) => {
	const { open, handleClose, appId } = props;
	const { monolithStore } = useRootStore();
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isGlobal, setIsGlobal] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const nameId = useId();
	const descriptionId = useId();
	const makePublicId = useId();

	useEffect(() => {
		if (!open) return;
		setCurrentStep(0);
		setIsLoading(false);
		setName("");
		setDescription("");
		setIsGlobal(false);
		setErrorMessage(null);
	}, [open]);

	const isNameValid = name.trim().length > 0;
	const isLastStep = currentStep === 1;

	const escapePixelString = (value: string) => {
		return value.replaceAll("'", "\\'");
	};

	/**
	 * Method that is called to clone the app
	 */
	const cloneApp = async () => {
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const cloneProjectResponse = await monolithStore.runQuery(
				`CreateAppFromTemplate(project=["${escapePixelString(name.trim())}"], projectTemplate=["${appId}"], global=["${isGlobal}"]);`,
			);
			const output = cloneProjectResponse.pixelReturn?.[0]?.output;
			const operationTypeRaw =
				cloneProjectResponse.pixelReturn?.[0]?.operationType;
			const operationType = Array.isArray(operationTypeRaw)
				? String(operationTypeRaw[0] ?? "")
				: String(operationTypeRaw ?? "");

			if (operationType.indexOf("ERROR") > -1) {
				const error =
					typeof output === "string"
						? output
						: "There was an error cloning your app. Please try again.";
				setErrorMessage(error);
				toast.error(error);
				return;
			}

			const clonedProjectId = String(output?.project_id || "");
			const trimmedDescription = description.trim();

			if (trimmedDescription && clonedProjectId) {
				const setProjectMetadataResponse = await monolithStore.runQuery(
					`SetProjectMetadata(project=["${escapePixelString(clonedProjectId)}"], meta=[${JSON.stringify({ description: trimmedDescription })}]);`,
				);

				const metadataOutput =
					setProjectMetadataResponse.pixelReturn?.[0]?.output;
				const metadataOperationTypeRaw =
					setProjectMetadataResponse.pixelReturn?.[0]?.operationType;
				const metadataOperationType = Array.isArray(
					metadataOperationTypeRaw,
				)
					? String(metadataOperationTypeRaw[0] ?? "")
					: String(metadataOperationTypeRaw ?? "");

				if (metadataOperationType.indexOf("ERROR") > -1) {
					const message =
						typeof metadataOutput === "string"
							? metadataOutput
							: "App cloned, but failed to save description metadata.";
					toast.error(message);
				}
			}

			toast.success("App cloned successfully");
			handleClose(output?.project_id);
		} catch (error) {
			console.error(error);
			const message =
				"There was an error cloning your app. Please check your template files and try again.";
			setErrorMessage(message);
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleNext = async () => {
		if (isLastStep) {
			await cloneApp();
			return;
		}

		setCurrentStep(1);
	};

	const handleBack = () => {
		if (currentStep === 0) {
			handleClose();
			return;
		}

		setCurrentStep(0);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) handleClose();
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Clone App</DialogTitle>
					<DialogDescription>
						Create a new app from this app as a template.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-2 pb-1">
					<Badge
						variant={currentStep === 0 ? "default" : "secondary"}
					>
						<Pencil className="mr-1 size-3.5" />
						Details
					</Badge>
					<Badge
						variant={currentStep === 1 ? "default" : "secondary"}
					>
						<Eye className="mr-1 size-3.5" />
						Access
					</Badge>
				</div>

				<div className="space-y-4">
					{currentStep === 0 ? (
						<>
							<div className="space-y-2">
								<Label htmlFor={nameId}>Name</Label>
								<Input
									id={nameId}
									value={name}
									onChange={(event) =>
										setName(event.target.value)
									}
									placeholder="Enter app name"
									disabled={isLoading}
									autoFocus
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={descriptionId}>
									Description
								</Label>
								<textarea
									id={descriptionId}
									value={description}
									onChange={(event) =>
										setDescription(event.target.value)
									}
									placeholder="Optional description for your cloned app"
									disabled={isLoading}
									rows={3}
									className="flex min-h-[84px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>
						</>
					) : (
						<div className="space-y-3">
							<div className="flex items-start gap-2">
								<Checkbox
									id={makePublicId}
									checked={isGlobal}
									disabled={isLoading}
									onCheckedChange={(value) =>
										setIsGlobal(value === true)
									}
								/>
								<div className="space-y-1">
									<Label htmlFor={makePublicId}>
										Make Public
									</Label>
									<P className="text-muted-foreground text-sm">
										Show app to all users and automatically
										give them read-only access. Users can
										request elevated access.
									</P>
								</div>
							</div>
						</div>
					)}
				</div>

				{errorMessage ? (
					<P className="text-destructive text-sm">{errorMessage}</P>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isLoading}
						onClick={handleBack}
					>
						{currentStep === 0 ? "Cancel" : "Back"}
					</Button>
					<Button
						type="button"
						disabled={isLoading || (!isLastStep && !isNameValid)}
						onClick={handleNext}
					>
						{isLastStep ? "Clone" : "Next"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
