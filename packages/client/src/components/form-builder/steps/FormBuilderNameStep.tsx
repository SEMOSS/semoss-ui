import { useId, useState } from "react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Textarea,
} from "@semoss/ui/next";
import type { FormBuilderState } from "../form-builder.types";

interface FormBuilderNameStepProps {
	state: FormBuilderState;
	onUpdate: (updates: Partial<FormBuilderState>) => void;
}

export const FormBuilderNameStep = ({
	state,
	onUpdate,
}: FormBuilderNameStepProps) => {
	const [tagInput, setTagInput] = useState("");
	const nameId = useId();
	const descId = useId();
	const tagsId = useId();

	const addTag = () => {
		const tag = tagInput.trim();
		if (tag && !state.appTags.includes(tag)) {
			onUpdate({ appTags: [...state.appTags, tag] });
		}
		setTagInput("");
	};

	const removeTag = (tag: string) => {
		onUpdate({ appTags: state.appTags.filter((t) => t !== tag) });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Name & Describe Your App</CardTitle>
				<CardDescription>
					Give your form app a name and description. This information
					will appear in the App Catalog.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<Label htmlFor={nameId}>
						App Name <span className="text-destructive">*</span>
					</Label>
					<Input
						id={nameId}
						placeholder="e.g. Employee Onboarding Forms"
						value={state.appName}
						onChange={(e) => onUpdate({ appName: e.target.value })}
						autoFocus
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor={descId}>Description</Label>
					<Textarea
						id={descId}
						placeholder="Describe what this app does..."
						value={state.appDescription}
						onChange={(e) =>
							onUpdate({ appDescription: e.target.value })
						}
						rows={3}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor={tagsId}>Tags</Label>
					<div className="flex gap-2">
						<Input
							id={tagsId}
							placeholder='Type a tag and press "Add"'
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addTag();
								}
							}}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={addTag}
							disabled={!tagInput.trim()}
						>
							Add
						</Button>
					</div>
					{state.appTags.length > 0 && (
						<div className="flex flex-wrap gap-1 pt-1">
							{state.appTags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground text-xs"
								>
									{tag}
									<button
										type="button"
										className="ml-1 text-muted-foreground hover:text-foreground"
										onClick={() => removeTag(tag)}
									>
										&times;
									</button>
								</span>
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
