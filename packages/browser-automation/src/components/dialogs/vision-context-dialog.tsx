import { useId } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
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
	SelectionBounds,
} from "../../types/browserEvents";

interface VisionContextDialogProps {
	open: boolean;
	bounds: SelectionBounds | null;
	models: RecordingMetadataModelOption[];
	modelId: string;
	prompt: string;
	isLoadingModels: boolean;
	isSubmitting: boolean;
	onModelChange: (modelId: string) => void;
	onPromptChange: (prompt: string) => void;
	onClose: () => void;
	onSubmit: () => void;
}

export function VisionContextDialog(props: VisionContextDialogProps) {
	const promptId = useId();
	return (
		<Dialog
			open={props.open}
			onOpenChange={(open) => {
				if (!open && !props.isSubmitting) props.onClose();
			}}
		>
			<DialogContent
				className="sm:max-w-lg"
				showCloseButton={!props.isSubmitting}
			>
				<DialogHeader>
					<DialogTitle>Capture vision context</DialogTitle>
					<DialogDescription>
						Ask a vision-capable model to describe the selected
						browser region.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor={promptId}>
							Question about this region
						</Label>
						<Textarea
							id={promptId}
							value={props.prompt}
							onChange={(event) =>
								props.onPromptChange(event.target.value)
							}
							placeholder="Describe the information visible in this region"
							rows={3}
							disabled={props.isSubmitting}
						/>
					</div>
					<div className="grid gap-2">
						<Label>Vision model</Label>
						{props.isLoadingModels ? (
							<div className="flex items-center gap-2 text-ink-muted text-sm">
								<Spinner /> Loading models…
							</div>
						) : (
							<Select
								value={props.modelId}
								onValueChange={props.onModelChange}
								disabled={props.isSubmitting}
							>
								<SelectTrigger aria-label="Vision model">
									<SelectValue placeholder="Select a vision-capable model" />
								</SelectTrigger>
								<SelectContent>
									{props.models.map((model) => (
										<SelectItem
											key={model.value}
											value={model.value}
										>
											{model.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<p className="text-ink-muted text-xs">
							Select a model configured to accept image input.
						</p>
					</div>
					{props.bounds && (
						<p className="text-ink-muted text-xs">
							Region:{" "}
							{Math.round(
								Math.abs(
									props.bounds.endX - props.bounds.startX,
								),
							)}{" "}
							×{" "}
							{Math.round(
								Math.abs(
									props.bounds.endY - props.bounds.startY,
								),
							)}{" "}
							browser pixels
						</p>
					)}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={props.onClose}
						disabled={props.isSubmitting}
					>
						Cancel
					</Button>
					<Button
						onClick={props.onSubmit}
						disabled={
							props.isSubmitting ||
							props.isLoadingModels ||
							!props.bounds ||
							!props.modelId ||
							!props.prompt.trim()
						}
					>
						{props.isSubmitting && <Spinner />}
						{props.isSubmitting
							? "Analyzing"
							: "Add vision context"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
