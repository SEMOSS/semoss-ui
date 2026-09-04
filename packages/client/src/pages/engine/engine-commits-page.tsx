import { useParams } from "react-router";
import { CommitsTab } from "@/pages/app/app-detail-tabs/commits-tab";

export const EngineCommitsPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	if (!engineId) {
		return null;
	}

	return (
		<div className="px-6 py-4">
			<CommitsTab engineId={engineId} />
		</div>
	);
};
