// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { ChevronRightIcon, InfoIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { NotebookViewWorkspace } from "@/components/notebook-workspace";
import { NavbarHeader, NavbarLeft, NavbarRight } from "@/components/shared";
import { WorkspaceContext } from "@/contexts";
import { usePage, useProject, useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";

export const ViewNotebookPage = observer(() => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const { project, catalog, permission } = useProject();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	usePage({
		showNavbarLogo: false,
	});

	useEffect(() => {
		// clear out the old workspace
		setWorkspace(null);

		configStore
			.createWorkspace(project, permission)
			.then((loadedWorkspace) => {
				setWorkspace(loadedWorkspace);
			})
			.catch((e) => {
				toast.error(e.message);
				navigate("/");
			});
	}, [project.project_id]);

	if (!workspace || !project.project_id) {
		return (
			<div className="absolute inset-0 flex flex-1 items-center justify-center">
				<Spinner />
			</div>
		);
	}

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
			<div className="absolute inset-0">
				<WorkspaceContext.Provider value={{ workspace }}>
					<InsightProvider
						options={{ insightId: workspace.insightId }}
						destroyOnUnmount={false}
					>
						<NotebookViewWorkspace />
					</InsightProvider>
				</WorkspaceContext.Provider>
			</div>
		</>
	);
});
