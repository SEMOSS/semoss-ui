import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useWorkspace } from "@/hooks";
import { AutomationFormEditor } from "./form-editor/automation-form-editor";

export const AutomationWorkspace: React.FC = observer(() => {
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
						<span className="text-sm">Automation</span>
					</div>
				</div>
			</NavbarLeft>

			<div className="flex-1 overflow-hidden">
				<AutomationFormEditor appId={appId} />
			</div>
		</div>
	);
});
