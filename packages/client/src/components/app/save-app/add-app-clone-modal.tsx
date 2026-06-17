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
import type { AppTileCardEntityType } from "../app-tile-card";

interface AddAppProps {
	/** Track if the model is open */
	open: boolean;
	appId: string;
	/** Callback that is triggered on close */
	handleClose: (appId?: string) => void;
	entityType?: AppTileCardEntityType;
}

export const AddAppCloneModal = (props: AddAppProps) => {
	const { open, handleClose, appId, entityType = "app" } = props;
	const { monolithStore } = useRootStore();

	const entityLabel =
		entityType === "skill"
			? "Skill"
			: entityType === "agent"
				? "Agent"
				: "App";
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
	// Skills use a single step (no Make Public); apps and agents use two steps
	const isLastStep = entityType === "skill" ? true : currentStep === 1;

	const escapePixelString = (value: string) => {
		return value.replaceAll("'", "\\'");
	};

	/**
	 * Method that is called to clone the entity
	 */
	const cloneApp = async () => {
		setIsLoading(true);
		setErrorMessage(null);

		try {
			let clonedProjectId: string | undefined;

			if (entityType === "skill") {
				const response = await monolithStore.runQuery(
					`CloneSkill(skillId=["${appId}"], name=["${escapePixelString(name.trim())}"]);`,
				);
				const output = response.pixelReturn?.[0]?.output;
				const operationTypeRaw =
					response.pixelReturn?.[0]?.operationType;
				const operationType = Array.isArray(operationTypeRaw)
					? String(operationTypeRaw[0] ?? "")
					: String(operationTypeRaw ?? "");

				if (operationType.indexOf("ERROR") > -1) {
					const error =
						typeof output === "string"
							? output
							: "There was an error cloning your skill. Please try again.";
					setErrorMessage(error);
					toast.error(error);
					return;
				}

				clonedProjectId = String(
					(output as { project_id?: string })?.project_id || "",
				);
			} else {
				// app and agent both use CreateAppFromTemplate
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
							: `There was an error cloning your ${entityLabel.toLowerCase()}. Please try again.`;
					setErrorMessage(error);
					toast.error(error);
					return;
				}

				clonedProjectId = String(
					(output as { project_id?: string })?.project_id || "",
				);

				const trimmedDescription = description.trim();
				if (trimmedDescription && clonedProjectId) {
					const metaResponse = await monolithStore.runQuery(
						`SetProjectMetadata(project=["${escapePixelString(clonedProjectId)}"], meta=[${JSON.stringify({ description: trimmedDescription })}]);`,
					);
					const metaOperationType = Array.isArray(
						metaResponse.pixelReturn?.[0]?.operationType,
					)
						? String(
								metaResponse.pixelReturn[0].operationType[0] ??
									"",
							)
						: String(
								metaResponse.pixelReturn?.[0]?.operationType ??
									"",
							);

					if (metaOperationType.indexOf("ERROR") > -1) {
						const message =
							typeof metaResponse.pixelReturn?.[0]?.output ===
							"string"
								? metaResponse.pixelReturn[0].output
								: `${entityLabel} cloned, but failed to save description.`;
						toast.error(message);
					}
				}
			}

			toast.success(`${entityLabel} cloned successfully`);
			handleClose(clonedProjectId);
		} catch (error) {
			console.error(error);
			const message = `There was an error cloning your ${entityLabel.toLowerCase()}. Please try again.`;
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
					<DialogTitle>Clone {entityLabel}</DialogTitle>
					<DialogDescription>
						Create a new {entityLabel.toLowerCase()} from this{" "}
						{entityLabel.toLowerCase()} as a template.
					</DialogDescription>
				</DialogHeader>

				{entityType !== "skill" && (
					<div className="flex items-center gap-2 pb-1">
						<Badge
							variant={
								currentStep === 0 ? "default" : "secondary"
							}
						>
							<Pencil className="mr-1 size-3.5" />
							Details
						</Badge>
						<Badge
							variant={
								currentStep === 1 ? "default" : "secondary"
							}
						>
							<Eye className="mr-1 size-3.5" />
							Access
						</Badge>
					</div>
				)}

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
									placeholder={`Enter ${entityLabel.toLowerCase()} name`}
									disabled={isLoading}
									autoFocus
								/>
							</div>
							{entityType !== "skill" && (
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
										placeholder={`Optional description for your cloned ${entityLabel.toLowerCase()}`}
										disabled={isLoading}
										rows={3}
										className="flex min-h-[84px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
							)}
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
