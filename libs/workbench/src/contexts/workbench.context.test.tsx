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
	it("recreates the store and remounts children when the cache key changes", () => {
		const { rerender } = render(
			<WorkbenchProvider cacheKey="editable">
				<Probe label="editable" />
			</WorkbenchProvider>,
		);
		expect(screen.getByText("editable:editable")).toBeVisible();

		rerender(
			<WorkbenchProvider cacheKey="read-only">
				<Probe label="read-only" />
			</WorkbenchProvider>,
		);

		expect(screen.getByText("read-only:read-only")).toBeVisible();
	});

	it("hands down a store the host made, instead of making one", () => {
		// the shape a host takes when the dock has to outlive its shell
		const store = createWorkbenchStore("host-owned");
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
