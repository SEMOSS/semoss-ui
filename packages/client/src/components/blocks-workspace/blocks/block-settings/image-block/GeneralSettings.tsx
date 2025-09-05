import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { useBlock } from "@semoss/renderer";
import { Box, styled } from "@semoss/ui";
import { useRootStore } from "@/hooks";
import TabsComponent from "./SelectionTabs";

interface GeneralSettingsProps {
	id: string;
}

const StyledBox = styled(Box)({
	width: "100%",
});

const GeneralSettings: React.FC<GeneralSettingsProps> = observer(({ id }) => {
	const { data, setData } = useBlock(id);
	const { configStore } = useRootStore();
	const { appId } = useParams();

	return (
		<StyledBox>
			<TabsComponent
				{...{
					data,
					insightId: configStore.store.insightID,
					appId,
					id,
					setData,
				}}
			/>
		</StyledBox>
	);
});

export default GeneralSettings;
