import { useState } from "react";
import { BlockComponent, useBlock } from "@semoss/renderer";
import { Stack, styled, ToggleTabsGroup } from "@semoss/ui";
import { AIGenerationSettings, JsonSettings } from "../../";

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

const StyledStack = styled(Stack)(() => ({
	">.MuiBox-root": {
		width: "90%",
		margin: "auto",
	},
}));
const StyledAIStack = styled(Stack)(() => ({
	padding: "0 16px",
	display: "flex",
}));
export const VegaVisualizationBlockMenu: BlockComponent = ({ id }) => {
	const { data } = useBlock(id);
	const [_expandAccordion, _setExpandAccordionn] = useState(false);
	const [mode, setMode] = useState("tool");
	return (
		<StyledStack spacing={2}>
			<StyledToggleTabsGroup
				value={mode}
				onChange={(e: React.SyntheticEvent, val) => {
					setMode(val as string);
				}}
				variant="fullWidth"
			>
				<StyledToggleTabsGroupItem value="tool" label="Tool" />
				<StyledToggleTabsGroupItem value="json" label="JSON" />
			</StyledToggleTabsGroup>
			{mode === "json" && (
				<JsonSettings id={id} path="specJson" height="90vh" />
			)}
			{mode === "tool" && !data.variation && (
				<StyledAIStack>
					<AIGenerationSettings
						id={id}
						path="specJson"
						appendPrompt={
							'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
						}
						placeholder="Ex: Generate a bar graph."
						showFileUpload
						label=""
					/>
				</StyledAIStack>
			)}
		</StyledStack>
	);
};
