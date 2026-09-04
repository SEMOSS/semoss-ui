// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { ChevronRightIcon, InfoIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
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
import { NavbarHeader, NavbarLeft, NavbarRight } from "@/components/shared";
import { SkillPublicFiles } from "@/components/skill";
import { usePage, useProject, useRootStore } from "@/hooks";

export const ViewSkillPage = observer(() => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const { project, catalog, permission } = useProject();

	const [insightId, setInsightId] = useState<string | null>(null);

	usePage({
		showNavbarLogo: false,
	});

	useEffect(() => {
		// clear out the old insight; SkillPublicFiles is keyed on the project,
		// so its own selection resets with it
		setInsightId(null);

		configStore
			.createProjectInsight(project)
			.then((loadedInsightId) => {
				setInsightId(loadedInsightId);
			})
			.catch((e) => {
				toast.error(e.message);
				navigate("/");
			});
	}, [project.project_id]);

	if (!insightId || !project.project_id) {
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
					options={{ insightId: insightId }}
					destroyOnUnmount={false}
				>
					<SkillPublicFiles
						key={project.project_id}
						projectId={project.project_id}
						insightId={insightId}
					/>
				</InsightProvider>
			</div>
		</>
	);
});
