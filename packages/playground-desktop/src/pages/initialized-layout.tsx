import { Outlet } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useConfig } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";

/** Props for {@link InitializedLayout}. */
export interface InitializedLayoutProps {
	/** Go back to the instance picker, when the instance cannot be read. */
	onSwitchServer: () => void;
}

/**
 * Wait for the instance's config, which every route needs (sign in
 * providers, the playground theme). An instance that cannot be read offers
 * the way back to the instance picker.
 *
 * @component
 */
export const InitializedLayout = ({
	onSwitchServer,
}: InitializedLayoutProps) => {
	const { t } = useTranslation("desktop");
	const status = useConfig((state) => state.status);
	const error = useConfig((state) => state.error);

	if (status === "ERROR") {
		return (
			<main className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
				<Alert variant="destructive" className="max-w-md">
					<AlertDescription>
						{t("instances.unreachable", {
							message: error?.message ?? "",
						})}
					</AlertDescription>
				</Alert>
				<Button variant="outline" onClick={onSwitchServer}>
					{t("auth.switchServer")}
				</Button>
			</main>
		);
	}
	if (status !== "READY") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}
	return <Outlet />;
};
