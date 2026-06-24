import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts";
import { RootStore } from "@/stores";

export const RootLayout = ({ children }) => {
	const _insight = useInsight();
	const { t } = useTranslation("auditlog");

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();

		// initialize it with the new theme
		store.initialize({
			name: t("layout.appName"),
			description: t("layout.appDescription"),
		});
		return store;
	}, [t]);

	if (!rootStore.isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<RootContext.Provider
			value={{
				root: rootStore,
			}}
		>
			{children}
		</RootContext.Provider>
	);
};
