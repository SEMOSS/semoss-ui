import { ChevronRight, UploadIcon } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
	type MCPConfig,
	MCPSelector,
	PromptSelector,
	type SkillConfig,
	SkillSelector,
} from "@semoss/shared";
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
	Muted,
	P,
	Progress,
	Separator,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";

type CreateAgentForm = {
	name: string;
	description: string;
	instructions: string;
	knowledge: MCPConfig[];
	toolboxes: MCPConfig[];
	skills: SkillConfig[];
	prompts: string[];
};

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
	} = useForm<CreateAgentForm>({
		mode: "onChange",
		defaultValues: {
			name: "",
			description: "",
			instructions: "",
			knowledge: [],
			toolboxes: [],
			skills: [],
			prompts: [],
		},
	});

	const navigateAgent = (appId: string) => {
		if (!appId) return;
		navigate(`/agent/${appId}/edit`);
	};

	const onSubmit = async (data: CreateAgentForm) => {
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
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../">Agent Catalog</Link>
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
			</NavbarLeft>
			<div className="flex flex-col gap-1">
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
					{/* About Section */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									About
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Basic information about your agent
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
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
											<FieldLabel
												htmlFor={instructionsId}
											>
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
							</div>
						</div>
						<Separator />
					</div>

					{/* Knowledge Section */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Knowledge
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add knowledge sources for your agent
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
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
							</div>
						</div>
						<Separator />
					</div>

					{/* Toolboxes Section */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Toolboxes
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add tools and capabilities to your agent
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
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
							</div>
						</div>
						<Separator />
					</div>

					{/* Skills Section */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Skills
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add reusable skills to your agent
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
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
							</div>
						</div>
						<Separator />
					</div>

					{/* Prompts Section */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Prompts
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Pre-configured prompts for your agent
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
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
							</div>
						</div>
						<Separator />
					</div>

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
