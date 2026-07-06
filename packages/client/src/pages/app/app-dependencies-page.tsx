import { Info, Pencil } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useAppDetail } from "@/contexts";
import { Dependencies } from "./app-detail-tabs/dependencies-tab";

export const AppDependenciesPage = () => {
	const { appInfo, dependencies, permission, openEditDependenciesModal } =
		useAppDetail();

	const canEdit = permission === "author" || permission === "editor";

	return (
		<div className="flex w-full flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 font-semibold text-base">
					<span>Dependencies</span>
					{canEdit && (
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<Info className="size-4 text-muted-foreground" />
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{appInfo?.project_type === "CODE"
									? "Add/Remove dependencies using the Edit Icon"
									: "Add/Remove dependencies using the Variables Tab"}
							</TooltipContent>
						</Tooltip>
					)}
				</div>

				{appInfo?.project_type === "CODE" && canEdit && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={openEditDependenciesModal}
						data-testid="appDetail-edit-btn"
					>
						<Pencil className="size-4" />
					</Button>
				)}
			</div>

			<p className="text-muted-foreground text-sm">
				These are the resources (engines and apps) this app depends on.
				You need access to each of them for this app to work properly.
			</p>

			<Dependencies dependencies={dependencies} />
		</div>
	);
};
