import { Link } from "react-router-dom";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkflowFormEditor } from "../workflow-form-editor";

// ─── main component ───────────────────────────────────────────────────────────

export function WorkflowWorkspace() {
	const { workspace } = useWorkspace();
	const appId = workspace.appId;

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
					<div className="flex items-center gap-1">
						<Link
							to={`/app/${appId}/view`}
							className="flex items-center text-inherit no-underline"
						>
							<div className="max-w-[30ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]">
								{workspace.metadata.project_name}
							</div>
						</Link>
						<span className="text-muted-foreground text-sm">/</span>
						<span className="text-sm">Workflow</span>
					</div>
				</div>
			</NavbarLeft>

			{/* WorkflowFormEditor owns save, run, history, and all step UI */}
			<div className="flex-1 overflow-hidden">
				<WorkflowFormEditor appId={appId} />
			</div>
		</div>
	);
}
