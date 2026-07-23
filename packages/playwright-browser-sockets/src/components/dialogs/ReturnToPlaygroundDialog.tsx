import { useEffect, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Progress,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type {
	RecordingMetadataModelOption,
	RecordingProjectOption,
} from "../../types/browserEvents";

type RecordingDestination = "playground" | "playground-and-app";

interface ReturnToPlaygroundDialogProps {
	open: boolean;
	disabled: boolean;
	projects: RecordingProjectOption[];
	project: RecordingProjectOption | null;
	models: RecordingMetadataModelOption[];
	model: RecordingMetadataModelOption | null;
	title: string;
	description: string;
	intent: string;
	isLoadingProjects: boolean;
	isLoadingModels: boolean;
	isGeneratingMetadata: boolean;
	onClose: () => void;
	onProjectChange: (project: RecordingProjectOption | null) => void;
	onModelChange: (model: RecordingMetadataModelOption | null) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onIntentChange: (value: string) => void;
	onGenerateMetadata: () => void;
	onSubmit: (project: RecordingProjectOption | null) => void;
}

export function ReturnToPlaygroundDialog({
	open,
	disabled,
	projects,
	project,
	models,
	model,
	title,
	description,
	intent,
	isLoadingProjects,
	isLoadingModels,
	isGeneratingMetadata,
	onClose,
	onProjectChange,
	onModelChange,
	onTitleChange,
	onDescriptionChange,
	onIntentChange,
	onGenerateMetadata,
	onSubmit,
}: ReturnToPlaygroundDialogProps) {
	const titleId = useId();
	const descriptionId = useId();
	const intentId = useId();
	const [destination, setDestination] =
		useState<RecordingDestination>("playground");
	useEffect(() => {
		if (open) setDestination("playground");
	}, [open]);
	const savingToApp = destination === "playground-and-app";
	const hasRequiredMetadata =
		!!title.trim() && !!description.trim() && !!intent.trim();

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !next && !disabled && onClose()}
		>
			<DialogContent
				className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
				showCloseButton={!disabled}
			>
				<DialogHeader>
					<DialogTitle>Send to Playground</DialogTitle>
					<DialogDescription>
						Where should this recording be saved?
					</DialogDescription>
				</DialogHeader>
				<RadioGroup
					value={destination}
					onValueChange={(value) =>
						setDestination(value as RecordingDestination)
					}
					className="gap-3"
				>
					<Label
						className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${destination === "playground" ? "border-primary bg-primary/10" : "border-border"}`}
					>
						<RadioGroupItem
							value="playground"
							disabled={disabled}
							className="mt-0.5"
						/>
						<span className="min-w-0">
							<span className="block font-semibold">
								Playground only
							</span>
							<span className="mt-1 block text-muted-foreground text-sm">
								Save the recording, selected website contexts,
								and MCP configuration in Playground.
							</span>
						</span>
					</Label>
					<Label
						className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${savingToApp ? "border-primary bg-primary/10" : "border-border"}`}
					>
						<RadioGroupItem
							value="playground-and-app"
							disabled={disabled}
							className="mt-0.5"
						/>
						<span className="min-w-0 flex-1">
							<span className="block font-semibold">
								Playground and Playwright app
							</span>
							<span className="mt-1 block text-muted-foreground text-sm">
								Save everything in Playground and also save the
								recording in the selected Playwright app.
							</span>
							<span className="mt-3 block">
								<Select
									value={project?.value ?? ""}
									onValueChange={(value) => {
										setDestination("playground-and-app");
										onProjectChange(
											projects.find(
												(item) => item.value === value,
											) ?? null,
										);
									}}
									disabled={disabled || isLoadingProjects}
								>
									<SelectTrigger
										className="w-full"
										aria-label="Project"
									>
										<SelectValue
											placeholder={
												isLoadingProjects
													? "Loading projects..."
													: "Select a project"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{projects.map((item) => (
											<SelectItem
												key={item.value}
												value={item.value}
											>
												{item.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</span>
						</span>
					</Label>
				</RadioGroup>
				<div className="grid gap-2">
					<Label>AI model</Label>
					<Select
						value={model?.value ?? ""}
						onValueChange={(value) =>
							onModelChange(
								models.find((item) => item.value === value) ??
									null,
							)
						}
						disabled={
							disabled || isLoadingModels || isGeneratingMetadata
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={
									isLoadingModels
										? "Loading models..."
										: "Select a model"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{models.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex items-center justify-between gap-2">
						<p className="text-muted-foreground text-xs">
							Used only when generating recording metadata.
						</p>
						<Button
							variant="link"
							size="sm"
							onClick={onGenerateMetadata}
							disabled={
								disabled || !model || isGeneratingMetadata
							}
						>
							{isGeneratingMetadata
								? "Generating details..."
								: "Generate details with AI"}
						</Button>
					</div>
				</div>
				<div className="relative grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor={titleId}>Title</Label>
						<Input
							id={titleId}
							value={title}
							onChange={(event) =>
								onTitleChange(event.target.value)
							}
							disabled={disabled || isGeneratingMetadata}
							placeholder="e.g., Submit a customer support request"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={descriptionId}>Description</Label>
						<Textarea
							id={descriptionId}
							value={description}
							onChange={(event) =>
								onDescriptionChange(event.target.value)
							}
							disabled={disabled || isGeneratingMetadata}
							rows={3}
							placeholder="Describe the workflow performed by this recording."
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={intentId}>Intent</Label>
						<Textarea
							id={intentId}
							value={intent}
							onChange={(event) =>
								onIntentChange(event.target.value)
							}
							disabled={disabled || isGeneratingMetadata}
							rows={3}
							placeholder="Explain the goal this recording achieves."
						/>
					</div>
					{isGeneratingMetadata && (
						<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75">
							<Progress value={60} className="absolute top-0" />
							<Spinner className="size-7" />
						</div>
					)}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={disabled}
					>
						Cancel
					</Button>
					<Button
						onClick={() => onSubmit(savingToApp ? project : null)}
						disabled={
							disabled ||
							isGeneratingMetadata ||
							!hasRequiredMetadata ||
							(savingToApp && (isLoadingProjects || !project))
						}
					>
						{disabled && <Spinner />}
						{disabled ? "Sending..." : "Send to Playground"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
