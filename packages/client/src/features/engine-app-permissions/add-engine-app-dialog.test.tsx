import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { savePermissionBatches } from "@semoss/sdk";
import type { ProjectSelect } from "@semoss/shared";
import { AddEngineAppDialog } from "./add-engine-app-dialog";
import type { EngineAppModel } from "./engine-app-permissions";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	savePermissionBatches: vi.fn(),
}));

/**
 * The shared picker reads MyProjects; this one is a button that picks the
 * Intake Form app, with the field wiring the dialog gives the real one and the
 * list the dialog asks it for.
 */
vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	ProjectSelect: ({
		id,
		name,
		onChange,
		ref,
		projectTypes,
		admin,
		"aria-describedby": describedBy,
		"aria-invalid": isInvalid,
	}: ComponentProps<typeof ProjectSelect>) => (
		<button
			ref={ref}
			id={id}
			type="button"
			data-project-types={projectTypes?.join(",")}
			data-admin={admin}
			aria-describedby={describedBy}
			aria-invalid={isInvalid}
			onClick={() =>
				onChange({
					project_id: "app1",
					project_name: "intake_form",
					project_display_name: "Intake Form",
					project_type: "CODE",
				})
			}
		>
			{name || "Select"}
		</button>
	),
}));

/** A model whose owner is adding the app, so the App Limit is offered */
const OWNED_MODEL: EngineAppModel = {
	isCostAvailable: true,
	canChangeLimit: true,
};

/** Opens the dialog for an engine, returning its onClose */
const renderDialog = (model?: EngineAppModel, engineId = "engine-1") => {
	const onClose = vi.fn();
	render(
		<AddEngineAppDialog
			open
			engineId={engineId}
			model={model}
			onClose={onClose}
		/>,
	);
	return onClose;
};

const getApp = () => screen.getByLabelText("App");

const getAuthorize = () =>
	screen.getByRole("button", { name: "Authorize Access" });

describe("AddEngineAppDialog", () => {
	beforeEach(() => {
		vi.mocked(savePermissionBatches)
			.mockReset()
			.mockResolvedValue({ targets: 1, changes: 1 });
		Element.prototype.scrollIntoView = vi.fn();
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("asks for an app only once Authorize Access is pressed without one", async () => {
		const onClose = renderDialog();

		expect(getAuthorize()).toBeEnabled();
		expect(getApp()).toHaveAttribute("aria-invalid", "false");
		expect(screen.queryByText("Pick an app")).not.toBeInTheDocument();

		fireEvent.click(getAuthorize());

		expect(await screen.findByText("Pick an app")).toBeInTheDocument();
		expect(getApp()).toHaveAttribute("aria-invalid", "true");
		expect(getApp()).toHaveAccessibleDescription("Pick an app");
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.click(getApp());

		await waitFor(() =>
			expect(screen.queryByText("Pick an app")).not.toBeInTheDocument(),
		);
		expect(getApp()).toHaveTextContent("Intake Form");
	});

	it("gives the picked app Read-Only access unless another level is chosen, and closes", async () => {
		const onClose = renderDialog();

		fireEvent.click(getApp());
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("app1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "engine-1" },
					changes: [
						{
							action: "ADD",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
							to: { level: "READ_ONLY", endDate: null },
						},
					],
				},
			],
			false,
		);
	});

	it("gives the picked app Editor access when it is chosen", async () => {
		const onClose = renderDialog();

		fireEvent.click(getApp());
		fireEvent.click(screen.getByRole("combobox", { name: "Permission" }));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("app1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "engine-1" },
					changes: [
						{
							action: "ADD",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
							to: { level: "EDIT", endDate: null },
						},
					],
				},
			],
			false,
		);
	});

	it("offers no Author level and no usage limit on an engine that is not a model", async () => {
		renderDialog();

		expect(
			screen.queryByRole("radio", { name: "usageLimit.modes.rules" }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("combobox", { name: "Permission" }));

		expect(
			await screen.findByRole("option", { name: "Read-Only" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Editor" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("option", { name: "Author" }),
		).not.toBeInTheDocument();
	});

	it("keeps Authorize Access enabled for an incomplete app limit, and shows why only when it is pressed", async () => {
		const onClose = renderDialog(OWNED_MODEL, "model-1");

		fireEvent.click(getApp());
		fireEvent.click(
			screen.getByRole("radio", { name: "usageLimit.modes.rules" }),
		);

		const amount = screen.getByRole("textbox", {
			name: "usageLimit.rule.amount",
		});
		expect(amount).toHaveAttribute("aria-invalid", "false");
		expect(getAuthorize()).toBeEnabled();

		fireEvent.click(getAuthorize());

		await waitFor(() =>
			expect(amount).toHaveAttribute("aria-invalid", "true"),
		);
		expect(amount).toHaveAccessibleDescription("Enter an amount above 0");
		await waitFor(() => expect(amount).toHaveFocus());
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.change(amount, { target: { value: "5000" } });
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("app1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						{
							action: "ADD",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
							to: {
								level: "READ_ONLY",
								endDate: null,
								usageLimit: {
									unlimited: false,
									rules: [
										{
											metric: "TOKENS",
											amount: 5000,
											window: "DAY",
											counts: "SHARED",
										},
									],
								},
							},
						},
					],
				},
			],
			false,
		);
	});

	it("shows a missing app and an incomplete app limit on the same press", async () => {
		renderDialog(OWNED_MODEL, "model-1");

		fireEvent.click(
			screen.getByRole("radio", { name: "usageLimit.modes.rules" }),
		);
		fireEvent.click(getAuthorize());

		expect(await screen.findByText("Pick an app")).toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: "usageLimit.rule.amount" }),
		).toHaveAttribute("aria-invalid", "true");
		expect(savePermissionBatches).not.toHaveBeenCalled();
	});

	it("adds the app with no limit from a user who cannot set usage limits, and says why", async () => {
		const onClose = renderDialog(
			{ isCostAvailable: true, canChangeLimit: false },
			"model-1",
		);

		expect(
			screen.queryByRole("radio", { name: "usageLimit.modes.rules" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(/Only owners can set usage limits/),
		).toBeInTheDocument();

		fireEvent.click(getApp());
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("app1"));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						{
							action: "ADD",
							subject: {
								category: "ENGINE",
								id: "app1",
								type: "PROJECT",
							},
							to: { level: "READ_ONLY", endDate: null },
						},
					],
				},
			],
			false,
		);
	});

	it("offers the apps the user can see, of the types the catalog lists as apps", () => {
		renderDialog();

		expect(getApp()).toHaveAttribute("data-project-types", "CODE,BLOCKS");
		expect(getApp()).toHaveAttribute("data-admin", "false");
	});

	it("offers every app and saves in admin mode when asked", async () => {
		const onClose = vi.fn();
		render(
			<AddEngineAppDialog
				open
				engineId="engine-1"
				admin
				onClose={onClose}
			/>,
		);

		expect(getApp()).toHaveAttribute("data-project-types", "CODE,BLOCKS");
		expect(getApp()).toHaveAttribute("data-admin", "true");
		fireEvent.click(getApp());
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith("app1"));
		expect(vi.mocked(savePermissionBatches).mock.calls[0][1]).toBe(true);
	});

	it("shows the backend's refusal for an app that already has access, and stays open", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error("Intake Form already has access to this engine"),
		);
		const onClose = renderDialog();

		fireEvent.click(getApp());
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText(
				"Intake Form already has access to this engine",
			),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		await waitFor(() => expect(getAuthorize()).toBeEnabled());
		expect(getApp()).toHaveTextContent("Intake Form");
	});

	it("closes without saving on Cancel", () => {
		const onClose = renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith();
		expect(savePermissionBatches).not.toHaveBeenCalled();
	});
});
