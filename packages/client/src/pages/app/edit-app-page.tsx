import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { Workspace } from "@/components/workspace";
import { usePage } from "@/hooks";

export const EditAppPage = observer(() => {
	// App ID Needed for pixel calls
	const { appId } = useParams();

	// setup the page
	usePage({
		showNavbarLogo: false,
	});

	return (
		<div className="absolute inset-0">
			<InsightProvider>
				<Workspace app={appId} />
			</InsightProvider>
		</div>
	);
});
