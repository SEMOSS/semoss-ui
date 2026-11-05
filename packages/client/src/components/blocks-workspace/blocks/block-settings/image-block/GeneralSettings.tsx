import { useParams } from "react-router";
import { useBlock } from "@semoss/renderer";
import { TabsComponent } from "./SelectionTabs";

interface GeneralSettingsProps {
	id: string;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ id }) => {
	const { data, setData } = useBlock(id);
	const { appId } = useParams();

	return (
		<div className="w-full">
			<TabsComponent
				{...{
					data,
					appId,
					id,
					setData,
				}}
			/>
		</div>
	);
};
