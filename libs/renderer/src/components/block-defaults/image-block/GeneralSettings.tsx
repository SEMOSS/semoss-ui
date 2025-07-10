import { useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Box } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import TabsComponent from "./SelectionTabs";

interface GeneralSettingsProps {
    id: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = observer(({ id }) => {
    const { data, setData, insightId } = useBlock(id);
    const { appId } = useParams();

    return (
        <Box sx={{ width: "100%" }}>
            <TabsComponent {...{ data, insightId, appId, id, setData }} />
        </Box>
    );
});

export default GeneralSettings;
