import { FileCode, HardDriveUpload } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { AppPythonReloadCard } from "@/features/app-python-reload/app-python-reload-card";
import { useProject } from "@/hooks/use-project";
import { useSession } from "@/hooks/use-session";
import { useSettings } from "@/hooks/useSettings";

/**
 * The Python and Reactors section of an app's Settings: reloading the app's
 * python files, and the custom reactors the app defines, compiled and deployed
 * to every server.
 */
export const AppPythonReactorsSettingsPage = () => {
	const { project } = useProject();
	const sessionRunPixel = useSession((state) => state.runPixel);
	const { adminMode } = useSettings();
	const [isCompiling, setIsCompiling] = useState(false);

	const getReactors = usePixel<string[] | string>(
		adminMode
			? `AdminGetProjectAvailableReactors(project=['${project.project_id}']);`
			: `GetProjectAvailableReactors(project=['${project.project_id}']);`,
	);
	// one reactor comes back as a string
	const reactors =
		getReactors.data === undefined
			? []
			: Array.isArray(getReactors.data)
				? getReactors.data
				: [getReactors.data];

	const handleCompile = async () => {
		setIsCompiling(true);
		try {
			const response = await sessionRunPixel(
				`CompileAppReactors(project='${project.project_id}', release=true);`,
			);
			if (response.errors.length > 0) {
				toast.error(response.errors.join(""));
				return;
			}
			toast.success("Compiled and deployed the reactors to every server");
			getReactors.refresh();
		} catch (error) {
			toast.error(
				getErrorMessage(error, "Could not compile the reactors"),
			);
		} finally {
			setIsCompiling(false);
		}
	};

	return (
		<div className="flex w-full flex-col gap-4">
			<AppPythonReloadCard appId={project.project_id} />
			<Card>
				<CardHeader className="border-b">
					<CardTitle>Reactors</CardTitle>
					<CardDescription>
						The custom reactors this app defines. Compile and deploy
						them to keep a change on every server.
					</CardDescription>
					<CardAction className="self-center">
						<Button
							type="button"
							size="sm"
							disabled={isCompiling}
							onClick={handleCompile}
							data-testid="appReactors-deploy-btn"
						>
							{isCompiling ? (
								<Spinner className="size-4" />
							) : (
								<HardDriveUpload aria-hidden />
							)}
							{isCompiling
								? "Compiling..."
								: "Compile and Deploy"}
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					{getReactors.status === "ERROR" ? (
						<Alert variant="destructive">
							<AlertDescription>
								{getErrorMessage(
									getReactors.error,
									"Could not read the reactors",
								)}
							</AlertDescription>
						</Alert>
					) : getReactors.status !== "SUCCESS" ? (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					) : reactors.length > 0 ? (
						<ul className="divide-y rounded-md border">
							{reactors.map((reactor) => (
								<li
									key={reactor}
									className="flex items-center gap-3 px-3 py-2 text-sm"
								>
									<FileCode
										className="size-4 shrink-0 text-muted-foreground"
										aria-hidden
									/>
									<span className="min-w-0 truncate font-mono">
										{reactor}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground text-sm">
							This app has no custom reactors.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
