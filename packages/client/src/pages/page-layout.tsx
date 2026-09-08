import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Page } from "@/components/shared/page";
import { PageContext } from "@/contexts";
import { PageStore } from "@/stores";
import { ErrorPage } from "./error-page";

/**
 * Wrap the routes with a side navigation
 */
export const PageLayout = observer(() => {
	const page = useMemo(() => {
		return new PageStore();
	}, []);
	const location = useLocation();

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
					{/* keyed so each navigation replays the fade-in */}
					<div
						key={location.pathname}
						className="fade-in animate-in duration-200"
					>
						<Outlet />
					</div>
				</Page>
			</PageContext.Provider>
		</ErrorBoundary>
	);
});
