import { ChevronRightIcon } from "lucide-react";
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
} from "@semoss/ui/next";
import { useProject } from "@/hooks";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";

interface ProjectNavbarProps {
	/** Actions to render on the right side of the navbar */
	actions?: React.ReactNode;
}

export const ProjectNavbar: React.FC<ProjectNavbarProps> = observer(
	({ actions }) => {
		const { catalog, project } = useProject();

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
				<NavbarRight>{actions}</NavbarRight>
			</>
		);
	},
);
