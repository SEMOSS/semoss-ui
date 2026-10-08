import { isValidElement } from "react";
import { matchRoutes, Navigate } from "react-router";
import { NotFoundPage } from "@/pages/not-found.page";
import { routes } from "@/pages/route-config";

function leafRoute(path: string) {
	return matchRoutes(routes, path)?.at(-1)?.route;
}

describe("collaboration routes", () => {
	it.each([
		["/thread/thread-one/unsupported", "not-found"],
		["/thread/room%3Aroom-one/unsupported", "not-found"],
		["/room/room-one", "not-found"],
		["/room/room-one/unsupported", "not-found"],
		["/work/thread/thread-one", "not-found"],
		["/unknown", "not-found"],
		["/new", "not-found"],
		["/settings/unknown", "not-found"],
	])("shows not found for unsupported nested path %s", (path, id) => {
		expect(leafRoute(path)).toMatchObject({
			id,
			Component: NotFoundPage,
		});
	});

	it.each([
		["/thread/room%3Aroom-one", "thread"],
		["/login", "login"],
		["/work", "work"],
		["/work/all", "work/all"],
		["/work/waiting", "work/waiting"],
		["/work/done", "work/done"],
		["/work/topic/client", "work/topic/:topicId"],
		["/thread/thread-one", "thread"],
		["/thread/session%3Achat-one", "thread"],
		["/thread/connected%3Aoutlook%3Amail-one", "thread"],
		["/brain", "brain"],
		["/brain/memory", "brain/memory"],
		["/brain/people/person-one", "brain/people/:personId"],
		["/brain/threads/thread-one", "brain/threads/:threadId"],
		["/brain/topics/client", "brain/topics/:topicId"],
		["/brain/sources", "brain/sources"],
		...["about-you", "appearance", "rules", "data"].map((section) => [
			`/settings/${section}`,
			`settings/${section}`,
		]),
	])("preserves the valid route for %s", (path, id) => {
		expect(leafRoute(path)?.id).toBe(id);
	});

	it.each([
		["/room", "/work"],

		["/agents", "/brain"],
		["/agents/agent-one", "/brain"],
		["/agents/agent-one/settings", "/brain"],
		["/settings", "/settings/about-you"],
		["/settings/dashboard", "/settings/about-you"],
		["/brain/profile", "/settings/about-you"],
	])("redirects obsolete entry %s to %s", (path, destination) => {
		const element = leafRoute(path)?.element;
		expect(isValidElement(element)).toBe(true);
		if (!isValidElement<{ to: string; replace: boolean }>(element)) {
			throw new Error("Expected a redirect element");
		}
		expect(element.type).toBe(Navigate);
		expect(element.props).toMatchObject({ to: destination, replace: true });
	});

	it.each([
		"/",
		"/thread/room%3Aroom-one",
		"/work",
		"/brain",
		"/thread/thread-one",
		"/settings/appearance",
	])("lazy loads page modules for %s", async (path) => {
		const route = matchRoutes(routes, path)
			?.filter(({ route }) => route.lazy)
			.at(-1)?.route;

		expect(route?.lazy).toEqual(expect.any(Function));
		if (typeof route?.lazy !== "function") {
			throw new Error("Expected a lazy route module");
		}
		await expect(route.lazy()).resolves.toMatchObject({
			Component: expect.any(Function),
		});
	});
});
