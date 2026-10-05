import { ChevronRightIcon, ExternalLink } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { Link } from "react-router";
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
import { useProject } from "@/hooks/use-project";
import { NavbarHeader } from "../shared/navbar-header";
import { NavbarLeft } from "../shared/navbar-left";
import { NavbarRight } from "../shared/navbar-right";

interface ProjectNavbarProps {
	/** Actions to render on the right side of the navbar */
	actions?: React.ReactNode;
}

export const ProjectNavbar: React.FC<ProjectNavbarProps> = observer(
	({ actions }) => {
		const { catalog, project, type } = useProject();
		const isApp = type === "BLOCKS" || type === "CODE";

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
					{actions}
					{isApp && (
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<Button
									aria-label={
										"Open app in view mode (new tab)"
									}
									variant="outline"
									size="sm"
									asChild
								>
									<Link
										to={`${catalog.path}/${encodeURIComponent(project.project_id)}/view`}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Open app in view mode (opens in a new tab)"
									>
										<ExternalLink
											className="size-4"
											aria-hidden="true"
										/>
										Open
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								Open app in view mode (new tab)
							</TooltipContent>
						</Tooltip>
					)}
				</NavbarRight>
			</>
		);
	},
);
