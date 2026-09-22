import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { CreateConnection } from "./create-connection";

const nodes = ["Orders", "Customers", "Products"].map((name) => ({
	id: name,
	type: "table",
	data: { name, properties: [] },
	position: { x: 0, y: 0 },
}));
const scrollIntoView = HTMLElement.prototype.scrollIntoView;
const hasPointerCapture = HTMLElement.prototype.hasPointerCapture;

beforeAll(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	HTMLElement.prototype.scrollIntoView = vi.fn();
	HTMLElement.prototype.hasPointerCapture = () => false;
});
afterEach(cleanup);
afterAll(() => {
	vi.unstubAllGlobals();
	HTMLElement.prototype.scrollIntoView = scrollIntoView;
	HTMLElement.prototype.hasPointerCapture = hasPointerCapture;
});

async function selectTable(index: number, name: string) {
	const trigger = screen.getAllByRole("combobox")[index];
	trigger.focus();
	fireEvent.keyDown(trigger, { key: "ArrowDown" });
	fireEvent.keyDown(await screen.findByRole("option", { name }), {
		key: "Enter",
	});
}

describe("connection dialog editing lifecycle", () => {
	it("can add and save a connection when no initial list is supplied", async () => {
		const onCreateConnection = vi.fn();
		const onClose = vi.fn();
		render(
			<CreateConnection
				open
				nodes={nodes}
				onCreateConnection={onCreateConnection}
				onClose={onClose}
			/>,
		);
		await selectTable(0, "Orders");
		await selectTable(1, "Customers");
		fireEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(onCreateConnection).toHaveBeenCalledWith({
			id: "Orders_Customers",
			parentTable: "Orders",
			childTable: "Customers",
		});
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("keeps validation visible until corrected and preserves pending edits across parent renders", async () => {
		const initialConnection = {
			parentTable: "Orders",
			childTable: "Customers",
		};
		const onCreateConnection = vi.fn();
		const onClose = vi.fn();
		const { rerender } = render(
			<CreateConnection
				open
				nodes={nodes}
				initialConnections={[initialConnection]}
				onCreateConnection={onCreateConnection}
				onClose={onClose}
			/>,
		);
		await selectTable(0, "Orders");
		await selectTable(1, "Customers");
		fireEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(
			screen.getByText(/same parent and child already exists/),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
		await selectTable(1, "Products");
		expect(
			screen.queryByText(/same parent and child already exists/),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Add" }));
		rerender(
			<CreateConnection
				open
				nodes={nodes}
				initialConnections={[{ ...initialConnection }]}
				onCreateConnection={onCreateConnection}
				onClose={onClose}
			/>,
		);
		expect(
			screen.getAllByRole("button", { name: "edit-connection" }),
		).toHaveLength(2);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(onCreateConnection).toHaveBeenCalledExactlyOnceWith({
			id: "Orders_Products",
			parentTable: "Orders",
			childTable: "Products",
		});

		rerender(
			<CreateConnection
				open={false}
				nodes={nodes}
				initialConnections={[initialConnection]}
				onCreateConnection={onCreateConnection}
				onClose={onClose}
			/>,
		);
		rerender(
			<CreateConnection
				open
				nodes={nodes}
				initialConnections={[initialConnection]}
				onCreateConnection={onCreateConnection}
				onClose={onClose}
			/>,
		);
		await waitFor(() =>
			expect(
				screen.getAllByRole("button", { name: "edit-connection" }),
			).toHaveLength(1),
		);
		expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
	});
});
