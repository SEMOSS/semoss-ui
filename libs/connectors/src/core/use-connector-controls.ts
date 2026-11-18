import { useEffect } from "react";
import { safeHttpsUrl } from "@semoss/utility/browser";
import type { ConnectorViewerControls } from "./connector.types";

/**
 * Publish visible viewer actions without clearing another retained viewer's
 * controls. An `openIn` link is published only when it is an absolute HTTPS
 * URL.
 */
export const useConnectorControls = (
	controls: ConnectorViewerControls,
	onControlsChange: ((controls: ConnectorViewerControls) => void) | undefined,
	isVisible = true,
): void => {
	const onRefresh = controls.refresh?.onRefresh;
	const isRefreshing = controls.refresh?.isRefreshing;
	const onOpenCalendar = controls.onOpenCalendar;
	const onAddToContext = controls.addToContext?.onAddToContext;
	const isBusy = controls.addToContext?.isBusy;
	const href = safeHttpsUrl(controls.openIn?.href);
	const label = controls.openIn?.label;
	useEffect(() => {
		if (!isVisible || !onControlsChange) return;
		onControlsChange({
			refresh: onRefresh
				? { onRefresh, isRefreshing: isRefreshing ?? false }
				: undefined,
			onOpenCalendar,
			addToContext: onAddToContext
				? { onAddToContext, isBusy: isBusy ?? false }
				: undefined,
			openIn: href && label ? { href, label } : undefined,
		});
	}, [
		isVisible,
		onControlsChange,
		onRefresh,
		isRefreshing,
		onOpenCalendar,
		onAddToContext,
		isBusy,
		href,
		label,
	]);
};
