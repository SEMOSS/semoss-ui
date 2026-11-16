import { ChevronRight } from "lucide-react";
import { Link, Navigate } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { H4, Muted } from "@semoss/ui/next";
import { NewAppModal } from "@/components/app/new-app-modal";
import { NavbarHeader } from "@/components/shared/navbar-header";
import { NavbarLeft } from "@/components/shared/navbar-left";
import { useNavigate } from "@/hooks/useNavigate";

/**
 * New Automation: name the automation, then open it in its editor. Users who
 * cannot add projects go home.
 */
export const CreateAutomationPage = () => {
	const navigate = useNavigate();
	const canPerform = useSession((state) => state.canPerform);

	if (!canPerform("PROJECT", "add")) {
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
