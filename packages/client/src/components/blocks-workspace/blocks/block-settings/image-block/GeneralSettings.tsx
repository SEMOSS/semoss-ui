import { useParams } from "react-router";
import { useBlock } from "@semoss/renderer";
import { useSession } from "@semoss/sdk/react";
import { TabsComponent } from "./SelectionTabs";

interface GeneralSettingsProps {
	id: string;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ id }) => {
	const { data, setData } = useBlock(id);
	const insightID = useSession((state) => state.insightId);
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
