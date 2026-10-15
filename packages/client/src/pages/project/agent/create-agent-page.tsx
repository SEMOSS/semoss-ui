import { ChevronRight, UploadIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	AGENT_FORM_DEFAULT_VALUES,
	type AgentDefaultTool,
	AgentForm,
	type AgentFormValues,
	agentNeedsFollowUpEdit,
	buildAddWorkspacePixel,
	buildEditWorkspacePixel,
	getWorkspaceSaveWarning,
} from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	H4,
	P,
	Progress,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useSession } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { CLIENT_AGENT_LINKS } from "@/utility";

export const CreateAgentPage = () => {
	const { t } = useTranslation("agent");
	const navigate = useNavigate();
	const runPixel = useSession((state) => state.runPixel);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formValues, setFormValues] = useState<AgentFormValues>(
		AGENT_FORM_DEFAULT_VALUES,
	);

	// The built-in tool catalog and hook kinds are deployment-level, so they
	// are available before the agent exists
	const formOptions = usePixel<{
		default_tools?: AgentDefaultTool[];
		known_hook_kinds?: string[];
	}>("GetAgentFormOptions();");

	const navigateAgent = (appId: string) => {
		if (!appId) return;
		navigate(`/agent/${appId}/edit`);
	};

	const onCreate = async () => {
		if (isLoading || !formValues.name.trim()) return;
		try {
			setIsLoading(true);

			const { errors, pixelReturn } = await runPixel<[string]>(
				buildAddWorkspacePixel(formValues),
			);

			if (errors.length > 0) throw new Error(errors.join(","));

			const agentId = pixelReturn[0].output;
			if (!agentId) throw new Error("Error creating agent");

			// AddWorkspace only takes the basics; save everything else once the
			// agent exists
			if (agentNeedsFollowUpEdit(formValues)) {
				const {
					errors: settingsErrors,
					pixelReturn: settingsPixelReturn,
				} = await runPixel<[unknown]>(
					buildEditWorkspacePixel(agentId, formValues),
				);
				if (settingsErrors.length > 0) {
					console.error(settingsErrors.join(","));
					toast.error(t("form.createSettingsFailed"));
				} else {
					const warning = getWorkspaceSaveWarning(
						settingsPixelReturn[0]?.output,
					);
					if (warning) toast.warning(warning);
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
					agents, equipping them with knowledge, tools, skills, and
					guidance so they can act reliably and intelligently across
					your most critical workflows.
				</P>

				{formOptions.status === "INITIAL" ||
				formOptions.status === "LOADING" ? (
					<div className="flex w-full items-center justify-center py-12">
						<Spinner />
					</div>
				) : (
					<AgentForm
						data={AGENT_FORM_DEFAULT_VALUES}
						onChange={setFormValues}
						disabled={isLoading}
						knownHookKinds={
							formOptions.data?.known_hook_kinds ?? []
						}
						defaultTools={formOptions.data?.default_tools ?? []}
						links={CLIENT_AGENT_LINKS}
						showName
						className="px-0"
					/>
				)}

				<div className="flex justify-end">
					<Button
						type="button"
						onClick={onCreate}
						disabled={!formValues.name.trim() || isLoading}
						className="w-full sm:w-auto"
					>
						Create
					</Button>
				</div>
				{isLoading && <Progress className="h-1" />}
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
