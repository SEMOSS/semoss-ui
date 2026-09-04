import { ChevronRightIcon, InfoIcon, PencilIcon } from "lucide-react";
import { Link } from "react-router";
import { InsightProvider } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft, NavbarRight } from "@/components/shared";
import { NotebookViewWorkbench } from "@/components/workbench";
import { WorkbenchProvider } from "@/contexts";
import { usePage, useProject } from "@/hooks";

/**
 * Read-only surface for a NOTEBOOK project. Owns the insight (bound to the
 * project so pixels run in its context) and its own workbench store, kept
 * separate from the editable workbench's.
 */
export const ViewNotebookPage = () => {
	const { project, catalog, permission } = useProject();

	usePage({
		showNavbarLogo: false,
	});

	return (
		<InsightProvider options={{ app: project.project_id }}>
			<WorkbenchProvider id={`${project.project_id}-view`}>
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
								<BreadcrumbPage
									title={
										project.project_display_name ||
										project.project_name
									}
								>
									{project.project_display_name ||
										project.project_name}
								</BreadcrumbPage>
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
								data-testid={"settings"}
								asChild
							>
								<Link to={`..`}>
									<InfoIcon className="size-4" />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Settings</TooltipContent>
					</Tooltip>
					{(permission === "OWNER" || permission === "EDIT") && (
						<Button
							variant="default"
							size="sm"
							data-testid={"viewNotebookPage-edit-btn"}
							asChild
						>
							<Link to={`../edit`}>
								<PencilIcon className="mr-1 size-4" />
								Edit
							</Link>
						</Button>
					)}
				</NavbarRight>
				<NotebookViewWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	);
};
