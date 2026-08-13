import { ChevronRightIcon, Share2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ProjectDetailTabs } from "@/components/project";
import { ShareOverlay } from "@/components/ui";
import { useProject, useWorkspace } from "@/hooks";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";

type ActiveView = "editor" | "settings";

const VIEWS: ActiveView[] = ["editor", "settings"];

/** Same tabs as CodeWorkspace's settings panel — shared config should be centralized if these drift. */
const SETTINGS_TABS: React.ComponentProps<typeof ProjectDetailTabs>["tabs"] = [
	{ name: "Overview", component: "project-overview" },
	{
		name: "MCP",
		component: "mcp-usage",
		restrict: ["OWNER", "EDIT", "READ_ONLY"],
	},
	{ name: "Commits", component: "commits", restrict: ["OWNER", "EDIT"] },
	{ name: "GitHub", component: "github", restrict: ["OWNER"] },
	{ name: "Settings", component: "settings", restrict: ["OWNER"] },
	{
		name: "Access Control",
		component: "access-control",
		restrict: ["OWNER", "EDIT"],
	},
	{ name: "SMSS", component: "smss", restrict: ["OWNER"] },
];

/** Edit-mode wrapper for AUTOMATION app type. Provides hamburger, breadcrumb, share, and an in-page Settings tab backed by ProjectDetailTabs. */
export const AutomationWorkspace = observer(() => {
	const { workspace } = useWorkspace();
	const { catalog, project } = useProject();
	const [shareOpen, setShareOpen] = useState(false);
	const [activeView, setActiveView] = useState<ActiveView>("editor");

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={catalog.path}>
									{catalog.name} Catalog
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRightIcon />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link
									to={`${catalog.path}/${project.project_id}`}
								>
									{project.project_display_name ||
										project.project_name}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRightIcon />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>Edit</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</NavbarLeft>
			<NavbarRight>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShareOpen(true)}
						>
							<Share2 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Share App</TooltipContent>
				</Tooltip>
				<Dialog
					open={shareOpen}
					onOpenChange={(o) => !o && setShareOpen(false)}
				>
					<DialogContent className="max-w-lg p-0">
						<ShareOverlay
							appId={workspace.appId}
							onClose={() => setShareOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</NavbarRight>
			<div className="absolute inset-0 flex flex-col">
				<div className="flex shrink-0 items-center gap-1 border-b px-4">
					{VIEWS.map((view) => (
						<button
							key={view}
							type="button"
							onClick={() => setActiveView(view)}
							className={`-mb-px border-b-2 px-3 py-2 font-medium text-sm transition-colors ${
								activeView === view
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							{view === "editor" ? "Editor" : "Settings"}
						</button>
					))}
				</div>
				<div className="relative flex-1 overflow-hidden">
					{activeView === "editor" ? (
						<iframe
							className="h-full w-full border-none"
							title="Automation Workspace"
							src={`../../automation-workspace/dist/?app=${encodeURIComponent(workspace.appId)}`}
							sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
						/>
					) : (
						<div className="h-full overflow-auto">
							<ProjectDetailTabs tabs={SETTINGS_TABS} />
						</div>
					)}
				</div>
			</div>
		</>
	);
});
