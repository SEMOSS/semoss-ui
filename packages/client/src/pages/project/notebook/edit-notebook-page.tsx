import { ChevronRightIcon, EyeIcon } from "lucide-react";
import { Link, Navigate } from "react-router";
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
import { ProjectShareButton } from "@/components/project";
import { NavbarHeader, NavbarLeft, NavbarRight } from "@/components/shared";
import { NotebookWorkbench } from "@/components/workbench";
import { WorkbenchProvider } from "@/contexts";
import { usePage, useProject } from "@/hooks";

/**
 * Editable surface for a NOTEBOOK project. Owns the insight (bound to the
 * project so pixels run in its context) and the workbench store, then renders
 * the notebook workbench.
 */
export const EditNotebookPage = () => {
	const { project, permission, catalog } = useProject();

	usePage({
		showNavbarLogo: false,
	});

	if (permission === "DISCOVERABLE") {
		return (
			<Navigate to={`${catalog.path}/${project.project_id}`} replace />
		);
	}

	return (
		<InsightProvider options={{ app: project.project_id }}>
			<WorkbenchProvider id={project.project_id}>
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
					<ProjectShareButton />
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								data-testid="editNotebookPage-view-btn"
								asChild
							>
								<Link to="../view">
									<EyeIcon className="size-4" />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>View</TooltipContent>
					</Tooltip>
				</NavbarRight>
				<NotebookWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	);
};
