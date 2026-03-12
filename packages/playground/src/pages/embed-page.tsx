import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { Skeleton } from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { RootStore } from "@/stores";

export const EmbedPage: React.FC = observer(() => {
	const { t } = useTranslation("workspace");
	const { path } = useParams();
	const { root } = useRoot();

	const [isLoading, setIsLoading] = useState<boolean>(true);

	let matched: RootStore["theme"]["sidebar"]["headerItems"][number] = null;
	for (const item of root.theme.sidebar.headerItems) {
		if (item.path === path) {
			matched = item;
			break;
		}
	}

	if (!matched) {
		for (const item of root.theme.sidebar.footerItems) {
			if (item.path === path) {
				matched = item;
				break;
			}
		}
	}

	// useGlobalBreadcrumbs({
	// 	breadcrumbs: [
	// 		{
	// 			name: t("breadcrumbs.home"),
	// 			path: "/",
	// 		},
	// 		{
	// 			name: isLoading ? t("breadcrumbs.loading") : matched.name,
	// 			path: `/embed/${path}`,
	// 		},
	// 	],
	// });

	if (!matched) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
			{isLoading && <Skeleton className="h-full w-full" />}
			{matched && (
				<iframe
					className="h-full w-full border-none"
					title={matched.name}
					src={matched.url}
					onLoad={() => {
						setIsLoading(false);
					}}
				/>
			)}
		</div>
	);
});
