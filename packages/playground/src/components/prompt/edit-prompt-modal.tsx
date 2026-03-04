import type React from "react";
import { useEffect, useId, useState } from "react";
import { Button } from "@semoss/ui/next";
import { ChipsInput } from "@/components/prompt/chips-input";
import type { Prompt } from "@/types/prompt";
import { useTranslation } from "@semoss/i18n";

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
	const { t } = useTranslation(["prompt-library", "common"]);
	const [editedPrompt, setEditedPrompt] = useState<Prompt>({ ...prompt });
	const [isBeingEdited, setIsBeingEdited] = useState(false);

	useEffect(() => {
		if (!open) {
			setIsBeingEdited(false);
			return;
		}
		if (isBeingEdited) return;
		setEditedPrompt({ ...prompt });
	}, [open, prompt, isBeingEdited]);

	const sanitizeString = (str: string): string => {
		let sanitized = String(str ?? "").trim();
		while (sanitized.endsWith("\\"))
			sanitized = sanitized.slice(0, -1).trim();
		return sanitized;
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setIsBeingEdited(true);
		setEditedPrompt((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const sanitizedPrompt: Prompt = {
			id: String(editedPrompt.id ?? ""),
			title: sanitizeString(String(editedPrompt.title ?? "")),
			context: sanitizeString(String(editedPrompt.context ?? "")),
			intent: sanitizeString(String(editedPrompt.intent ?? "")),
			version: Number(editedPrompt.version ?? 0),

			createdBy: String(editedPrompt.createdBy ?? ""),
			dateCreated: editedPrompt.dateCreated as any, // keep your existing Prompt typing/shape

			global: Boolean(editedPrompt.global ?? false),
			tags: Array.isArray(editedPrompt.tags) ? editedPrompt.tags : [],
			metaMap: (editedPrompt.metaMap ?? {}) as any,
		};

		onSave(sanitizedPrompt);
	};

	const nameId = useId();
	const contentId = useId();
	const tagsId = useId();

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-label={isNewPrompt ? "Create New Prompt" : "Edit Prompt"}
			onMouseDown={(e) => {
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
								htmlFor={nameId}
							>
								{t("promptLibrary:details.name")}
							</label>
							<input
								id={nameId}
								name="title"
								value={editedPrompt.title ?? ""}
								onChange={handleChange}
								required
								className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
							/>

							<label
								className="mt-4 font-medium text-sm"
								htmlFor={contentId}
							>
								{t("promptLibrary:details.description")}
							</label>
							<textarea
								id={contentId}
								name="context"
								value={editedPrompt.context ?? ""}
								onChange={handleChange}
								required
								rows={8}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
							/>
							<label
								className="mt-4 font-medium text-sm"
								htmlFor={tagsId}
							>
								{t("promptLibrary:details.tags")}
							</label>
							<ChipsInput
								id={tagsId}
								value={editedPrompt.tags || []}
								onChange={(nextTags) => {
									setIsBeingEdited(true);
									setEditedPrompt((prev) => ({
										...prev,
										tags: nextTags,
									}));
								}}
								placeholder={t("promptLibrary:buttons.addTagsPlaceholder")}
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2 border-border border-t px-4 py-3">
						<Button type="button" variant="ghost" onClick={onClose}>
							{t("common:buttons.cancel")}
						</Button>
						<button
							type="submit"
							className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
						>
							{isNewPrompt ? t("common:buttons.create") : t("promptLibrary:buttons.saveChanges")}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
