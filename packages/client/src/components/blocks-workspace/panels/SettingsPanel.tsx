import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import { observer } from "mobx-react-lite";
import { Panel } from "@/components/workspace";

export const SettingsPanel = observer((_props) => {
  return (
    <Panel>
      <p>
        <TopicOutlinedIcon /> Member
      </p>
      <p>
        <TopicOutlinedIcon /> Pending Requests
      </p>
      <p>
        <TopicOutlinedIcon /> Data Apps
      </p>
    </Panel>
  );
});
