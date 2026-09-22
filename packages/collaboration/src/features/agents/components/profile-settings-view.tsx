import { ImagePlus } from "lucide-react";
import type { RefObject } from "react";
import { Button, FormInput, FormTextarea, Spinner } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent } from "@/types/agent";

export function ProfileSettingsView({
	shownAgent,
	savedAgent,
	readingPhoto,
	photo,
	avatarInput,
	onChoosePhoto,
	onRemovePhoto,
}: {
	shownAgent: Agent;
	savedAgent: boolean;
	readingPhoto: boolean;
	photo: string | null;
	avatarInput: RefObject<HTMLInputElement | null>;
	onChoosePhoto: (file: File) => void;
	onRemovePhoto: () => void;
}) {
	return (
		<div className="space-y-7">
			<FormSection
				title="Meet your agent"
				description="A familiar identity for every conversation."
			>
				<div className="mb-6 flex items-center gap-4">
					<AgentAvatar agent={shownAgent} size="lg" />
					<div className="space-y-2">
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={readingPhoto || !savedAgent}
								aria-busy={readingPhoto}
								onClick={() => avatarInput.current?.click()}
							>
								{readingPhoto ? (
									<Spinner
										aria-hidden="true"
										className="motion-reduce:animate-none"
									/>
								) : (
									<ImagePlus />
								)}
								{readingPhoto ? "Uploading..." : "Choose photo"}
							</Button>
							{savedAgent && photo !== "" && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={readingPhoto}
									onClick={onRemovePhoto}
								>
									Remove
								</Button>
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							{savedAgent
								? "PNG, JPEG, GIF or SVG · Up to 2 MB"
								: "Save this agent before adding a photo."}
						</p>
						<input
							ref={avatarInput}
							className="hidden"
							type="file"
							accept="image/png,image/jpeg,image/gif,image/svg+xml"
							aria-label="Choose agent identity image"
							onChange={(event) => {
								const file = event.target.files?.[0];
								event.target.value = "";
								if (file) onChoosePhoto(file);
							}}
						/>
					</div>
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
