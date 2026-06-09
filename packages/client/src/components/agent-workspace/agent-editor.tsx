import { SaveIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type MCPConfig, MCPSelector, PromptSelector } from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	H4,
	Input,
	Muted,
	Separator,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore, useWorkspace } from "@/hooks";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";

type AgentForm = {
	name: string;
	description: string;
	instructions: string;
	knowledge: MCPConfig[];
	toolboxes: MCPConfig[];
	prompts: string[];
};

type GetWorkspaceResponse = {
	name: string;
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	prompts: { id: string; name: string; type: string }[];
};

export const AgentEditor = () => {
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(true);

	const descId = useId();
	const instructionsId = useId();

	const { control, handleSubmit, reset } = useForm<AgentForm>({
		defaultValues: {
			name: "",
			description: "",
			instructions: "",
			knowledge: [],
			toolboxes: [],
			prompts: [],
		},
	});

	useEffect(() => {
		const load = async () => {
			try {
				setIsFetching(true);
				const { errors, pixelReturn } = await monolithStore.runQuery<
					[GetWorkspaceResponse]
				>(`GetWorkspace(workspaceId=["${workspace.appId}"]);`);
				if (errors.length > 0) throw new Error(errors.join(", "));
				const data = pixelReturn[0].output;
				const allMcps = data.mcp ?? [];
				reset({
					name: data.name ?? "",
					description: data.description ?? "",
					instructions: data.system_prompt ?? "",
					knowledge: allMcps.filter((m) => m.type === "VECTOR"),
					toolboxes: allMcps.filter((m) => m.type !== "VECTOR"),
					prompts: (data.prompts ?? []).map((p) => p.id),
				});
			} catch (e) {
				console.error(e);
				toast.error("Failed to load agent data");
			} finally {
				setIsFetching(false);
			}
		};
		if (workspace.appId) load();
	}, [workspace.appId, monolithStore, reset]);

	const onSave = handleSubmit(async (data) => {
		try {
			setIsLoading(true);
			const mcp = [...data.knowledge, ...data.toolboxes];
			const { errors } = await monolithStore.runQuery(
				`EditWorkspace(workspaceId=["${workspace.appId}"], name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.instructions)}, mcp=${JSON.stringify(mcp)}, prompts=${JSON.stringify(data.prompts)});`,
			);
			if (errors.length > 0) throw new Error(errors.join(", "));
			toast.success("Agent saved");
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Failed to save agent");
		} finally {
			setIsLoading(false);
		}
	});

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Toolbar */}
			<div className="flex w-full shrink-0 items-center justify-end gap-1 border-border border-b px-1.5 py-0.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							disabled={isLoading || isFetching}
							onClick={onSave}
						>
							{isLoading ? (
								<Spinner className="size-3" />
							) : (
								<SaveIcon className="size-3" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>Save</TooltipContent>
				</Tooltip>
			</div>

			{/* Form */}
			<div className="flex-1 overflow-y-auto">
				{isFetching ? (
					<div className="flex h-full items-center justify-center">
						<Spinner />
					</div>
				) : (
					<form
						className="flex w-full flex-col gap-6 px-6 py-6"
						onSubmit={onSave}
						autoComplete="off"
					>
						{/* About */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									About
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Basic information about your agent
								</Muted>
							</div>
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
						</div>

						<Separator />

						{/* Knowledge */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Knowledge
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add knowledge sources for your agent
								</Muted>
							</div>
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
										workspaceId={workspace.appId}
									/>
								)}
							/>
						</div>

						<Separator />

						{/* Toolboxes */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Toolboxes
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add tools and capabilities to your agent
								</Muted>
							</div>
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
										workspaceId={workspace.appId}
									/>
								)}
							/>
						</div>

						<Separator />

						{/* Prompts */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Prompts
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Pre-configured prompts for your agent
								</Muted>
							</div>
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
					</form>
				)}
			</div>
		</div>
	);
};
