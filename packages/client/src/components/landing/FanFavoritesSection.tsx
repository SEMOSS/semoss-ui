import { Button, Stack, styled, Typography } from "@semoss/ui";
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

const StyledSeeAllButton = styled(Button)(({ theme }) => ({
	justifyContent: "flex-end",
	color: theme.palette.text.primary,
	fontWeight: 500,
	"&.MuiButtonBase-root: hover": {
		backgroundColor: "#F5F5F5",
	},
}));

export const FanFavoritesSection = () => {
	return (
		<Stack gap={1}>
			<Stack
				direction={"row"}
				justifyContent={"space-between"}
				alignItems={"baseline"}
				width={"100%"}
			>
				<Typography variant={"body1"}>
					Try these fan favorites
				</Typography>
				{/* <StyledSeeAllButton
          type="button"
          size="small"
          variant="text"
          color="secondary"
        >
          See All
        </StyledSeeAllButton> */}
			</Stack>
			<Stack direction={"row"} gap={3}>
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
			</Stack>
		</Stack>
	);
};
