import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, type Role, SessionStore } from "@semoss/sdk";
import { SessionProvider, useSessionPermissions } from "@semoss/sdk/react";
import type { ResourceType } from "../types/access.types";
import { useAccess } from "./use-access";

// the real hook unless a case says otherwise, so cases can stand in for the
// session's states that only a backend read could produce
vi.mock("@semoss/sdk/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk/react")>();
	return {
		...actual,
		useSessionPermissions: vi.fn(actual.useSessionPermissions),
	};
});

const sessionPermissions = vi.mocked(useSessionPermissions);

/** What the session's hook answers with nothing known yet. */
const SESSION_LOADING: ReturnType<typeof useSessionPermissions> = {
	status: "LOADING",
	permission: null,
	canEdit: false,
	isOwner: false,
	refreshing: false,
	error: null,
	refresh: vi.fn(),
	sync: vi.fn(),
};

/** Have the session's hook answer `state` for every resource. */
const answer = (
	state: Partial<ReturnType<typeof useSessionPermissions>>,
): void => {
	sessionPermissions.mockReturnValue({ ...SESSION_LOADING, ...state });
};

interface AccessProbeProps {
	type: ResourceType;
	resourceId: string;
}

/** Surfaces every field of the access state as text so tests can assert on it. */
const AccessProbe = ({ type, resourceId }: AccessProbeProps) => {
	const access = useAccess(type, resourceId);
	return (
		<div>
			<span>status:{access.status}</span>
			{access.status === "ready" ? (
				<>
					<span>permission:{access.permission}</span>
					<span>readOnly:{String(access.readOnly)}</span>
					<span>refreshing:{String(access.refreshing)}</span>
					<span>refreshError:{access.refreshError ?? ""}</span>
				</>
			) : null}
			{access.status === "error" ? (
				<span>error:{access.error}</span>
			) : null}
			{access.status !== "loading" ? (
				<button
					type="button"
					onClick={() => void access.refresh().catch(() => undefined)}
				>
					Refresh
				</button>
			) : null}
		</div>
	);
};

/**
 * Render the probe for one resource under a session of its own.
 *
 * @param type - The kind of resource.
 * @param resourceId - The resource's id.
 * @param seed - Changes the session before the probe first renders.
 * @returns The session, to change or inspect its permissions.
 */
const renderAccess = (
	type: ResourceType = "ENGINE",
	resourceId = "engine-1",
	seed?: (session: SessionStore) => void,
): SessionStore => {
	const session = new SessionStore({ config: new ConfigStore() });
	seed?.(session);
	render(
		<SessionProvider session={session}>
			<AccessProbe type={type} resourceId={resourceId} />
		</SessionProvider>,
	);
	return session;
};

describe("useAccess", () => {
	// a block body: a function `beforeEach` returns runs as its teardown, and
	// `mockReset` returns the hook
	beforeEach(() => {
		sessionPermissions.mockReset();
	});

	it("asks the session about the resource it is given", () => {
		answer({});
		renderAccess("PROJECT", "project-1");

		expect(sessionPermissions).toHaveBeenCalledWith("PROJECT", "project-1");
	});

	it("is loading until the session knows the permission", () => {
		answer({});
		renderAccess();

		expect(screen.getByText("status:loading")).toBeVisible();
	});

	it("is ready and editable for an owner", () => {
		answer({ status: "READY", permission: "OWNER", canEdit: true });
		renderAccess();

		expect(screen.getByText("permission:OWNER")).toBeVisible();
		expect(screen.getByText("readOnly:false")).toBeVisible();
		expect(screen.getByText("refreshing:false")).toBeVisible();
		expect(screen.getByText("refreshError:")).toBeVisible();
	});

	it("is read-only for a permission that cannot edit", () => {
		answer({ status: "READY", permission: "READ_ONLY", canEdit: false });
		renderAccess();

		expect(screen.getByText("permission:READ_ONLY")).toBeVisible();
		expect(screen.getByText("readOnly:true")).toBeVisible();
	});

	it("fails closed with the session's error when permission never resolves", () => {
		answer({ status: "ERROR", error: "Access unavailable" });
		renderAccess();

		expect(screen.getByText("error:Access unavailable")).toBeVisible();
	});

	it("keeps stale permission and reports refreshing while a refresh is in flight", () => {
		answer({
			status: "READY",
			permission: "OWNER",
			canEdit: true,
			refreshing: true,
		});
		renderAccess();

		expect(screen.getByText("permission:OWNER")).toBeVisible();
		expect(screen.getByText("refreshing:true")).toBeVisible();
	});

	it("keeps stale permission and reports a refresh error when a refresh fails", () => {
		answer({
			status: "READY",
			permission: "OWNER",
			canEdit: true,
			error: "Refresh failed",
		});
		renderAccess();

		expect(screen.getByText("permission:OWNER")).toBeVisible();
		expect(screen.getByText("refreshError:Refresh failed")).toBeVisible();
	});

	it("refreshes through the session", () => {
		const refresh = vi.fn((): Promise<Role> => Promise.resolve("EDIT"));
		answer({
			status: "READY",
			permission: "OWNER",
			canEdit: true,
			refresh,
		});
		renderAccess();

		act(() => screen.getByRole("button", { name: "Refresh" }).click());

		expect(refresh).toHaveBeenCalledOnce();
	});

	it("reads a permission the session already knows", () => {
		renderAccess("PROJECT", "project-1", (session) =>
			session.permissions.sync("PROJECT", "project-1", "READ_ONLY"),
		);

		expect(screen.getByText("permission:READ_ONLY")).toBeVisible();
		expect(screen.getByText("readOnly:true")).toBeVisible();
	});

	it("resolves an insight to editable through the session", async () => {
		const session = renderAccess("INSIGHT", "insight-1");

		await waitFor(() =>
			expect(screen.getByText("permission:EDIT")).toBeVisible(),
		);
		expect(session.permissions.get("INSIGHT", "insight-1")).toEqual({
			status: "SUCCESS",
			permission: "EDIT",
		});
	});

	it("treats a scope with no resource of its own as an editable insight", () => {
		const session = renderAccess("INSIGHT", "");

		expect(screen.getByText("permission:EDIT")).toBeVisible();
		expect(screen.getByText("readOnly:false")).toBeVisible();
		expect(session.permissions.getSnapshot()).toEqual({});
	});

	it("fails closed for a project or engine with no id", () => {
		renderAccess("ENGINE", "");

		expect(
			screen.getByText("error:No resource to read a permission for"),
		).toBeVisible();
	});

	it("reads the permission again after the session clears it", async () => {
		const session = renderAccess("INSIGHT", "insight-1", (seeded) =>
			seeded.permissions.sync("INSIGHT", "insight-1", "READ_ONLY"),
		);
		expect(screen.getByText("permission:READ_ONLY")).toBeVisible();

		// as a sign in or out does
		act(() => session.permissions.clear());

		await waitFor(() =>
			expect(screen.getByText("permission:EDIT")).toBeVisible(),
		);
	});
});
