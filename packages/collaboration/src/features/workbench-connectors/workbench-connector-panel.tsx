import {
	Activity,
	type ReactNode,
	Suspense,
	useEffect,
	useRef,
	useState,
} from "react";
import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { Logins } from "@semoss/sdk";
import { WorkbenchPanelLoading } from "@semoss/workbench";
import { useWorkbenchConnectorHost } from "./workbench-connector.context";
import {
	useWorkbenchConnectorNavigation,
	type WorkbenchConnectorBrowser,
	type WorkbenchConnectorReturnTarget,
} from "./workbench-connector-navigation.context";
import { WorkbenchConnectorProviderControl } from "./workbench-connector-provider-control";

export interface WorkbenchConnectorBrowserProps extends ConnectorViewerProps {
	provider: ConnectorAccount;
	providerControl: ReactNode;
}

interface WorkbenchConnectorPanelProps {
	/** The account choice and return target belong to this rail browser. */
	browser: WorkbenchConnectorBrowser;
	/** Render the compact shared viewer inside its retained account subtree. */
	children: (props: WorkbenchConnectorBrowserProps) => ReactNode;
}

/** Retain each account's browser while sharing only host navigation and saves. */
export function WorkbenchConnectorPanel({
	browser,
	children,
}: WorkbenchConnectorPanelProps) {
	const { t } = useTranslation("connectors");
	const host = useWorkbenchConnectorHost();
	const navigation = useWorkbenchConnectorNavigation();
	const provider = navigation.providers[browser];
	const { returnTarget } = navigation;
	const rootRef = useRef<HTMLDivElement>(null);
	const consumedReturnRef = useRef<WorkbenchConnectorReturnTarget | null>(
		null,
	);
	const providerFocusRef = useRef<ConnectorAccount | null>(null);
	const [visitedProviders, setVisitedProviders] = useState<
		ConnectorAccount[]
	>([provider]);
	const accounts = visitedProviders.includes(provider)
		? visitedProviders
		: [...visitedProviders, provider];

	useEffect(() => {
		setVisitedProviders((visited) =>
			visited.includes(provider) ? visited : [...visited, provider],
		);
	}, [provider]);

	useEffect(() => {
		const shouldReturnToRow =
			returnTarget !== null &&
			returnTarget !== consumedReturnRef.current &&
			returnTarget.browser === browser &&
			returnTarget.provider === provider;
		if (!shouldReturnToRow && providerFocusRef.current !== provider) return;
		let hasFocusedProvider = false;
		const restoreFocus = (): boolean => {
			const accountRoot = Array.from(
				rootRef.current?.querySelectorAll<HTMLElement>(
					"[data-workbench-connector-provider]",
				) ?? [],
			).find(
				(element) =>
					element.dataset.workbenchConnectorProvider === provider,
			);
			if (!accountRoot) return false;
			const row = shouldReturnToRow
				? Array.from(
						accountRoot.querySelectorAll<HTMLElement>(
							"[data-item-key]",
						),
					).find(
						(element) =>
							element.dataset.itemKey === returnTarget?.itemKey,
					)
				: undefined;
			const control =
				accountRoot.querySelector<HTMLElement>("[role=combobox]");
			if (row) row.focus();
			else if (control && !hasFocusedProvider) {
				control.focus();
				hasFocusedProvider = true;
			}
			const isComplete = Boolean(
				row ||
					(control && (!shouldReturnToRow || !returnTarget?.itemKey)),
			);
			if (isComplete) {
				providerFocusRef.current = null;
				if (shouldReturnToRow) consumedReturnRef.current = returnTarget;
			}
			return isComplete;
		};
		const observer = new MutationObserver(() => {
			if (restoreFocus()) observer.disconnect();
		});
		// A full-calendar date change may leave the rail's new agenda still loading.
		// Wait for its row, but never move focus after the user starts another action.
		const cancelPendingFocus = (): void => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			providerFocusRef.current = null;
			if (shouldReturnToRow) consumedReturnRef.current = returnTarget;
		};
		const frame = requestAnimationFrame(() => {
			if (!restoreFocus() && rootRef.current) {
				observer.observe(rootRef.current, {
					childList: true,
					subtree: true,
				});
			}
		});
		document.addEventListener("pointerdown", cancelPendingFocus, true);
		document.addEventListener("keydown", cancelPendingFocus, true);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			document.removeEventListener(
				"pointerdown",
				cancelPendingFocus,
				true,
			);
			document.removeEventListener("keydown", cancelPendingFocus, true);
		};
	}, [browser, provider, returnTarget]);

	if (!host) return <WorkbenchPanelLoading label={t("common.loading")} />;

	return (
		<div
			ref={rootRef}
			className="flex size-full min-h-0 min-w-0 flex-col bg-background"
		>
			{accounts.map((account) => (
				<Activity
					key={account}
					mode={provider === account ? "visible" : "hidden"}
				>
					<div
						data-workbench-connector-provider={account}
						className="min-h-0 min-w-0 flex-1"
					>
						<Suspense
							fallback={
								<WorkbenchPanelLoading
									label={t("common.loading")}
								/>
							}
						>
							{children({
								...host,
								provider: account,
								showHeader: false,
								onSignIn: () =>
									Logins.connect(
										account === "microsoft"
											? "MICROSOFT"
											: "GOOGLE",
										account,
									),
								providerControl: (
									<WorkbenchConnectorProviderControl
										provider={account}
										onProviderChange={(next) => {
											if (next !== provider)
												providerFocusRef.current = next;
											navigation.setProvider(
												browser,
												next,
											);
										}}
									/>
								),
							})}
						</Suspense>
					</div>
				</Activity>
			))}
		</div>
	);
}
