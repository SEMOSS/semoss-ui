import { matchRoutes } from "react-router";
import { NotFoundPage } from "@/pages/not-found.page";
import { routes } from "@/pages/route-config";

function leafRoute(path: string) {
	return matchRoutes(routes, path)?.at(-1)?.route;
}

describe("collaboration routes", () => {
	it.each([
		["/room/room-one/unsupported", "room-not-found"],
		["/agents/agent-one", "agent-not-found"],
		["/agents/agent-one/unsupported", "agent-path-not-found"],
	])("shows not found for unsupported nested path %s", (path, id) => {
		expect(leafRoute(path)).toMatchObject({
			id,
			Component: NotFoundPage,
		});
	});

	it.each([
		["/room/room-one", "room"],
		["/agents/agent-one/settings", "agent-settings"],
	])("preserves the valid route for %s", (path, id) => {
		expect(leafRoute(path)?.id).toBe(id);
	});

	it("lazy loads leaf page modules", async () => {
		const route = leafRoute("/room/room-one");

		expect(route?.lazy).toEqual(expect.any(Function));
		if (typeof route?.lazy !== "function") {
			throw new Error("Expected a lazy route module");
		}
		await expect(route.lazy()).resolves.toMatchObject({
			Component: expect.any(Function),
		});
	});
});
