import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { Workspace } from "@/components/workspace";
import { usePage } from "@/hooks";
import type { CatalogType } from "./catalog-page";

interface EditPageProps {
	type: CatalogType;
}

export const EditPage = observer(({ type: _type }: EditPageProps) => {
	const { appId } = useParams();

	usePage({
		showNavbarLogo: false,
	});

	return (
		<div className="absolute inset-0">
			<InsightProvider>
				<Workspace app={appId as string} />
			</InsightProvider>
		</div>
	);
});
