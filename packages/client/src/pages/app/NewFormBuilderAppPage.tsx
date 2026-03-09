import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	H2,
} from "@semoss/ui/next";
import { FormBuilder } from "@/components/form-builder";
import { NavbarHeader, NavbarLeft } from "@/components/shared";

export const NewFormBuilderAppPage = () => {
	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col items-start gap-4 p-4">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/app" className="text-inherit">
									App Catalog
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/app/new" className="text-inherit">
									New
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>Form Builder</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<H2>Form Builder</H2>

				<div className="w-full">
					<FormBuilder />
				</div>
			</div>
		</>
	);
};
