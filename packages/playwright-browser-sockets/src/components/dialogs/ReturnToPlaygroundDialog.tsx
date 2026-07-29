import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
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
