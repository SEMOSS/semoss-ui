import { useParams } from "react-router";
import { useBlock } from "@semoss/renderer";
import { useSession } from "@/hooks";
import TabsComponent from "./SelectionTabs";

interface GeneralSettingsProps {
	id: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ id }) => {
	const { data, setData } = useBlock(id);
	const insightID = useSession((state) => state.insightID);
	const { appId } = useParams();

	return (
		<div className="w-full">
			<TabsComponent
				{...{
					data,
					insightId: insightID,
					appId,
					id,
					setData,
				}}
			/>
		</div>
	);
};

export default GeneralSettings;
