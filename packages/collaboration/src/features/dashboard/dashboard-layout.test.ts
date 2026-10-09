import {
	dashboardStorageKey,
	readDashboardPreferences,
} from "./dashboard-layout";

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

it("preserves legacy pinned app metadata and account isolation", () => {
	const key = dashboardStorageKey("one", "deployment-a");
	const app = {
		id: "pinned-app",
		kind: "app",
		title: "Sales",
		visible: true,
		width: 6,
		height: 64,
		density: "comfortable",
		filter: "all",
		appId: "sales",
	};
	localStorage.setItem(
		key,
		JSON.stringify({ version: 1, widgets: [app], presets: [] }),
	);
	expect(readDashboardPreferences(key).preferences.widgets).toEqual([app]);
	expect(
		readDashboardPreferences(dashboardStorageKey("two", "deployment-a"))
			.preferences.widgets,
	).toEqual([]);
	expect(
		readDashboardPreferences(dashboardStorageKey("one", "deployment-b"))
			.preferences.widgets,
	).toEqual([]);
});

it("reports invalid or unavailable legacy storage without inventing pinned apps", () => {
	localStorage.setItem("layout", "{invalid");
	expect(readDashboardPreferences("layout").preferences.widgets).toEqual([]);
	expect(readDashboardPreferences("layout").error).not.toBe("");
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("Denied");
	});
	expect(readDashboardPreferences("layout").error).toContain("unavailable");
});
