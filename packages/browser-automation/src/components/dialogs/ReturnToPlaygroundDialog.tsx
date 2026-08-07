import { useEffect, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Muted,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import type { RecordingProjectOption } from "../../types/browserEvents";

type RecordingDestination = "playground" | "playground-and-app";

interface ReturnToPlaygroundDialogProps {
	open: boolean;
	disabled: boolean;
	projects: RecordingProjectOption[];
	project: RecordingProjectOption | null;
	isLoadingProjects: boolean;
	onClose: () => void;
	onProjectChange: (project: RecordingProjectOption | null) => void;
	onSubmit: (project: RecordingProjectOption | null) => void;
}

export function ReturnToPlaygroundDialog({
	open,
	disabled,
	projects,
	project,
	isLoadingProjects,
	onClose,
	onProjectChange,
	onSubmit,
}: ReturnToPlaygroundDialogProps) {
	const [destination, setDestination] =
		useState<RecordingDestination>("playground");
	const playgroundDestinationId = useId();
	const appDestinationId = useId();
	useEffect(() => {
		if (open) setDestination("playground");
	}, [open]);
	const savingToApp = destination === "playground-and-app";

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !next && !disabled && onClose()}
		>
			<DialogContent className="sm:max-w-xl" showCloseButton={!disabled}>
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
						htmlFor={playgroundDestinationId}
						className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${destination === "playground" ? "border-primary bg-accent" : "border-border"}`}
					>
						<RadioGroupItem
							id={playgroundDestinationId}
							value="playground"
							disabled={disabled}
							className="mt-0.5"
						/>
						<div className="min-w-0">
							<Muted className="block text-foreground">
								Playground only
							</Muted>
							<Muted className="mt-1 block">
								Save the recording, selected website contexts,
								and MCP configuration in Playground.
							</Muted>
						</div>
					</Label>
					<Label
						htmlFor={appDestinationId}
						className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${savingToApp ? "border-primary bg-accent" : "border-border"}`}
					>
						<RadioGroupItem
							id={appDestinationId}
							value="playground-and-app"
							disabled={disabled}
							className="mt-0.5"
						/>
						<div className="min-w-0 flex-1">
							<Muted className="block text-foreground">
								Playground and app
							</Muted>
							<Muted className="mt-1 block">
								Save everything in Playground and also save the
								recording and playback tool in the selected app.
							</Muted>
							<div className="mt-3">
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
							</div>
						</div>
					</Label>
				</RadioGroup>
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
