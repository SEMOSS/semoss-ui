import { ImagePlus } from "lucide-react";
import { useId, useRef } from "react";
import { CATALOG_IMAGE_ACCEPT } from "@semoss/sdk";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FormField,
	FormInput,
	FormTextarea,
	Input,
	Muted,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent } from "@/types/agent";

interface ProfileSettingsViewProps {
	/** Draft identity, including a temporary preview URL when a file is selected. */
	shownAgent: Agent;
	/** Image waiting to be uploaded when settings are saved. */
	selectedImage: File | null;
	/** Whether the saved photo will be removed on submission. */
	isRemovingImage: boolean;
	/** Stages a selected file in the form. */
	onChoosePhoto: (file: File) => void;
	/** Clears a selected file or stages removal of the saved photo. */
	onRemovePhoto: () => void;
}

/** Edit the agent's identity and stage photo changes with the rest of its settings. */
export function ProfileSettingsView({
	shownAgent,
	selectedImage,
	isRemovingImage,
	onChoosePhoto,
	onRemovePhoto,
}: ProfileSettingsViewProps) {
	const avatarInput = useRef<HTMLInputElement>(null);
	const chooseButton = useRef<HTMLButtonElement>(null);
	const photoId = useId();
	const descriptionId = `${photoId}-description`;
	const errorId = `${photoId}-error`;
	return (
		<div className="space-y-6">
			<FormSection
				title="Meet your agent"
				description="A familiar identity for every conversation."
			>
				<div className="mb-6 flex min-w-0 items-start gap-4">
					<AgentAvatar agent={shownAgent} size="lg" />
					<FormField
						name="image"
						render={({ field, fieldState }) => (
							<Field
								className="min-w-0 gap-2"
								data-invalid={fieldState.invalid}
							>
								<div className="flex flex-wrap gap-2">
									<Button
										ref={(element) => {
											field.ref(element);
											chooseButton.current = element;
										}}
										type="button"
										variant="outline"
										className="min-h-11"
										aria-invalid={fieldState.invalid}
										aria-describedby={`${descriptionId}${fieldState.error ? ` ${errorId}` : ""}`}
										onBlur={field.onBlur}
										onClick={() =>
											avatarInput.current?.click()
										}
									>
										<ImagePlus aria-hidden="true" />
										Choose photo
									</Button>
									{(selectedImage || shownAgent.avatar) && (
										<Button
											type="button"
											variant="ghost"
											className="min-h-11"
											onClick={() => {
												onRemovePhoto();
												chooseButton.current?.focus();
											}}
										>
											Remove photo
										</Button>
									)}
								</div>
								<FieldDescription
									id={descriptionId}
									className="text-base"
								>
									PNG, JPEG, or GIF · Up to 10 MiB. Your photo
									is saved with the agent.
								</FieldDescription>
								<Input
									ref={avatarInput}
									className="hidden"
									type="file"
									name={field.name}
									accept={CATALOG_IMAGE_ACCEPT}
									aria-label="Choose agent identity image"
									onChange={(event) => {
										const file = event.target.files?.[0];
										event.target.value = "";
										if (file) onChoosePhoto(file);
									}}
								/>
								<output>
									<Muted className="break-all text-base">
										{selectedImage && !fieldState.error
											? `Selected: ${selectedImage.name}`
											: isRemovingImage
												? "The photo will be removed when you save."
												: ""}
									</Muted>
								</output>
								{fieldState.error && (
									<FieldError id={errorId}>
										{fieldState.error.message}
									</FieldError>
								)}
							</Field>
						)}
					/>
				</div>
				<FormInput
					name="name"
					label="Name (required)"
					placeholder="e.g. Ryan Agent"
					maxLength={60}
					required
				/>
			</FormSection>
			<FormSection title="Operating instructions">
				<FormTextarea
					name="instructions"
					label="Instructions"
					description="Agent defaults. Individual sessions can begin with their own context."
					rows={5}
					maxLength={8000}
				/>
			</FormSection>
		</div>
	);
}
