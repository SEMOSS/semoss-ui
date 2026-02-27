import { P } from "@semoss/ui/next";
import { type AppMetadata, AppTileCard } from "../app";

const BUSINESS_INTELLIGENCE_APP: AppMetadata = {
	project_id: "",
	project_name: "BI",
	project_type: "",
	project_cost: "",
	project_global: "",
	project_catalog_name: "",
	project_created_by: "SYSTEM",
	project_created_by_type: "",
	project_date_created: "",
	project_date_last_edited: "",
	project_has_portal: false,
	project_portal_name: "",
	project_portal_published_date: "",
	project_published_user: "",
	project_published_user_type: "",
	project_reactors_compiled_date: "",
	project_reactors_compiled_user: "",
	project_reactors_compiled_user_type: "",
	project_favorite: "",
	user_permission: null,
	group_permission: "",
	tag: [],
	description: "Develop dashboards and visualizations to view data",
};

const TERMINAL_APP: AppMetadata = {
	project_id: "",
	project_name: "Terminal",
	project_type: "",
	project_cost: "",
	project_global: "",
	project_catalog_name: "",
	project_created_by: "SYSTEM",
	project_created_by_type: "",
	project_date_created: "",
	project_date_last_edited: "",
	project_has_portal: false,
	project_portal_name: "",
	project_portal_published_date: "",
	project_published_user: "",
	project_published_user_type: "",
	project_reactors_compiled_date: "",
	project_reactors_compiled_user: "",
	project_reactors_compiled_user_type: "",
	project_favorite: "",
	user_permission: null,
	group_permission: "",
	tag: [],
	description: "Execute commands and see a response",
};

export const FanFavoritesSection = () => {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex w-full flex-row items-baseline justify-between">
				<P>Try these fan favorites</P>
				{/* <button
                    type="button"
                    className="text-sm font-medium text-foreground hover:bg-secondary rounded-md px-3 py-1"
                >
                    See All
                </button> */}
			</div>
			<div className="flex flex-row gap-6">
				<AppTileCard
					app={BUSINESS_INTELLIGENCE_APP}
					background="#BADEFF"
					href="../../legacy/dist/"
					systemApp={true}
					appType={"BI"}
					isLoading={false}
					showSkeleton={false}
				/>
				<AppTileCard
					app={TERMINAL_APP}
					background="#BADEFF"
					href="../../legacy/dist/#!/embed-terminal"
					systemApp={true}
					appType={"TERMINAL"}
					isLoading={false}
					showSkeleton={false}
				/>
			</div>
		</div>
	);
};
