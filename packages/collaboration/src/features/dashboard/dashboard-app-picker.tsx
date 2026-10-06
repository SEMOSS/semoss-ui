import { AppWindow, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Spinner,
} from "@semoss/ui/next";
import { useDashboard } from "./dashboard.context";
import { type DashboardApp, listDashboardApps } from "./dashboard-app-api";

/** Only accessible published SEMOSS apps can become dashboard tiles. */
export function DashboardAppPicker({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const { actions, layout } = useDashboard();
	const searchId = useId();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [revision, setRevision] = useState(0);
	const [state, setState] = useState({
		apps: [] as DashboardApp[],
		isLoading: false,
		error: "",
		hasMore: true,
	});
	useEffect(() => {
		void revision;
		if (!isOpen) return;
		let cancelled = false;
		setState((current) => ({
			...current,
			isLoading: true,
			error: "",
			...(page === 0 ? { apps: [] } : {}),
		}));
		const timer = window.setTimeout(() => {
			void listDashboardApps(actions, search, page * 25)
				.then((result) => {
					if (!cancelled)
						setState((current) => ({
							apps: [
								...new Map(
									[
										...(page ? current.apps : []),
										...result.apps,
									].map((app) => [app.project_id, app]),
								).values(),
							],
							isLoading: false,
							error: "",
							hasMore: result.hasMore,
						}));
				})
				.catch((cause: unknown) => {
					if (!cancelled)
						setState((current) => ({
							...current,
							isLoading: false,
							error:
								cause instanceof Error
									? cause.message
									: "Apps could not be loaded.",
						}));
				});
		}, 250);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [actions, isOpen, page, search, revision]);
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add an app</DialogTitle>
					<DialogDescription>
						Bring a published SEMOSS app into your dashboard.
					</DialogDescription>
				</DialogHeader>
				<Label htmlFor={searchId}>Search apps</Label>
				<Input
					id={searchId}
					value={search}
					onChange={(event) => {
						setPage(0);
						setSearch(event.target.value);
					}}
					placeholder="Find an app…"
				/>
				<div className="max-h-80 space-y-2 overflow-y-auto">
					{state.apps.map((app) => (
						<div
							key={app.project_id}
							className="flex items-center gap-3 rounded-lg border p-3"
						>
							<AppWindow
								aria-hidden="true"
								className="size-5 text-primary"
							/>
							<span className="min-w-0 flex-1 break-words text-sm">
								{app.project_display_name || app.project_name}
							</span>
							<Button
								variant="outline"
								size="sm"
								aria-label={`Add ${app.project_display_name || app.project_name}`}
								disabled={layout.draft.widgets.length >= 40}
								onClick={() => {
									layout.setWidgets([
										...layout.draft.widgets,
										{
											id: `app:${crypto.randomUUID()}`,
											kind: "app",
											appId: app.project_id,
											title:
												app.project_display_name ||
												app.project_name,
											visible: true,
											width: 6,
											height: 72,
											density: "comfortable",
											filter: "all",
										},
									]);
									onClose();
								}}
							>
								<Plus aria-hidden="true" />
								Add
							</Button>
						</div>
					))}
					{state.isLoading && (
						<output className="flex items-center gap-2 py-4">
							<Spinner aria-hidden="true" />
							Loading apps…
						</output>
					)}
					{state.error && (
						<Alert variant="destructive">
							<AlertDescription>{state.error}</AlertDescription>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setRevision((value) => value + 1)
								}
							>
								Retry
							</Button>
						</Alert>
					)}
					{!state.isLoading &&
						!state.error &&
						state.apps.length === 0 && (
							<p className="py-4 text-muted-foreground text-sm">
								No published apps in this page.{" "}
								{state.hasMore
									? "Load more to continue through your catalog."
									: "Try another search or publish an app in SEMOSS."}
							</p>
						)}
					{state.hasMore && (
						<Button
							disabled={state.isLoading}
							variant="ghost"
							onClick={() => setPage((value) => value + 1)}
						>
							Load more apps
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
