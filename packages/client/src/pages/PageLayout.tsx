import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/common";
import { Page } from "@/components/shared/page";
import { PageContext } from "@/contexts";
import { PageStore } from "@/stores";
import { ErrorPage } from "./ErrorPage";

/**
 * Wrap the routes with a side navigation
 */
export const PageLayout = observer(() => {
	const page = useMemo(() => {
		return new PageStore();
	}, []);

	if (!page) {
		return null;
	}

	return (
		<ErrorBoundary fallback={<ErrorPage />}>
			<PageContext.Provider
				value={{
					page: page,
				}}
			>
				<Page>
					<Outlet />
				</Page>
			</PageContext.Provider>
		</ErrorBoundary>
	);
});
