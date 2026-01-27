import { observer } from "mobx-react-lite";
import { useGlobalBreadcrumbs } from "@/hooks";

export const SettingsHomePage: React.FC = observer(() => {
	useGlobalBreadcrumbs([
		{
			name: "Settings",
			path: "/settings",
		},
	]);

	return <div>Home</div>;
});
