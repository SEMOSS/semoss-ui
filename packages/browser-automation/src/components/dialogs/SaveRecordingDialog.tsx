import { useId } from "react";
import {
	Button,
	Dialog,
	DialogContent,
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

export type RecordingSaveDestination = "playground" | "playground-and-app";

interface SaveRecordingDialogProps {
	open: boolean;
	projects: RecordingProjectOption[];
	project: RecordingProjectOption | null;
	models: RecordingMetadataModelOption[];
	model: RecordingMetadataModelOption | null;
	title: string;
	fileName: string;
	description: string;
	intent: string;
	isLoadingProjects: boolean;
	isLoadingModels: boolean;
	isGeneratingMetadata: boolean;
	isSaving: boolean;
	canSave: boolean;
	showPlaygroundDestinations: boolean;
	destination: RecordingSaveDestination;
	onClose: () => void;
	onProjectChange: (project: RecordingProjectOption | null) => void;
	onModelChange: (model: RecordingMetadataModelOption | null) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onIntentChange: (value: string) => void;
	onGenerateMetadata: () => void;
	onDestinationChange: (destination: RecordingSaveDestination) => void;
	onSave: () => void;
}

export function SaveRecordingDialog(props: SaveRecordingDialogProps) {
	const titleId = useId();
	const fileId = useId();
	const descriptionId = useId();
	const intentId = useId();
	const hasRequiredMetadata =
		!!props.title.trim() &&
		!!props.description.trim() &&
		!!props.intent.trim();
	const requiresProject =
		!props.showPlaygroundDestinations ||
		props.destination === "playground-and-app";
	const selectProject = (value: string) =>
		props.onProjectChange(
			props.projects.find((item) => item.value === value) ?? null,
		);
	const selectModel = (value: string) =>
		props.onModelChange(
			props.models.find((item) => item.value === value) ?? null,
		);
	return (
		<Dialog
			open={props.open}
			onOpenChange={(next) => !next && !props.isSaving && props.onClose()}
		>
			<DialogContent
				className="sm:max-w-xl"
				showCloseButton={!props.isSaving}
			>
				<DialogHeader>
					<DialogTitle>Save recording</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					{props.showPlaygroundDestinations && (
						<div className="grid gap-2">
							<Label>Save destination</Label>
							<RadioGroup
								value={props.destination}
								onValueChange={(value) =>
									props.onDestinationChange(
										value as RecordingSaveDestination,
									)
								}
								className="gap-2"
							>
								<Label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
									<RadioGroupItem
										value="playground"
										className="mt-0.5"
									/>
									<div>
										<p className="font-semibold">
											Playground only
										</p>
										<p className="text-muted-foreground text-sm">
											Save the recording and playback tool
											in this Playground.
										</p>
									</div>
								</Label>
								<Label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
									<RadioGroupItem
										value="playground-and-app"
										className="mt-0.5"
									/>
									<div>
										<p className="font-semibold">
											Playground and app
										</p>
										<p className="text-muted-foreground text-sm">
											Also sync the recording and playback
											tool to the selected app.
										</p>
									</div>
								</Label>
							</RadioGroup>
						</div>
					)}
					{requiresProject && (
						<div className="grid gap-2">
							<Label>Project</Label>
							<Select
								value={props.project?.value ?? ""}
								onValueChange={selectProject}
								disabled={props.isLoadingProjects}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											props.isLoadingProjects
												? "Loading projects..."
												: "Select a project"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{props.projects.map((item) => (
										<SelectItem
											key={item.value}
											value={item.value}
										>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-muted-foreground text-xs">
								Apps you can edit are shown. Agents and skills
								are excluded.
							</p>
						</div>
					)}
					<div className="grid gap-2">
						<Label>AI model</Label>
						<Select
							value={props.model?.value ?? ""}
							onValueChange={selectModel}
							disabled={
								props.isLoadingModels ||
								props.isGeneratingMetadata
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										props.isLoadingModels
											? "Loading models..."
											: "Select a model"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{props.models.map((item) => (
									<SelectItem
										key={item.value}
										value={item.value}
									>
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
								onClick={props.onGenerateMetadata}
								disabled={
									!props.model || props.isGeneratingMetadata
								}
							>
								{props.isGeneratingMetadata
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
								value={props.title}
								onChange={(event) =>
									props.onTitleChange(event.target.value)
								}
								disabled={props.isGeneratingMetadata}
								placeholder="e.g., Submit a customer support request"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor={fileId}>File name</Label>
							<Input
								id={fileId}
								value={props.fileName}
								disabled
							/>
							<p className="text-muted-foreground text-xs">
								Generated from title and today's date.
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor={descriptionId}>Description</Label>
							<Textarea
								id={descriptionId}
								value={props.description}
								onChange={(event) =>
									props.onDescriptionChange(
										event.target.value,
									)
								}
								disabled={props.isGeneratingMetadata}
								rows={3}
								placeholder="Describe the business workflow performed by this recording."
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor={intentId}>Intent</Label>
							<Textarea
								id={intentId}
								value={props.intent}
								onChange={(event) =>
									props.onIntentChange(event.target.value)
								}
								disabled={props.isGeneratingMetadata}
								rows={3}
								placeholder="Explain the business goal this recording achieves."
							/>
						</div>
						{props.isGeneratingMetadata && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75">
								<Progress
									value={60}
									className="absolute top-0"
								/>
								<Spinner className="size-7" />
							</div>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={props.onClose}
						disabled={props.isSaving}
					>
						Cancel
					</Button>
					<Button
						onClick={props.onSave}
						disabled={
							props.isSaving ||
							props.isGeneratingMetadata ||
							!props.canSave ||
							(requiresProject && !props.project) ||
							!hasRequiredMetadata
						}
					>
						{props.isSaving && <Spinner />}
						{props.isSaving ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
