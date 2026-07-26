import { ChevronRightIcon } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { DatabaseWorkbench } from "@/components/workbench";
import { useEngine } from "@/hooks";

export const EngineDatabaseWorkbenchPage = () => {
	const { engine, permission, catalog } = useEngine();

	if (permission === "DISCOVERABLE") {
		return <Navigate to={`${catalog.path}/${engine.engine_id}`} replace />;
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
							<BreadcrumbLink asChild>
								<Link
									to={`${catalog.path}/${engine.engine_id}`}
								>
									{engine.engine_display_name ||
										engine.engine_name}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRightIcon />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>Workbench</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</NavbarLeft>
			<InsightProvider>
				<DatabaseWorkbench />
			</InsightProvider>
		</>
	);
};
