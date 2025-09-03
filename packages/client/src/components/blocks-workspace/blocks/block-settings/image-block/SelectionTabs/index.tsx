import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Stack, styled, Tab, Tabs, Tooltip } from "@semoss/ui";
import AppTab from "./App";
import ExternalTab from "./External";
import InsightTab from "./Insight";

type TabRenderProps = {
	id: string;
	data: any;
	uploadFile?: (file: File, appId: string, path: string) => Promise<any>;
	appId: string;
	insightId?: string;
	setData?: (path: string, value: any, force?: boolean) => void;
};

const StyledTabs = styled(Tabs)({
	display: "flex",
	justifyContent: "space-between",
	minHeight: 36,
});

const StyledTab = styled(Tab)({
	minHeight: 30,
	px: 2,
	py: 1,
	flex: 1,
});

const StyledInfoIcon = styled(InfoOutlinedIcon)({
	fontSize: 2,
});

const tabConfig = [
	{
		label: "Insight",
		tooltip: "Image generated when the app runs",
		render: ({ insightId, data, setData }: TabRenderProps) => (
			<InsightTab insightId={insightId} data={data} setData={setData} />
		),
	},
	{
		label: "App",
		tooltip: "Image stored in app assets",
		render: ({ id, data, setData, appId, insightId }: TabRenderProps) => (
			<AppTab
				insightId={insightId}
				data={data}
				setData={setData}
				id={id}
				appId={appId}
			/>
		),
	},
	{
		label: "External",
		tooltip: "Add image from external link",
		render: ({ id, data, setData }: TabRenderProps) => (
			<ExternalTab id={id} data={data} setData={setData} />
		),
	},
];

const TabsComponent = observer(
	({ data, setData, insightId, appId, id }: TabRenderProps) => {
		const [value, setValue] = useState(0);
		const handleChange = (_: React.SyntheticEvent, newValue: number) => {
			setValue(newValue);
		};

		const updateData = (path: string, value: any) => {
			setData(path, value, true);
		};

		const tabContent = useMemo(
			() =>
				tabConfig[value]?.render?.({
					id,
					data,
					setData: updateData,
					appId: appId || "",
					insightId: insightId || "",
				}),
			[value, data],
		);

		return (
			<>
				<StyledTabs
					value={value}
					onChange={handleChange}
					TabIndicatorProps={{
						sx: {
							top: "inherit",
							bottom: "unset",
						},
					}}
					data-testid="image-tabs"
				>
					{tabConfig.map((tab) => (
						<StyledTab
							key={tab.label}
							label={tab.label}
							iconPosition="end"
							icon={
								<Tooltip title={tab.tooltip} placement="top">
									<StyledInfoIcon />
								</Tooltip>
							}
						/>
					))}
				</StyledTabs>
				<Stack flexDirection={"column"} marginTop={2}>
					{tabContent}
				</Stack>
			</>
		);
	},
);

export default TabsComponent;
