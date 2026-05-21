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
import { MCPSelector, NewKnowledgeOverlay, PromptSelector } from "@/components";
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
	const promptsId = useId();

	/**
	 * State
	 */
	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [prompts, setPrompts] = useState<string[]>([]);
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
		setPrompts(
			Array.isArray(values?.prompts)
				? values.prompts.map((p) => (typeof p === "string" ? p : p.id))
				: [],
		);
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
				prompts: prompts,
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
						className="max-h-64 overflow-y-auto"
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

					<div className="flex h-[420px] w-full flex-col">
						<MCPSelector
							type="KNOWLEDGE"
							values={knowledge}
							disabled={isLoading}
							onChange={(knowledge) => setKnowledge(knowledge)}
							onRequestCreateKnowledge={() =>
								setIsKnowledgeOverlayOpen(true)
							}
						/>
					</div>

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
					<div className="flex h-[420px] w-full flex-col">
						<MCPSelector
							type="TOOLBOX"
							values={toolbox}
							disabled={isLoading}
							onChange={(mcps) => setToolbox(mcps)}
						/>
					</div>
				</Field>
				<Field>
					<FieldLabel htmlFor={promptsId}>
						{t("workspace:form.promptsLabel")}
					</FieldLabel>
					<PromptSelector
						values={prompts}
						disabled={isLoading}
						onChange={(values) => setPrompts(values)}
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
