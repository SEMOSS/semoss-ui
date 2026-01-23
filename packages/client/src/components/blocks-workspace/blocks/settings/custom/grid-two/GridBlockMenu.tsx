import { useState } from "react";
import { type BlockComponent, useBlock } from "@semoss/renderer";
import { Stack, styled, ToggleTabsGroup } from "@semoss/ui";
import { JsonSettings } from "../../shared/JsonSettings";
import { GridBlockColumnSettings } from "./GridBlockColumnSettings";
import { GridBlockTool } from "./GridBlockTool";

const StyledContainer = styled("div")(() => ({
	maxHeight: "50vh",
}));
const StyledSubSection = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	padding: "8px 16px",
}));
const StyledJsonSection = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
}));
const StyledToolsSection = styled("div")(() => ({
	display: "flex",
	justifyContent: "flex-start",
	width: "100%",
}));
const StyledStack = styled(Stack)(() => ({
	">.MuiBox-root": {
		width: "90%",
		margin: "auto",
	},
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	minHeight: "42px",
	color: theme.palette.secondary.light,
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
	width: "100%",
	margin: "0 auto",
	display: "flex",
	justifyContent: "space-between",
	">.MuiTabs-scroller": {
		display: "flex",
		justifyContent: "space-around",
		".MuiTabs-flexContainer": {
			flex: 1,
		},
	},
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	padding: "8px 16px",

	"&.MuiTab-root": {
		borderRadius: theme.shape.borderRadius,
	},

	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
	},
}));

export const GridBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);

	const [selectedTab, setSelectedTab] = useState("Tools");

	return (
		<StyledStack>
			<StyledToggleTabsGroup
				variant="fullWidth"
				value={selectedTab}
				style={{
					width: "100% !important",
				}}
				onChange={(e: React.SyntheticEvent, val: string) => {
					setSelectedTab(val);
				}}
			>
				<StyledToggleTabsGroupItem label="Data" value={"Data"} />
				<StyledToggleTabsGroupItem label="Tools" value={"Tools"} />
				<StyledToggleTabsGroupItem label="JSON" value={"JSON"} />
			</StyledToggleTabsGroup>
			<StyledContainer>
				{selectedTab === "Data" && (
					<StyledSubSection>
						{data.variation === "grid-block" && (
							<GridBlockColumnSettings id={id} />
						)}
					</StyledSubSection>
				)}
				{selectedTab === "Tools" && (
					<StyledToolsSection>
						<GridBlockTool id={id} />
					</StyledToolsSection>
				)}
				{selectedTab === "JSON" && (
					<StyledJsonSection>
						<JsonSettings id={id} path="option" height="100vh" />
					</StyledJsonSection>
				)}
			</StyledContainer>
		</StyledStack>
	);
};
