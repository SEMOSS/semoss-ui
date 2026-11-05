import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import { useAccess } from "./use-access";

/** Render the hook against a session of its own. */
const renderAccess = (
	id: string,
	session = new SessionStore({ config: new ConfigStore() }),
	type: "ENGINE" | "INSIGHT" = "ENGINE",
) =>
	renderHook(() => useAccess(type, id), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<SessionProvider session={session}>{children}</SessionProvider>
		),
	});

describe("useAccess", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("is editable without a resource", () => {
		const { result } = renderAccess("", undefined, "INSIGHT");

		expect(result.current).toMatchObject({
			status: "ready",
			permission: "EDIT",
			readOnly: false,
		});
	});

	it("is an error for an engine without an id", () => {
		const { result } = renderAccess("");

		expect(result.current.status).toBe("error");
	});

	it("is read only for a read only permission", () => {
		const session = new SessionStore({ config: new ConfigStore() });
		session.permissions.sync("ENGINE", "engine-1", "READ_ONLY");

		const { result } = renderAccess("engine-1", session);

		expect(result.current).toMatchObject({
			status: "ready",
			permission: "READ_ONLY",
			readOnly: true,
		});
	});

	it("reports an error when no permission could be read", async () => {
		// the permission read fails at the transport
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("denied"));

		const { result } = renderAccess("engine-2");

		expect(result.current.status).toBe("loading");
		await waitFor(() => expect(result.current.status).toBe("error"));
	});
});
