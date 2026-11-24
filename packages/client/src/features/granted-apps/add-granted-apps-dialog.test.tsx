import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { savePermissionBatches } from "@semoss/sdk";
import type { Project, ProjectSelect } from "@semoss/shared";
import type { GrantModel } from "@/features/grants/grants";
import { AddGrantedAppsDialog } from "./add-granted-apps-dialog";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	savePermissionBatches: vi.fn(),
}));

/** The Intake Form app, a code app */
const INTAKE: Project = {
	project_id: "app1",
	project_name: "intake_form",
	project_display_name: "Intake Form",
	project_type: "CODE",
};

/** The Reports app, a blocks app */
const REPORTS: Project = {
	project_id: "app2",
	project_name: "reports",
	project_display_name: "Reports",
	project_type: "BLOCKS",
};

/** The app the stand-in picker picks; a test sets it before a click */
let pickedApp: Project = INTAKE;

/**
 * The shared picker reads MyProjects; this one is a button that picks the app
 * a test names, with the field wiring the dialog gives the real one and the
 * types and mode the dialog asks it for.
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
			onClick={() => onChange(pickedApp)}
		>
			{name || "Select"}
		</button>
	),
}));

/** A model whose owner is adding the apps, so the App Limit is offered */
const OWNED_MODEL: GrantModel = {
	isCostAvailable: true,
	canChangeLimit: true,
};

/** Opens the dialog for an engine, or a skill when asked, returning its onClose */
const renderDialog = ({
	model,
	engineId = "engine-1",
	skillId,
	grantedAppIds,
	admin,
}: {
	model?: GrantModel;
	engineId?: string;
	skillId?: string;
	grantedAppIds?: string[];
	admin?: boolean;
} = {}) => {
	const onClose = vi.fn();
	render(
		<AddGrantedAppsDialog
			open
			target={
				skillId
					? { resourceType: "PROJECT", id: skillId }
					: { resourceType: "ENGINE", id: engineId }
			}
			targetNoun={skillId ? "skill" : "engine"}
			grantedAppIds={grantedAppIds}
			model={model}
			admin={admin}
			onClose={onClose}
		/>,
	);
	return onClose;
};

const getPicker = () => screen.getByLabelText("App or Agent");

const getAuthorize = () =>
	screen.getByRole("button", { name: "Authorize Access" });

const getList = () => screen.getByRole("region", { name: /To Authorize/ });

/** Picks an app with the stand-in picker */
const pick = (app: Project) => {
	pickedApp = app;
	fireEvent.click(getPicker());
};

/** The change that adds an app, with the grant sent */
const added = (id: string, to: unknown) => ({
	action: "ADD",
	subject: { category: "ENGINE", id, type: "PROJECT" },
	to,
});

describe("AddGrantedAppsDialog", () => {
	beforeEach(() => {
		pickedApp = INTAKE;
		vi.mocked(savePermissionBatches)
			.mockReset()
			.mockResolvedValue({ targets: 1, changes: 2 });
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

	it("asks for an app only once Authorize Access is pressed with an empty list", async () => {
		const onClose = renderDialog();

		expect(getAuthorize()).toBeEnabled();
		expect(getPicker()).toHaveAttribute("aria-invalid", "false");
		expect(
			screen.getByText("No apps or agents picked yet"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Pick at least one app or agent"),
		).not.toBeInTheDocument();

		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("Pick at least one app or agent"),
		).toBeInTheDocument();
		expect(getPicker()).toHaveAttribute("aria-invalid", "true");
		expect(getPicker()).toHaveAccessibleDescription(
			/Pick at least one app/,
		);
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		pick(INTAKE);

		await waitFor(() =>
			expect(
				screen.queryByText("Pick at least one app or agent"),
			).not.toBeInTheDocument(),
		);
		expect(within(getList()).getByText("Intake Form")).toBeInTheDocument();
	});

	it("puts each app picked on the list and gives them all Read-Only access in one batch, and closes", async () => {
		const onClose = renderDialog();

		pick(INTAKE);
		pick(REPORTS);

		expect(
			screen.getByRole("heading", { name: "To Authorize (2)" }),
		).toBeInTheDocument();
		expect(within(getList()).getByText("id: app2")).toBeInTheDocument();
		expect(within(getList()).getByText("Blocks")).toBeInTheDocument();
		expect(getPicker()).toHaveTextContent("2 picked");

		fireEvent.click(getAuthorize());

		await waitFor(() =>
			expect(onClose).toHaveBeenCalledWith(["app1", "app2"]),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "engine-1" },
					changes: [
						added("app1", { level: "READ_ONLY", endDate: null }),
						added("app2", { level: "READ_ONLY", endDate: null }),
					],
				},
			],
			false,
		);
	});

	it("gives every app on the list Editor access when it is chosen", async () => {
		const onClose = renderDialog();

		pick(INTAKE);
		pick(REPORTS);
		fireEvent.click(screen.getByRole("combobox", { name: "Permission" }));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalled());
		const [batch] = vi.mocked(savePermissionBatches).mock.calls[0][0];
		expect(batch.changes).toEqual([
			added("app1", { level: "EDIT", endDate: null }),
			added("app2", { level: "EDIT", endDate: null }),
		]);
	});

	it("takes an app off the list and moves focus back to the picker", async () => {
		const onClose = renderDialog();

		pick(INTAKE);
		pick(REPORTS);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove Intake Form from the list",
			}),
		);

		expect(getPicker()).toHaveFocus();
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["app2"]));
	});

	it("leaves an app that already has access off the list and says why, and takes one on the list off when it is picked again", () => {
		renderDialog({ grantedAppIds: ["app2"] });

		pick(REPORTS);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Reports already has access. Change its permission in the table.",
		);

		pick(INTAKE);
		expect(
			screen.getByRole("heading", { name: "To Authorize (1)" }),
		).toBeInTheDocument();
		pick(INTAKE);
		expect(
			screen.getByRole("heading", { name: "To Authorize (0)" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(getPicker()).toHaveAttribute("aria-invalid", "false");
	});

	it("offers every app type by default and narrows the picker to the type chosen", async () => {
		renderDialog();

		expect(
			screen.getByRole("combobox", { name: "Type" }),
		).toHaveTextContent("All Types");
		expect(getPicker()).toHaveAttribute(
			"data-project-types",
			"CODE,BLOCKS,WORKSPACE",
		);

		fireEvent.click(screen.getByRole("combobox", { name: "Type" }));
		fireEvent.click(await screen.findByRole("option", { name: "Blocks" }));

		expect(getPicker()).toHaveAttribute("data-project-types", "BLOCKS");
		expect(getPicker()).toHaveAttribute("data-admin", "false");
	});

	it("keeps Authorize Access enabled for an incomplete app limit, shows why only when it is pressed, and gives each app the limit", async () => {
		const onClose = renderDialog({
			model: OWNED_MODEL,
			engineId: "model-1",
		});

		pick(INTAKE);
		pick(REPORTS);
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
		await waitFor(() => expect(amount).toHaveFocus());
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.change(amount, { target: { value: "5000" } });
		fireEvent.click(getAuthorize());

		await waitFor(() =>
			expect(onClose).toHaveBeenCalledWith(["app1", "app2"]),
		);
		const to = {
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
		};
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [added("app1", to), added("app2", to)],
				},
			],
			false,
		);
	});

	it("adds the apps with no limit from a user who cannot set usage limits, and says why", async () => {
		const onClose = renderDialog({
			model: { isCostAvailable: true, canChangeLimit: false },
			engineId: "model-1",
		});

		expect(
			screen.queryByRole("radio", { name: "usageLimit.modes.rules" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(/Only owners can set usage limits/),
		).toBeInTheDocument();

		pick(INTAKE);
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["app1"]));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						added("app1", { level: "READ_ONLY", endDate: null }),
					],
				},
			],
			false,
		);
	});

	it("offers every app and saves in admin mode when asked", async () => {
		const onClose = renderDialog({ admin: true });

		expect(getPicker()).toHaveAttribute("data-admin", "true");
		pick(INTAKE);
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["app1"]));
		expect(vi.mocked(savePermissionBatches).mock.calls[0][1]).toBe(true);
	});

	it("shows the backend's refusal, keeps the list and stays open", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error("app app2 already has access"),
		);
		const onClose = renderDialog();

		pick(INTAKE);
		pick(REPORTS);
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("app app2 already has access"),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		await waitFor(() => expect(getAuthorize()).toBeEnabled());
		expect(
			screen.getByRole("heading", { name: "To Authorize (2)" }),
		).toBeInTheDocument();
	});

	it("closes without saving on Cancel", () => {
		const onClose = renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith();
		expect(savePermissionBatches).not.toHaveBeenCalled();
	});

	it("gives an agent a permission on a skill, and never the skill itself", async () => {
		const skill: Project = {
			project_id: "skill1",
			project_name: "orders_skill",
			project_display_name: "Orders Skill",
			project_type: "SKILL",
		};
		const agent: Project = {
			project_id: "agent1",
			project_name: "orders_agent",
			project_display_name: "Orders Agent",
			project_type: "WORKSPACE",
		};
		const onClose = renderDialog({ skillId: "skill1" });
		expect(
			screen.getByText(/such as an agent loading a skill/),
		).toBeInTheDocument();

		pick(skill);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Orders Skill is this skill, which is never given a permission on itself.",
		);
		pick(agent);
		expect(within(getList()).getByText("Agent")).toBeInTheDocument();
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["agent1"]));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "PROJECT", id: "skill1" },
					changes: [
						added("agent1", { level: "READ_ONLY", endDate: null }),
					],
				},
			],
			false,
		);
	});
});
