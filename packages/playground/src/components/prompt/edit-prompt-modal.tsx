import type React from "react";
import { useEffect, useId, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { Prompt } from "@/components/prompt/prompt-grid";

interface EditPromptModalProps {
	prompt: Prompt;
	open: boolean;
	onClose: () => void;
	onSave: (prompt: Prompt) => void;
	isNewPrompt: boolean;
}

export const EditPromptModal = ({
	prompt,
	open,
	onClose,
	onSave,
	isNewPrompt = false,
}: EditPromptModalProps) => {
	const [editedPrompt, setEditedPrompt] = useState<Prompt>({ ...prompt });

	useEffect(() => {
		setEditedPrompt({ ...prompt });
	}, [prompt]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setEditedPrompt((prev) => ({ ...prev, [name]: value }));
	};

	// This function sanitizes a string by removing trailing backslashes and whitespace
	const sanitizeString = (str: string): string => {
		let sanitized = str.trim();
		while (sanitized.endsWith("\\")) {
			sanitized = sanitized.slice(0, -1).trim();
		}
		return sanitized;
	};

	// This function handles the form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const sanitizedPrompt: Prompt = {
			...editedPrompt,
			INTENT: sanitizeString(editedPrompt.INTENT),
			TITLE: sanitizeString(editedPrompt.TITLE),
		};

		onSave(sanitizedPrompt);
	};

	const contentId = useId();

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-label={isNewPrompt ? "Create New Prompt" : "Edit Prompt"}
			onMouseDown={(e) => {
				// close on backdrop click
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="w-full max-w-3xl rounded-lg border border-border bg-background shadow-lg">
				<form onSubmit={handleSubmit}>
					<div className="border-border border-b px-4 py-3">
						<div className="font-semibold text-lg">
							{isNewPrompt ? "Create New Prompt" : "Edit Prompt"}
						</div>
					</div>

					<div className="px-4 py-4">
						<div className="flex flex-col gap-2">
							<label
								className="font-medium text-sm"
								htmlFor="name"
							>
								Name
							</label>
							<input
								id={contentId}
								name="name"
								value={editedPrompt.TITLE}
								onChange={handleChange}
								required
								className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
							/>

							<label
								className="mt-4 font-medium text-sm"
								htmlFor="content"
							>
								Prompt Content
							</label>
							<textarea
								id={contentId}
								name="content"
								value={editedPrompt.INTENT}
								onChange={handleChange}
								required
								rows={8}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2 border-border border-t px-4 py-3">
						<Button type="button" variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" variant="default">
							{isNewPrompt ? "Create" : "Save Changes"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
