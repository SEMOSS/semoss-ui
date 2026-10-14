import { act, renderHook } from "@testing-library/react";
import {
	dashboardStorageKey,
	moveWidget,
	presetWidgets,
	readDashboardPreferences,
	saveDashboardPreferences,
} from "./dashboard-layout";
import { useDashboardLayout } from "./use-dashboard-layout";

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

it("isolates saved layouts by account and deployment and rejects corrupt geometry", () => {
	const key = dashboardStorageKey("one", "deployment-a");
	saveDashboardPreferences(key, {
		version: 1,
		widgets: presetWidgets("Focus"),
		presets: [],
	});
	expect(readDashboardPreferences(key).preferences.widgets[0].kind).toBe(
		"needs",
	);
	expect(
		readDashboardPreferences(dashboardStorageKey("two", "deployment-a"))
			.preferences.widgets[0].kind,
	).toBe("day");
	expect(
		readDashboardPreferences(dashboardStorageKey("one", "deployment-b"))
			.preferences.widgets[0].kind,
	).toBe("day");
	localStorage.setItem(
		key,
		JSON.stringify({
			version: 1,
			widgets: [{ ...presetWidgets()[0], width: 999 }],
			presets: [],
		}),
	);
	expect(readDashboardPreferences(key).error).toContain("could not be read");
});

it("keeps presets, visibility, and reorder changes reversible until Save", () => {
	const { result, unmount } = renderHook(() => useDashboardLayout("layout"));
	act(() => result.current.begin());
	act(() => result.current.applyPreset("Focus"));
	act(() => result.current.savePreset("My focus"));
	expect(localStorage.getItem("layout")).toBeNull();
	act(() => result.current.cancel());
	expect(result.current.draft.presets).toEqual([]);
	expect(result.current.preferences.widgets[0].kind).toBe("day");
	act(() => result.current.begin());
	act(() =>
		result.current.setWidgets(
			moveWidget(result.current.draft.widgets, "email", "day").map(
				(widget) => ({ ...widget, visible: widget.kind !== "agents" }),
			),
		),
	);
	act(() => result.current.savePreset("Mail first"));
	act(() => result.current.save());
	unmount();
	const restored = renderHook(() => useDashboardLayout("layout"));
	expect(restored.result.current.preferences.widgets[0].kind).toBe("email");
	expect(
		restored.result.current.preferences.widgets.find(
			(widget) => widget.kind === "agents",
		)?.visible,
	).toBe(false);
	expect(restored.result.current.preferences.presets[0].name).toBe(
		"Mail first",
	);
});

it("keeps unsaved changes available when browser storage fails", () => {
	const { result } = renderHook(() => useDashboardLayout("layout"));
	act(() => result.current.begin());
	act(() => result.current.applyPreset("Meetings"));
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("quota");
	});
	act(() => result.current.save());
	expect(result.current.isEditing).toBe(true);
	expect(result.current.error).toContain("could not be saved");
	expect(result.current.draft.widgets[1].kind).toBe("email");
});
