import { Navigate, useParams } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useNavigate } from "@/hooks/useNavigate";
import { EngineFormHeader } from "../shared/engine-form-header";
import { FUNCTION_CONNECTORS } from "./function-connectors.constants";

/**
 * Renders the dedicated form for a single Function connector, resolved from
 * the `:connector` route param against `FUNCTION_CONNECTORS`.
 */
export const FunctionConnectorPage = () => {
	const navigate = useNavigate();
	const { connector: slug } = useParams<{ connector: string }>();
	const connector = FUNCTION_CONNECTORS.find((c) => c.slug === slug);

	if (!connector) {
		return <Navigate to="/function/new" replace />;
	}

	const { Component } = connector;

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb data-testid="breadcrumbs">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="cursor-pointer"
								onClick={() => navigate("/function/new")}
								data-testid="breadcrumb-catalog"
							>
								Function Catalog
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="cursor-pointer"
								onClick={() => navigate("/function/new")}
								data-testid="breadcrumb-page"
							>
								Connect to Function Database
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage data-testid="breadcrumb-selected-function">
								{connector.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</NavbarLeft>
			<div data-testid="function-form-wrapper">
				<EngineFormHeader
					testIdPrefix="function"
					icon={connector.icon}
					title={connector.name}
					description={`Fill out ${connector.name} details in order to add function to catalog`}
				/>
				<Component />
			</div>
		</>
	);
};
