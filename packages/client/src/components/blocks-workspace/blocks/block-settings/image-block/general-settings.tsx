import { useParams } from "react-router";
import { useBlock } from "@semoss/renderer";
import { useSessionInsight } from "@semoss/sdk/react";
import { TabsComponent } from "./SelectionTabs";

interface GeneralSettingsProps {
	/** Id of the image block being edited */
	id: string;
}

/** The image block's General settings: where its image comes from. */
export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ id }) => {
	const { data, setData } = useBlock(id);
	const { insightId } = useSessionInsight();
	const { appId } = useParams();

	return (
		<div className="w-full">
			<TabsComponent
				{...{
					data,
					insightId: insightId,
					appId,
					id,
					setData,
				}}
			/>
		</div>
	);
};
