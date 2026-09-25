import { isValidElement } from "react";
import { matchRoutes, Navigate } from "react-router";
import { NotFoundPage } from "@/pages/not-found.page";
import { routes } from "@/pages/route-config";

function leafRoute(path: string) {
	return matchRoutes(routes, path)?.at(-1)?.route;
}

describe("collaboration routes", () => {
	it.each([
		["/room/room-one/unsupported", "room-not-found"],
		["/unknown", "not-found"],
	])("shows not found for unsupported nested path %s", (path, id) => {
		expect(leafRoute(path)).toMatchObject({
			id,
			Component: NotFoundPage,
		});
	});

	it.each([
		["/room/room-one", "room"],
		["/login", "login"],
		["/work", "work"],
		["/work/waiting", "work/waiting"],
		["/work/done", "work/done"],
		["/work/topic/client", "work/topic/:topicId"],
		["/work/thread/thread-one", "work-thread"],
		["/brain", "brain"],
		["/brain/people/person-one", "brain/people/:personId"],
		["/brain/threads/thread-one", "brain/threads/:threadId"],
		["/brain/topics/client", "brain/topics/:topicId"],
		["/brain/profile", "brain/profile"],
		["/brain/sources", "brain/sources"],
	])("preserves the valid route for %s", (path, id) => {
		expect(leafRoute(path)?.id).toBe(id);
	});

	it.each([
		["/", "/work"],
		["/room", "/work"],
		["/new", "/work"],
		["/agents", "/brain"],
		["/agents/agent-one", "/brain"],
		["/agents/agent-one/settings", "/brain"],
		["/settings", "/brain/sources"],
	])("redirects obsolete entry %s to %s", (path, destination) => {
		const element = leafRoute(path)?.element;
		expect(isValidElement(element)).toBe(true);
		if (!isValidElement<{ to: string; replace: boolean }>(element)) {
			throw new Error("Expected a redirect element");
		}
		expect(element.type).toBe(Navigate);
		expect(element.props).toMatchObject({ to: destination, replace: true });
	});

	it.each(["/room/room-one", "/work", "/brain", "/work/thread/thread-one"])(
		"lazy loads leaf page modules for %s",
		async (path) => {
			const route = leafRoute(path);

			expect(route?.lazy).toEqual(expect.any(Function));
			if (typeof route?.lazy !== "function") {
				throw new Error("Expected a lazy route module");
			}
			await expect(route.lazy()).resolves.toMatchObject({
				Component: expect.any(Function),
			});
		},
	);
});
