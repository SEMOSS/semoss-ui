import { useCallback } from "react";
import type { FilterStore } from "@/lib/dashboardFilters";
import type { EventParamStore } from "@/lib/eventParamStore";
import { publishedPortalUrl } from "@/lib/portalUrl";
import type { VizEvent, VizTriggerPayload } from "@/types/dashboard";

/**
 * Stable filter ID for event-triggered filters on a visualization.
 * All filter events from the same viz share this ID so any unfilter
 * event on the same viz can clear it regardless of which filter event set it.
 */
function eventFilterId(vizId: string) {
	return `__evt_filter__${vizId}`;
}

export function useVizEvents(
	events: VizEvent[] | undefined,
	thisVizId: string,
	filterStore: FilterStore | null,
	eventParamStore: EventParamStore | null = null,
): { onTrigger: (payload: VizTriggerPayload) => void } {
	const onTrigger = useCallback(
		(payload: VizTriggerPayload) => {
			if (!events?.length) return;
			const enabled = events.filter(
				(ev) => ev.enabled && ev.trigger === payload.trigger,
			);
			for (const ev of enabled) {
				// click/dblclick: optional modifier key must be held
				if (
					(ev.trigger === "click" || ev.trigger === "dblclick") &&
					ev.clickModifier
				) {
					const mods = payload.modifiers ?? {
						ctrl: false,
						shift: false,
						alt: false,
					};
					const held =
						(ev.clickModifier === "ctrl" && mods.ctrl) ||
						(ev.clickModifier === "shift" && mods.shift) ||
						(ev.clickModifier === "alt" && mods.alt);
					if (!held) continue;
				}
				// keypress: specific key must match
				if (ev.trigger === "keypress" && ev.keyBind) {
					if (payload.key !== ev.keyBind) continue;
				}

				switch (ev.action) {
					case "filter": {
						if (!filterStore) break;
						const targets =
							ev.applyTo === "specific"
								? (ev.targetVizIds ?? [])
								: [];
						const filterRow =
							payload.row ??
							(payload.label != null
								? { __label: payload.label }
								: undefined);
						filterStore.setFilter({
							id: eventFilterId(thisVizId),
							column: "",
							values: [],
							targets,
							row: filterRow,
						});
						break;
					}

					case "unfilter": {
						filterStore?.clearFilter(eventFilterId(thisVizId));
						break;
					}

					case "open_url": {
						if (!ev.url) break;
						const features =
							ev.urlTarget === "window"
								? "noopener,noreferrer,width=1280,height=800"
								: "noopener,noreferrer";
						window.open(ev.url, "_blank", features);
						break;
					}

					case "open_app": {
						if (!ev.appId) break;
						window.open(
							publishedPortalUrl(ev.appId),
							"_blank",
							"noopener,noreferrer",
						);
						break;
					}

					case "custom_query": {
						if (!ev.targetVizId || !eventParamStore) break;
						const paramValues: Record<string, string> = {};
						for (const { column, paramName } of ev.columnParamMap ??
							[]) {
							const val = payload.row?.[column];
							if (val != null)
								paramValues[paramName] = String(val);
						}
						if (Object.keys(paramValues).length > 0) {
							eventParamStore.trigger(
								ev.targetVizId,
								paramValues,
							);
						}
						break;
					}
				}
			}
		},
		[events, thisVizId, filterStore, eventParamStore],
	);

	return { onTrigger };
}
