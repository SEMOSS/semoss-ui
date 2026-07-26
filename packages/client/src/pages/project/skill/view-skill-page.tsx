// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { ChevronRightIcon, InfoIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import type { FileItem } from "@semoss/shared";
import { FileExplorer } from "@semoss/shared";
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
import { NavbarHeader, NavbarLeft, NavbarRight } from "@/components/shared";
import { SkillFileViewer } from "@/components/skill";
import { usePage, useProject, useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";

const PUBLIC_ROOT_PATH = "/public";

export const ViewSkillPage = observer(() => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const { project, catalog } = useProject();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const hasAutoSelectedRef = useRef(false);

	usePage({
		showNavbarLogo: false,
	});

	useEffect(() => {
		// clear out the old workspace/selection
		setWorkspace(null);
		setSelectedPath(null);
		hasAutoSelectedRef.current = false;

		configStore
			.createWorkspace(project.project_id)
			.then((loadedWorkspace) => {
				setWorkspace(loadedWorkspace);
			})
			.catch((e) => {
				toast.error(e.message);
				navigate("/");
			});
	}, [project.project_id]);

	/**
	 * Auto-select SKILL.md the first time the /public root finishes loading
	 */
	const handleVisibleItemsChange = (payload: {
		path: string;
		items: FileItem[];
	}) => {
		if (hasAutoSelectedRef.current) {
			return;
		}
		if (payload.path !== PUBLIC_ROOT_PATH) {
			return;
		}

		const skillMd = payload.items.find(
			(item) => item.type !== "directory" && item.name === "SKILL.md",
		);
		if (skillMd) {
			hasAutoSelectedRef.current = true;
			setSelectedPath(skillMd.path);
		}
	};

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
				{(workspace.role === "OWNER" || workspace.role === "EDIT") && (
					<Button
						variant="default"
						size="sm"
						data-testid={"viewSkillPage-edit-btn"}
						asChild
					>
						<Link to={`../edit`}>
							<PencilIcon className="mr-1 size-4" />
							Edit
						</Link>
					</Button>
				)}
			</NavbarRight>
			<div className="w-full pb-2">
				<InsightProvider
					options={{ insightId: workspace.insightId }}
					destroyOnUnmount={false}
				>
					<div className="mb-6 max-h-[35vh] overflow-auto rounded-md border border-border">
						<FileExplorer
							mode={{
								type: "APP",
								app: project.project_id,
							}}
							initialPath={PUBLIC_ROOT_PATH}
							readOnly
							onItemSelect={(item) => setSelectedPath(item.path)}
							onVisibleItemsChange={handleVisibleItemsChange}
						/>
					</div>
					<SkillFileViewer
						projectId={project.project_id}
						insightId={workspace.insightId}
						path={selectedPath}
					/>
				</InsightProvider>
			</div>
		</>
	);
});
