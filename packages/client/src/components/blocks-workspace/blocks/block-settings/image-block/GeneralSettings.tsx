import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { useBlock } from "@semoss/renderer";
import { useRootStore } from "@/hooks";
import TabsComponent from "./SelectionTabs";

interface GeneralSettingsProps {
	id: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = observer(({ id }) => {
	const { data, setData } = useBlock(id);
	const { configStore } = useRootStore();
	const { appId } = useParams();

	return (
		<div className="w-full">
			<TabsComponent
				{...{
					data,
					insightId: configStore.store.insightID,
					appId,
					id,
					setData,
				}}
			/>
		</div>
	);
});

export default GeneralSettings;
