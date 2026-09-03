import { ChevronRight } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { H4, Muted } from "@semoss/ui/next";
import { NewAppModal } from "@/components/app";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

export const CreateAutomationPage = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();

	if (!configStore.isEngineOperationAvailable("PROJECT", "add")) {
		return <Navigate to="/" replace />;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<div className="flex items-center gap-2 text-sm">
					<Link to="/automation">Automation Catalog</Link>
					<ChevronRight className="size-4 text-muted-foreground" />
					<span>New</span>
				</div>
			</NavbarLeft>
			<div className="flex flex-col gap-1">
				<H4>New Automation</H4>
				<Muted>
					Create a governed workflow that connects your data, tools,
					models, and applications.
				</Muted>
			</div>
			<NewAppModal
				open
				options={{ type: "automation" }}
				onClose={(projectId) =>
					navigate(
						projectId
							? `/automation/${projectId}/edit`
							: "/automation",
					)
				}
			/>
		</>
	);
};
