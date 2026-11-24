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
import type { Engine, EngineSelect } from "@semoss/shared";
import type { GranteeRef, GrantModel } from "@/features/grants/grants";
import { AddEngineEngineDialog } from "./add-engine-engine-dialog";

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	savePermissionBatches: vi.fn(),
}));

/** The Claims Vectors vector database */
const VECTORS: Engine = {
	engine_id: "vectors1",
	engine_name: "claims_vectors",
	engine_display_name: "Claims Vectors",
	engine_type: "VECTOR",
	engine_subtype: "FAISS",
};

/** The Prompt Guard guardrail */
const GUARD: Engine = {
	engine_id: "guard1",
	engine_name: "prompt_guard",
	engine_display_name: "Prompt Guard",
	engine_type: "GUARDRAIL",
	engine_subtype: "PROMPT",
};

/** The engine the stand-in picker picks; a test sets it before a click */
let pickedEngine: Engine = VECTORS;

/**
 * The shared picker reads MyEngines; this one is a button that picks the
 * engine a test names, with the field wiring the dialog gives the real one and
 * the types and mode the dialog asks it for.
 */
vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	EngineSelect: ({
		id,
		name,
		onChange,
		ref,
		engineTypes,
		admin,
		"aria-describedby": describedBy,
		"aria-invalid": isInvalid,
	}: ComponentProps<typeof EngineSelect>) => (
		<button
			ref={ref}
			id={id}
			type="button"
			data-engine-types={engineTypes?.join(",")}
			data-admin={admin}
			aria-describedby={describedBy}
			aria-invalid={isInvalid}
			onClick={() => onChange(pickedEngine)}
		>
			{name || "Select"}
		</button>
	),
}));

/** A model whose owner is adding the engines, so the Engine Limit is offered */
const OWNED_MODEL: GrantModel = {
	isCostAvailable: true,
	canChangeLimit: true,
};

/** Opens the dialog for an engine, returning its onClose */
const renderDialog = ({
	model,
	engineId = "engine-1",
	granted,
	admin,
}: {
	model?: GrantModel;
	engineId?: string;
	granted?: GranteeRef[];
	admin?: boolean;
} = {}) => {
	const onClose = vi.fn();
	render(
		<AddEngineEngineDialog
			open
			engineId={engineId}
			granted={granted}
			model={model}
			admin={admin}
			onClose={onClose}
		/>,
	);
	return onClose;
};

const getPicker = () => screen.getByLabelText("Engine");

const getAuthorize = () =>
	screen.getByRole("button", { name: "Authorize Access" });

const getList = () =>
	screen.getByRole("region", { name: /Engines to Authorize/ });

/** Picks an engine with the stand-in picker */
const pick = (engine: Engine) => {
	pickedEngine = engine;
	fireEvent.click(getPicker());
};

/** The change that adds an engine, with the grant sent */
const added = (id: string, type: string, to: unknown) => ({
	action: "ADD",
	subject: { category: "ENGINE", id, type },
	to,
});

describe("AddEngineEngineDialog", () => {
	beforeEach(() => {
		pickedEngine = VECTORS;
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

	it("asks for an engine only once Authorize Access is pressed with an empty list", async () => {
		const onClose = renderDialog();

		expect(getAuthorize()).toBeEnabled();
		expect(getPicker()).toHaveAttribute("aria-invalid", "false");
		expect(screen.getByText("No engines picked yet")).toBeInTheDocument();
		expect(
			screen.queryByText("Pick at least one engine"),
		).not.toBeInTheDocument();

		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("Pick at least one engine"),
		).toBeInTheDocument();
		expect(getPicker()).toHaveAttribute("aria-invalid", "true");
		expect(getPicker()).toHaveAccessibleDescription(
			/Pick at least one engine/,
		);
		expect(savePermissionBatches).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();

		pick(VECTORS);

		await waitFor(() =>
			expect(
				screen.queryByText("Pick at least one engine"),
			).not.toBeInTheDocument(),
		);
		expect(
			within(getList()).getByText("Claims Vectors"),
		).toBeInTheDocument();
	});

	it("puts each engine picked on the list and gives them all Read-Only access in one batch, and closes", async () => {
		const onClose = renderDialog();

		pick(VECTORS);
		pick(GUARD);

		expect(
			screen.getByRole("heading", { name: "Engines to Authorize (2)" }),
		).toBeInTheDocument();
		expect(within(getList()).getByText("id: vectors1")).toBeInTheDocument();
		expect(within(getList()).getByText("Guardrail")).toBeInTheDocument();
		expect(getPicker()).toHaveTextContent("2 picked");

		fireEvent.click(getAuthorize());

		await waitFor(() =>
			expect(onClose).toHaveBeenCalledWith(["vectors1", "guard1"]),
		);
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "engine-1" },
					changes: [
						added("vectors1", "VECTOR", {
							level: "READ_ONLY",
							endDate: null,
						}),
						added("guard1", "GUARDRAIL", {
							level: "READ_ONLY",
							endDate: null,
						}),
					],
				},
			],
			false,
		);
	});

	it("gives every engine on the list Editor access when it is chosen", async () => {
		const onClose = renderDialog();

		pick(VECTORS);
		pick(GUARD);
		fireEvent.click(screen.getByRole("combobox", { name: "Permission" }));
		fireEvent.click(await screen.findByRole("option", { name: "Editor" }));
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalled());
		const [batch] = vi.mocked(savePermissionBatches).mock.calls[0][0];
		expect(batch.changes).toEqual([
			added("vectors1", "VECTOR", { level: "EDIT", endDate: null }),
			added("guard1", "GUARDRAIL", { level: "EDIT", endDate: null }),
		]);
	});

	it("takes an engine off the list and moves focus back to the picker", async () => {
		const onClose = renderDialog();

		pick(VECTORS);
		pick(GUARD);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove Claims Vectors from the list",
			}),
		);

		expect(getPicker()).toHaveFocus();
		expect(
			within(getList()).queryByText("Claims Vectors"),
		).not.toBeInTheDocument();
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["guard1"]));
	});

	it("leaves the engine itself and an engine that already has access off the list and says why, and takes one on the list off when it is picked again", () => {
		renderDialog({ granted: [{ id: "guard1", type: "GUARDRAIL" }] });

		pick({ ...VECTORS, engine_id: "engine-1" });
		expect(screen.getByRole("status")).toHaveTextContent(
			"An engine cannot be given a permission on itself",
		);

		pick(GUARD);
		expect(screen.getByRole("status")).toHaveTextContent(
			"Prompt Guard already has access. Change its permission in the table.",
		);

		pick(VECTORS);
		expect(
			screen.getByRole("heading", { name: "Engines to Authorize (1)" }),
		).toBeInTheDocument();
		pick(VECTORS);
		expect(
			screen.getByRole("heading", { name: "Engines to Authorize (0)" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(getPicker()).toHaveAttribute("aria-invalid", "false");
	});

	it("offers every engine type by default and narrows the picker to the type chosen", async () => {
		renderDialog();

		expect(
			screen.getByRole("combobox", { name: "Engine Type" }),
		).toHaveTextContent("All Types");
		expect(getPicker()).toHaveAttribute(
			"data-engine-types",
			"MODEL,VECTOR,GUARDRAIL,FUNCTION,DATABASE,STORAGE",
		);

		fireEvent.click(screen.getByRole("combobox", { name: "Engine Type" }));
		fireEvent.click(
			await screen.findByRole("option", { name: "Guardrail" }),
		);

		expect(getPicker()).toHaveAttribute("data-engine-types", "GUARDRAIL");
		expect(getPicker()).toHaveAttribute("data-admin", "false");
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

	it("keeps Authorize Access enabled for an incomplete engine limit, shows why only when it is pressed, and gives each engine the limit", async () => {
		const onClose = renderDialog({
			model: OWNED_MODEL,
			engineId: "model-1",
		});

		pick(VECTORS);
		pick(GUARD);
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
			expect(onClose).toHaveBeenCalledWith(["vectors1", "guard1"]),
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
					changes: [
						added("vectors1", "VECTOR", to),
						added("guard1", "GUARDRAIL", to),
					],
				},
			],
			false,
		);
	});

	it("adds the engines with no limit from a user who cannot set usage limits, and says why", async () => {
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

		pick(VECTORS);
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["vectors1"]));
		expect(savePermissionBatches).toHaveBeenCalledExactlyOnceWith(
			[
				{
					target: { resourceType: "ENGINE", id: "model-1" },
					changes: [
						added("vectors1", "VECTOR", {
							level: "READ_ONLY",
							endDate: null,
						}),
					],
				},
			],
			false,
		);
	});

	it("offers every engine and saves in admin mode when asked", async () => {
		const onClose = renderDialog({ admin: true });

		expect(getPicker()).toHaveAttribute("data-admin", "true");
		pick(VECTORS);
		fireEvent.click(getAuthorize());

		await waitFor(() => expect(onClose).toHaveBeenCalledWith(["vectors1"]));
		expect(vi.mocked(savePermissionBatches).mock.calls[0][1]).toBe(true);
	});

	it("shows the backend's refusal, keeps the list and stays open", async () => {
		vi.mocked(savePermissionBatches).mockRejectedValue(
			new Error("engine guard1 already has access"),
		);
		const onClose = renderDialog();

		pick(VECTORS);
		pick(GUARD);
		fireEvent.click(getAuthorize());

		expect(
			await screen.findByText("engine guard1 already has access"),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		await waitFor(() => expect(getAuthorize()).toBeEnabled());
		expect(
			screen.getByRole("heading", { name: "Engines to Authorize (2)" }),
		).toBeInTheDocument();
	});

	it("closes without saving on Cancel", () => {
		const onClose = renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith();
		expect(savePermissionBatches).not.toHaveBeenCalled();
	});
});
