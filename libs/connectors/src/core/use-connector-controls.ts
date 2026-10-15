import { useEffect } from "react";
import type { ConnectorViewerControls } from "./connector.types";

/** Publish visible viewer actions without clearing another retained viewer's controls. */
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
	const href = controls.openIn?.href;
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
