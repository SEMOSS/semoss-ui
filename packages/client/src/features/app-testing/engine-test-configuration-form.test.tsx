import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EngineTestConfigurationForm } from "./engine-test-configuration-form";

const api = vi.hoisted(() => ({
	save: vi.fn(),
	create: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("@/api/app-testing", () => ({
	saveEngineTestConfiguration: api.save,
	createAppTestDatabase: api.create,
	deleteEngineTestConfiguration: api.remove,
}));
beforeEach(() => {
	api.save.mockReset();
	api.create.mockReset();
	api.remove.mockReset();
});
afterEach(cleanup);

it("retains entered engine IDs on a rejected save and retries without changing app code", async () => {
	const changed = vi.fn();
	api.save
		.mockRejectedValueOnce(new Error("Test database is not isolated"))
		.mockResolvedValueOnce({});
	render(
		<EngineTestConfigurationForm
			appId="app"
			configuration={null}
			isLocked={false}
			onChanged={changed}
		/>,
	);
	fireEvent.click(screen.getByText("Test database configuration"));
	fireEvent.change(
		screen.getByRole("textbox", { name: "Real database ID (required)" }),
		{ target: { value: "real" } },
	);
	fireEvent.change(
		screen.getByRole("textbox", { name: "Test database ID (required)" }),
		{ target: { value: "fixture" } },
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Save database mapping" }),
	);
	await screen.findByText("Test database is not isolated");
	expect(changed).not.toHaveBeenCalled();
	expect(
		(
			screen.getByRole("textbox", {
				name: "Real database ID (required)",
			}) as HTMLInputElement
		).value,
	).toBe("real");
	fireEvent.click(
		screen.getByRole("button", { name: "Save database mapping" }),
	);
	await waitFor(() => expect(changed).toHaveBeenCalledOnce());
	expect(api.save).toHaveBeenLastCalledWith("app", {
		name: "Test databases",
		mappings: [{ realEngineId: "real", testEngineId: "fixture" }],
	});
});

it("provisions an empty engine but requires an explicit mapping save", async () => {
	api.create.mockResolvedValue("new-fixture");
	render(
		<EngineTestConfigurationForm
			appId="app"
			configuration={null}
			isLocked={false}
			onChanged={vi.fn()}
		/>,
	);
	fireEvent.click(screen.getByText("Test database configuration"));
	fireEvent.click(
		screen.getByRole("button", { name: "Create empty test database" }),
	);
	await screen.findByText(/Created an empty test database/);
	expect(
		(
			screen.getByRole("textbox", {
				name: "Test database ID (required)",
			}) as HTMLInputElement
		).value,
	).toBe("new-fixture");
	expect(api.save).not.toHaveBeenCalled();
});
