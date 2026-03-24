import { useEffect, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	Input,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { MCPSelector, NewKnowledgeOverlay } from "@/components";
import { useChat } from "@/hooks";
import type { MCPConfig, Workspace } from "@/types";

interface WorkspaceFormProps {
	/**
	 * is it creating a new workspace or editing an existing one
	 */
	isNew: boolean;

	/** Workspace data for editing (optional) */
	values?: Partial<Workspace>;

	/** Callback that is fired when the form is closed or submitted. If it is successful, it will return an id */
	onClose: (workspaceId?: string) => void;
}

export const WorkspaceForm: React.FC<WorkspaceFormProps> = ({
	isNew,
	values,
	onClose,
}) => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);

	/**
	 * IDs
	 */
	const nameId = useId();
	const descriptionId = useId();
	const instructionId = useId();
	const promptLibraryTagId = useId();

	/**
	 * State
	 */
	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [promptLibraryTag, setPromptLibraryTag] = useState<string>("");
	const [tagInput, setTagInput] = useState<string>("");
	const [instructions, setInstructions] = useState<string>("");
	const [toolbox, setToolbox] = useState<MCPConfig[]>([]);
	const [knowledge, setKnowledge] = useState<MCPConfig[]>([]);

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isKnowledgeOverlayOpen, setIsKnowledgeOverlayOpen] = useState(false);

	/**
	 * Library Hooks
	 */
	const { chat } = useChat();

	// Initialize form data from workspace prop
	useEffect(() => {
		setName(values?.name || "");
		setDescription(values?.description || "");
		setPromptLibraryTag(values?.prompt_library_tag || "");
		setInstructions(values?.system_prompt || "");
		setKnowledge(values?.mcp.filter((mcp) => mcp.type === "VECTOR") || []);
		setToolbox(values?.mcp.filter((mcp) => mcp.type !== "VECTOR") || []);
	}, [values]);

	/**
	 * Method that is called to create or update the workspace
	 */
	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// start the loading screen
			setIsLoading(true);

			const updated: Omit<Workspace, "workspace_id" | "date_created"> = {
				name: name,
				system_prompt: instructions,
				description: description,
				prompt_library_tag: promptLibraryTag,
				mcp: [...toolbox, ...knowledge],
			};

			let output = "";
			if (isNew) {
				output = await chat.addWorkspace(updated);
			} else {
				output = await chat.editWorkspace(values.workspace_id, updated);
			}

			// get new app id and return in the onclose
			onClose(output);
		} catch (e) {
			console.error(e);

			toast.error(
				e instanceof Error
					? e.message
					: t("notifications:workspace.saveError"),
			);
		} finally {
			// stop the loading screen
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={nameId}>
						{t("workspace:form.nameLabel")}
					</FieldLabel>
					<Input
						id={nameId}
						placeholder={t("common:placeholders.enterName")}
						value={name}
						disabled={isLoading}
						onChange={(e) => setName(e.target.value)}
						data-testid="workspaceForm-textField-name"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor={descriptionId}>
						{t("workspace:form.descriptionLabel")}
					</FieldLabel>
					<Input
						id={descriptionId}
						placeholder={t("common:placeholders.enterDescription")}
						value={description}
						disabled={isLoading}
						onChange={(e) => setDescription(e.target.value)}
						data-testid="workspaceForm-description-txt"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor={promptLibraryTagId}>
						{t("workspace:form.promptLibraryTagLabel")}
					</FieldLabel>
					{promptLibraryTag ? (
						<div className="flex flex-wrap gap-2">
							<span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm">
								{promptLibraryTag}
								<button
									type="button"
									onClick={() => setPromptLibraryTag("")}
									className="text-muted-foreground hover:text-foreground"
								>
									×
								</button>
							</span>
						</div>
					) : (
						<Input
							id={promptLibraryTagId}
							placeholder={t(
								"common:placeholders.enterPromptLibraryTag",
							)}
							value={tagInput}
							disabled={isLoading}
							onChange={(e) => setTagInput(e.target.value)}
							data-testid="workspaceForm-promptLibraryTag-txt"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									const value = tagInput.trim();
									if (value) {
										setPromptLibraryTag(value);
										setTagInput("");
									}
								}
							}}
						/>
					)}
				</Field>
			</FieldGroup>
			<FieldSeparator />
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={instructionId}>
						{t("workspace:form.instructionsLabel")}
					</FieldLabel>
					<Textarea
						id={instructionId}
						placeholder={t("common:placeholders.enterInstructions")}
						value={instructions.replace(/\\n/g, "\n")}
						onChange={(e) => setInstructions(e.target.value)}
						rows={4}
						data-testid="workspaceForm-system_prompt-txt"
					/>
				</Field>
				<Field>
					<FieldLabel
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();

							setIsKnowledgeOverlayOpen(true);
						}}
					>
						<div className="flex-1">
							{t("workspace:form.knowledgeLabel")}
						</div>
					</FieldLabel>

					<MCPSelector
						type="KNOWLEDGE"
						values={knowledge}
						disabled={isLoading}
						onChange={(knowledge) => setKnowledge(knowledge)}
					/>

					<NewKnowledgeOverlay
						open={isKnowledgeOverlayOpen}
						onClose={(knowledge) => {
							// update it
							if (knowledge) {
								setKnowledge((prev) => [...prev, knowledge]);
							}

							setIsKnowledgeOverlayOpen(false);
						}}
					/>
				</Field>
				<Field>
					<FieldLabel>{t("workspace:form.toolboxLabel")}</FieldLabel>
					<MCPSelector
						type="TOOLBOX"
						values={toolbox}
						disabled={isLoading}
						onChange={(mcps) => setToolbox(mcps)}
					/>
				</Field>
			</FieldGroup>
			<div className="flex items-center justify-between">
				<Button variant="ghost" onClick={() => onClose()}>
					{t("common:buttons.back")}
				</Button>
				<Button
					disabled={isLoading || !name}
					data-testid="workspaceForm-submit-btn"
					type="submit"
				>
					{isNew
						? t("workspace:actions.create")
						: t("workspace:actions.save")}
				</Button>
			</div>
		</form>
	);
};
