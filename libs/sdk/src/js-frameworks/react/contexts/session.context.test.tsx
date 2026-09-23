// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAccessStore, createSessionStore } from "../../../stores/session";
import { useAccess } from "../hooks/use-access";
import { useSession } from "../hooks/use-session";
import { AccessProvider } from "./access.context";
import { SessionProvider } from "./session.context";

const AuthenticationProbe = ({ label }: { label: string }) => {
	const authentication = useSession(
		(state) => state.lifecycle.authentication,
	);
	return <span>{`${label}:${authentication}`}</span>;
};

const InsightAccessProbe = () => {
	const access = useAccess("INSIGHT", "insight-1");
	return (
		<span>
			{access.status === "ready" ? access.permission : access.status}
		</span>
	);
};

describe("SDK React providers", () => {
	it("keeps sibling SessionProvider stores isolated", () => {
		const first = createSessionStore();
		const second = createSessionStore();
		render(
			<>
				<SessionProvider store={first}>
					<AuthenticationProbe label="first" />
				</SessionProvider>
				<SessionProvider store={second}>
					<AuthenticationProbe label="second" />
				</SessionProvider>
			</>,
		);

		act(() => {
			first.setState((state) => ({
				lifecycle: {
					...state.lifecycle,
					authentication: "authenticated",
				},
			}));
		});

		expect(screen.getByText("first:authenticated")).toBeTruthy();
		expect(screen.getByText("second:unknown")).toBeTruthy();
	});

	it("supports a standalone AccessProvider", async () => {
		const store = createAccessStore();
		render(
			<AccessProvider store={store}>
				<InsightAccessProbe />
			</AccessProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("EDIT")).toBeTruthy();
		});
	});
});
