import { H4, Muted } from "@semoss/ui/next";
import BI from "@/assets/img/BI.png";
import Notebook from "@/assets/img/NOTEBOOK.png";
import Terminal from "@/assets/img/Terminal.png";
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

const NOTEBOOK_APP: AppMetadata = {
	project_id: "",
	project_name: "Notebook",
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
	description: "Write and run notebooks with code cells",
};

export const FanFavoritesSection = () => {
	return (
		<div className="flex w-full flex-col gap-3">
			<div className="flex-col gap-1">
				<H4 className="font-bold text-foreground">
					Try these fan favorites
				</H4>
				<Muted>Explore popular apps built by the community.</Muted>
			</div>
			<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<AppTileCard
					app={BUSINESS_INTELLIGENCE_APP}
					background="#BADEFF"
					href="../../legacy/dist/"
					systemApp={true}
					appType={"BI"}
					isLoading={false}
					showSkeleton={false}
					variant="fillerCard"
					cardImgSrc={BI}
				/>
				<AppTileCard
					app={TERMINAL_APP}
					background="#BADEFF"
					href="../../terminal/dist/"
					systemApp={true}
					appType={"TERMINAL"}
					isLoading={false}
					showSkeleton={false}
					variant="fillerCard"
					cardImgSrc={Terminal}
				/>
				<AppTileCard
					app={NOTEBOOK_APP}
					background="#BADEFF"
					href="#/notebook"
					systemApp={true}
					appType={"NOTEBOOK"}
					isLoading={false}
					showSkeleton={false}
					variant="fillerCard"
					cardImgSrc={Notebook}
				/>
			</div>
		</div>
	);
};
