import { Check, ImagePlus } from "lucide-react";
import type { RefObject } from "react";
import { Button, cn, FormInput, FormTextarea, Spinner } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { agentIcons } from "@/components/common/agent-icons";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent, AgentIcon, AgentTone } from "@/types/agent";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;

export function ProfileSettingsView({
	agent,
	shownAgent,
	savedAgent,
	readingPhoto,
	photo,
	avatarInput,
	onChoosePhoto,
	onRemovePhoto,
	onUpdate,
}: {
	agent: Agent;
	shownAgent: Agent;
	savedAgent: boolean;
	readingPhoto: boolean;
	photo: string | null;
	avatarInput: RefObject<HTMLInputElement | null>;
	onChoosePhoto: (file: File) => void;
	onRemovePhoto: () => void;
	onUpdate: UpdateAgent;
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
			<FormSection title="Or choose an identity icon">
				<div className="flex flex-wrap items-center gap-2">
					{(Object.keys(agentIcons) as AgentIcon[]).map((icon) => {
						const Icon = agentIcons[icon];
						return (
							<Button
								type="button"
								key={icon}
								aria-label={`${icon} identity`}
								variant={
									agent.icon === icon && !agent.avatar
										? "default"
										: "outline"
								}
								size="icon-lg"
								onClick={() => {
									onUpdate("icon", icon);
									onUpdate("avatar", "");
								}}
							>
								<Icon />
							</Button>
						);
					})}
					<span className="mx-2 h-6 border-l" />
					{(["green", "teal", "blue", "amber"] as AgentTone[]).map(
						(tone) => (
							<button
								type="button"
								key={tone}
								aria-label={`${tone} identity color`}
								aria-pressed={agent.tone === tone}
								onClick={() => onUpdate("tone", tone)}
								className={cn(
									"flex size-6 items-center justify-center rounded-full border-2 border-background ring-1",
									tone === "green"
										? "bg-chart-1"
										: tone === "teal"
											? "bg-chart-2"
											: tone === "blue"
												? "bg-chart-3"
												: "bg-chart-4",
									agent.tone === tone
										? "ring-ring"
										: "ring-border",
								)}
							>
								{agent.tone === tone && (
									<Check className="size-3 text-background" />
								)}
							</button>
						),
					)}
				</div>
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
