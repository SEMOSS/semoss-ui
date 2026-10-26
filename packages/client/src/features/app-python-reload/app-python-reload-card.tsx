import { RefreshCw } from "lucide-react";
import {
	Button,
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
	Spinner,
} from "@semoss/ui/next";
import { useAppPythonReload } from "./use-app-python-reload";

export interface AppPythonReloadCardProps {
	/** The app whose python files to reload */
	appId: string;
}

/**
 * The app settings card that reloads the app's python files without
 * restarting python: it clears the app modules python has cached, on every
 * server, so the next run imports the current .py files.
 */
export const AppPythonReloadCard = ({ appId }: AppPythonReloadCardProps) => {
	const { isReloading, reloadPython } = useAppPythonReload(appId);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Python</CardTitle>
				<CardDescription>
					Python keeps the modules it imports from this app until they
					are cleared. Reload to clear them on every server, so the
					next run imports your current .py files. Python keeps
					running, along with its variables.
				</CardDescription>
				<CardAction className="self-center">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isReloading}
						onClick={reloadPython}
						data-testid="appPythonReloadCard-reload-btn"
					>
						{isReloading ? (
							<Spinner className="size-4" />
						) : (
							<RefreshCw aria-hidden />
						)}
						{isReloading ? "Reloading..." : "Reload Python Files"}
					</Button>
				</CardAction>
			</CardHeader>
		</Card>
	);
};
