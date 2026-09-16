import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useWorkbenchStoreApi } from "../hooks";
import { createWorkbenchStore } from "../stores";
import { WorkbenchProvider } from "./workbench.context";

const Probe = ({ label }: { label: string }) => {
	const [mountValue] = useState(() => label);
	return <span>{`${label}:${mountValue}`}</span>;
};

describe("WorkbenchProvider", () => {
	it("recreates the store and remounts children when the host keys it", () => {
		// The dock has no identity of its own, so a host that wants a fresh one
		// says so the way it would for any component: with a `key`.
		const { rerender } = render(
			<WorkbenchProvider key="editable" components={{}}>
				<Probe label="editable" />
			</WorkbenchProvider>,
		);
		expect(screen.getByText("editable:editable")).toBeVisible();

		rerender(
			<WorkbenchProvider key="read-only" components={{}}>
				<Probe label="read-only" />
			</WorkbenchProvider>,
		);

		expect(screen.getByText("read-only:read-only")).toBeVisible();
	});

	it("keeps one store for the life of the provider", () => {
		let seen: unknown;
		const StoreProbe = () => {
			seen = useWorkbenchStoreApi();
			return null;
		};
		const { rerender } = render(
			<WorkbenchProvider components={{}}>
				<StoreProbe />
			</WorkbenchProvider>,
		);
		const first = seen;

		rerender(
			<WorkbenchProvider components={{}}>
				<StoreProbe />
			</WorkbenchProvider>,
		);

		// a fresh `components` literal must not throw away the arrangement
		expect(seen).toBe(first);
	});

	it("hands down a store the host made, instead of making one", () => {
		// the shape a host takes when the dock has to outlive its shell
		const store = createWorkbenchStore({ components: {} });
		let seen: unknown;
		const StoreProbe = () => {
			seen = useWorkbenchStoreApi();
			return null;
		};

		render(
			<WorkbenchProvider store={store}>
				<StoreProbe />
			</WorkbenchProvider>,
		);

		expect(seen).toBe(store);
	});
});
