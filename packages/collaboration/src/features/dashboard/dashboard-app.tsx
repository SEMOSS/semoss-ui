import { ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useDashboard } from "./dashboard.context";
import { appPortalPath, validateDashboardApp } from "./dashboard-app-api";
import type { DashboardWidget } from "./dashboard-layout";
import { DashboardResourceStatus } from "./dashboard-resource-status";

/** A stable iframe instance survives grid moves and resizing; only explicit refresh remounts it. */
export function DashboardApp({ widget }: { widget: DashboardWidget }) {
	const { actions, layout } = useDashboard();
	const container = useRef<HTMLDivElement>(null);
	const frame = useRef<HTMLIFrameElement>(null);
	const [activated, setActivated] = useState(false);
	const [isAllowed, setIsAllowed] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState("");
	const [revision, setRevision] = useState(0);
	const appId = widget.appId;
	useEffect(() => {
		if (activated || !widget.visible || !container.current) return;
		if (typeof IntersectionObserver === "undefined") {
			setActivated(true);
			return;
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				setActivated(true);
				observer.disconnect();
			}
		});
		observer.observe(container.current);
		return () => observer.disconnect();
	}, [activated, widget.visible]);
	useEffect(() => {
		void revision;
		if (!activated || !appId) return;
		let cancelled = false;
		setIsAllowed(false);
		setIsLoaded(false);
		setError("");
		void validateDashboardApp(actions, appId)
			.then(() => {
				if (!cancelled) setIsAllowed(true);
			})
			.catch((cause: unknown) => {
				if (!cancelled)
					setError(
						cause instanceof Error
							? cause.message
							: "This app is unavailable. Check your access or remove the tile.",
					);
			});
		return () => {
			cancelled = true;
		};
	}, [actions, appId, activated, revision]);
	useEffect(() => {
		if (!isAllowed || isLoaded) return;
		const timer = window.setTimeout(
			() =>
				setError(
					"The app did not finish loading. Open it separately, refresh, or remove this tile.",
				),
			30_000,
		);
		return () => window.clearTimeout(timer);
	}, [isAllowed, isLoaded]);
	const syncTheme = useCallback((): void => {
		const theme = document.documentElement.classList.contains("dark")
			? "dark"
			: "light";
		frame.current?.contentWindow?.postMessage(
			{ type: "smss-theme-sync", theme },
			window.location.origin,
		);
		try {
			frame.current?.contentDocument?.documentElement.classList.toggle(
				"dark",
				theme === "dark",
			);
		} catch {
			/* The app may navigate to a different origin. */
		}
	}, []);
	useEffect(() => {
		const observer = new MutationObserver(syncTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, [syncTheme]);
	return (
		<div ref={container} className="flex h-full min-h-0 flex-col gap-3">
			<div className="flex flex-wrap gap-1">
				<Button size="sm" variant="ghost" asChild>
					<a
						target="_blank"
						rel="noopener noreferrer"
						href={appId ? appPortalPath(appId) : undefined}
					>
						Open app
						<ExternalLink aria-hidden="true" />
					</a>
				</Button>
				<Button
					size="icon-sm"
					variant="ghost"
					aria-label={`Refresh ${widget.title}`}
					onClick={() => setRevision((value) => value + 1)}
				>
					<RefreshCw aria-hidden="true" />
				</Button>
				{layout.isEditing && (
					<Button
						size="icon-sm"
						variant="ghost"
						aria-label={`Remove ${widget.title}`}
						onClick={() =>
							layout.setWidgets(
								layout.draft.widgets.filter(
									(entry) => entry.id !== widget.id,
								),
							)
						}
					>
						<Trash2 aria-hidden="true" />
					</Button>
				)}
			</div>
			<DashboardResourceStatus
				error={error}
				loading={activated && !isLoaded && !error}
				onRetry={() => setRevision((value) => value + 1)}
			/>
			{isAllowed && appId && (
				<iframe
					key={revision}
					ref={frame}
					title={widget.title}
					src={appPortalPath(appId)}
					className="min-h-0 w-full flex-1 rounded-lg border bg-background"
					onLoad={() => {
						setIsLoaded(true);
						try {
							const content = frame.current?.contentDocument;
							if (
								!content ||
								content.URL === "about:blank" ||
								/HTTP Status (403|404|500)|Access denied/i.test(
									content.title,
								)
							) {
								setError(
									"This app could not be embedded. Open it separately, check your access, or refresh the tile.",
								);
								return;
							}
							setError("");
							syncTheme();
						} catch {
							setError(
								"This app cannot be displayed here. Open it separately or refresh the tile.",
							);
						}
					}}
					onError={() =>
						setError(
							"This app could not be embedded. Open it separately or refresh the tile.",
						)
					}
				/>
			)}
			{!activated && (
				<p className="text-muted-foreground text-xs">
					The app loads when this tile is visible.
				</p>
			)}
		</div>
	);
}
