import { useRef } from "react";
import { Outlet } from "react-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Page } from "@/components/shared/page";
import { PageContext } from "@/contexts";
import { createPageStore } from "@/stores";
import { ErrorPage } from "./error-page";

/**
 * Wrap the routes with a side navigation
 */
export const PageLayout = () => {
	const storeRef = useRef<ReturnType<typeof createPageStore> | null>(null);
	if (!storeRef.current) {
		storeRef.current = createPageStore();
	}

	return (
		<ErrorBoundary fallback={<ErrorPage />}>
			<PageContext.Provider
				value={{
					store: storeRef.current,
				}}
			>
				<Page>
					<Outlet />
				</Page>
			</PageContext.Provider>
		</ErrorBoundary>
	);
};
