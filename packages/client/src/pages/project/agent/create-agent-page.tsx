import { ChevronRight, UploadIcon } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { MCPSelector, PromptSelector, SkillSelector } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Field,
	FieldLabel,
	H4,
	Input,
	P,
	Progress,
	Textarea,
	toast,
} from "@semoss/ui/next";
import {
	AGENT_FORM_DEFAULT_VALUES,
	AgentExecutionLimitsFields,
	AgentFormSection,
	type AgentFormValues,
	AgentModelField,
	AgentSubagentsField,
	buildEditWorkspacePixel,
} from "@/components/agent-workspace/agent-form";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";

export const CreateAgentPage = () => {
	const navigate = useNavigate();
	const { monolithStore } = useRootStore();
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const nameId = useId();
	const descId = useId();
	const instructionsId = useId();

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm<AgentFormValues>({
		mode: "onChange",
		defaultValues: AGENT_FORM_DEFAULT_VALUES,
	});

	const navigateAgent = (appId: string) => {
		if (!appId) return;
		navigate(`/agent/${appId}/edit`);
	};

	const onSubmit = async (data: AgentFormValues) => {
		try {
			setIsLoading(true);

			// Combine knowledge and toolboxes into mcp array
			const mcp = [...data.knowledge, ...data.toolboxes];

			const skills = data.skills.map((s) => s.id);

			const { errors, pixelReturn } = await monolithStore.runQuery<
				[string]
			>(
				`AddWorkspace(name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.instructions)}, mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)});`,
			);

			if (errors.length > 0) throw new Error(errors.join(","));

			const agentId = pixelReturn[0].output;
			if (!agentId) throw new Error("Error creating agent");

			// AddWorkspace does not accept a default model, execution limits, or
			// subagents, so set them with a follow-up edit call once the agent
			// exists. buildEditWorkspacePixel resends everything AddWorkspace
			// already saved since EditWorkspace treats omitted mcp/skills/prompts
			// as empty and would otherwise wipe them.
			const hasExecutionSettings =
				data.modelId ||
				data.maxTurns ||
				data.maxSubagentDepth ||
				data.maxSubagentsPerRun ||
				data.maxSpawnsPerTurn ||
				data.subagents.some((s) => s.workspaceId);
			if (hasExecutionSettings) {
				const { errors: settingsErrors } = await monolithStore.runQuery(
					buildEditWorkspacePixel(agentId, data),
				);
				if (settingsErrors.length > 0) {
					console.error(settingsErrors.join(","));
					toast.error(
						"Agent created, but failed to save execution settings",
					);
				}
			}

			navigateAgent(agentId);
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Error creating agent");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-1">
				<Breadcrumb className="mb-4">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../" className="text-inherit">
									Agent Catalog
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>New</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex flex-row items-center justify-between gap-2">
					<H4>New Agent</H4>
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>
				<P className="mb-3 text-muted-foreground">
					In a platform where intelligent automation drives results,
					agents are autonomous workers that turn data into decisions.
					Whether you're a developer, data engineer, or product owner,
					this page helps you configure, orchestrate, and deploy smart
					agents — equipping them with knowledge, tools, skills, and
					guidance so they can act reliably and intelligently across
					your most critical workflows.
				</P>
				<form
					className="my-4 w-full"
					onSubmit={handleSubmit(onSubmit)}
					autoComplete="off"
				>
					<AgentFormSection
						layout="columns"
						title="About"
						description="Basic information about your agent"
					>
						<Controller
							name="name"
							control={control}
							rules={{ required: true }}
							render={({ field }) => (
								<Field>
									<FieldLabel htmlFor={nameId}>
										Name{" "}
										<span className="text-destructive">
											*
										</span>
									</FieldLabel>
									<Input
										id={nameId}
										placeholder="Enter agent name"
										{...field}
									/>
								</Field>
							)}
						/>

						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel htmlFor={descId}>
										Description
									</FieldLabel>
									<Input
										id={descId}
										placeholder="Enter description"
										{...field}
									/>
								</Field>
							)}
						/>

						<Controller
							name="instructions"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel htmlFor={instructionsId}>
										Instructions
									</FieldLabel>
									<Textarea
										id={instructionsId}
										placeholder="Define the agent's behavior, role, and instructions"
										rows={6}
										className="max-h-96"
										{...field}
									/>
								</Field>
							)}
						/>

						<AgentModelField control={control} />
					</AgentFormSection>

					<AgentFormSection
						layout="columns"
						title="Knowledge"
						description="Add knowledge sources for your agent"
					>
						<Controller
							name="knowledge"
							control={control}
							render={({ field }) => (
								<MCPSelector
									type="KNOWLEDGE"
									values={field.value}
									onChange={field.onChange}
									className="h-112"
									enableKnowledgeMCP={true}
									getPlatformUrl={mcpToPlatformUrl}
								/>
							)}
						/>
					</AgentFormSection>

					<AgentFormSection
						layout="columns"
						title="Toolboxes"
						description="Add tools and capabilities to your agent"
					>
						<Controller
							name="toolboxes"
							control={control}
							render={({ field }) => (
								<MCPSelector
									type="TOOLBOX"
									values={field.value}
									onChange={field.onChange}
									className="h-112"
									enableKnowledgeMCP={true}
									getPlatformUrl={mcpToPlatformUrl}
								/>
							)}
						/>
					</AgentFormSection>

					<AgentFormSection
						layout="columns"
						title="Skills"
						description="Add reusable skills to your agent"
					>
						<Controller
							name="skills"
							control={control}
							render={({ field }) => (
								<SkillSelector
									values={field.value}
									onChange={field.onChange}
									className="h-112"
								/>
							)}
						/>
					</AgentFormSection>

					<AgentFormSection
						layout="columns"
						title="Prompts"
						description="Pre-configured prompts for your agent"
					>
						<Controller
							name="prompts"
							control={control}
							render={({ field }) => (
								<PromptSelector
									values={field.value}
									onChange={field.onChange}
									className="h-112"
									getPlatformUrl={promptToPlatformUrl}
								/>
							)}
						/>
					</AgentFormSection>

					<AgentFormSection
						layout="columns"
						title="Subagents"
						description="Select other agents this agent can delegate work to. Tool names and descriptions are generated automatically."
					>
						<AgentSubagentsField control={control} />
					</AgentFormSection>

					<AgentFormSection
						layout="columns"
						title="Execution limits"
						description="Runtime caps for the agent's tool loop and subagent delegation. Leave a field blank to fall back to its default."
					>
						<AgentExecutionLimitsFields control={control} />
					</AgentFormSection>

					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={!isValid || isLoading}
							className="w-full sm:w-auto"
						>
							Create
						</Button>
					</div>
					{isLoading && <Progress className="h-1" />}
				</form>
				{isUploadOpen && (
					<UploadProjectDialog
						type="AGENT"
						open={isUploadOpen}
						handleClose={(appId) => {
							if (appId) navigateAgent(appId);
							setIsUploadOpen(false);
						}}
					/>
				)}
			</div>
		</>
	);
};
