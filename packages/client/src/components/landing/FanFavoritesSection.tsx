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
		<div className="flex w-full flex-col gap-3">
			<div className="flex w-full items-baseline justify-between">
				<p className="font-medium text-foreground text-sm">
					Try these fan favorites
				</p>
			</div>
			<div className="flex w-full flex-wrap items-start gap-4">
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
