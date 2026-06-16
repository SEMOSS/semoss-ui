import { fireEvent, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { ToggleButtonBlock } from "../../components/block-defaults/toggle-button-block/ToggleButtonBlock";
import { render, screen } from "../utils";

const blocks = {
	"toggle-button": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			options: [
				{
					display: "on",
					value: "on",
				},
				{
					display: "off",
					value: "off",
				},
			],
		},
		id: "toggle-button",
		widget: "toggle-button",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: {
				type: "sync",
				order: [],
			},
		},
	},

	"toggle-button2": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			options: [
				{
					display: "on",
					value: "on",
				},
				{
					display: "off",
					value: "off",
				},
			],
			value: "on",
		},
		id: "toggle-button2",
		widget: "toggle-button",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},

	"toggle-button3": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			options: [
				{
					display: "on",
					value: "on",
				},
				{
					display: "off",
					value: "off",
				},
			],
			value: "off",
		},
		id: "toggle-button3",
		widget: "toggle-button",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},

	"toggle-button4": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
			options: [
				{
					display: "on",
					value: "on",
				},
				{
					display: "off",
					value: "off",
				},
			],
			value: "off",
			disabled: true,
		},
		id: "toggle-button4",
		widget: "toggle-button",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},
};

describe("toggle button block", () => {
	it("renders correctly with mocked provider", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button"].id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const element = container.querySelector(
				"[data-block='toggle-button']",
			);
			const items = container.querySelectorAll(
				"[data-slot='toggle-group-item']",
			);
			expect(element).toBeInTheDocument();
			expect(items.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(items[0].getAttribute("data-state")).toBe("off");
			expect(items[1].getAttribute("data-state")).toBe("off");
		});
	});

	it("renders correctly with 'on' toggled", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button2"].id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const element = container.querySelector(
				"[data-block='toggle-button2']",
			);
			const items = container.querySelectorAll(
				"[data-slot='toggle-group-item']",
			);
			expect(element).toBeInTheDocument();
			expect(items.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(items[0].getAttribute("data-state")).toBe("on");
			expect(items[1].getAttribute("data-state")).toBe("off");
		});
	});

	it("renders correctly with 'off' toggled", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button3"].id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const element = container.querySelector(
				"[data-block='toggle-button3']",
			);
			const items = container.querySelectorAll(
				"[data-slot='toggle-group-item']",
			);
			expect(element).toBeInTheDocument();
			expect(items.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(items[0].getAttribute("data-state")).toBe("off");
			expect(items[1].getAttribute("data-state")).toBe("on");
		});
	});

	it("renders correctly with toggle button disabled", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button4"].id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const element = container.querySelector(
				"[data-block='toggle-button4']",
			);
			const items = container.querySelectorAll(
				"[data-slot='toggle-group-item']",
			);
			expect(element).toBeInTheDocument();
			expect(items.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(items[0].getAttribute("data-state")).toBe("off");
			expect(items[1].getAttribute("data-state")).toBe("on");
			expect((items[0] as HTMLButtonElement).disabled).toBeTruthy();
			expect((items[1] as HTMLButtonElement).disabled).toBeTruthy();
		});
	});

	it("clicks and toggles", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button"].id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const items = container.querySelectorAll(
				"[data-slot='toggle-group-item']",
			);
			expect(items.length).toBe(2);
			expect(items[0].getAttribute("data-state")).toBe("off");
			expect(items[1].getAttribute("data-state")).toBe("off");
		});

		const onButton = screen
			.getByText("on")
			.closest("button") as HTMLElement;
		fireEvent.click(onButton);

		await waitFor(() => {
			const items = container.querySelectorAll(
				"[data-slot='toggle-group-item']",
			);
			expect(items[0].getAttribute("data-state")).toBe("on");
			expect(items[1].getAttribute("data-state")).toBe("off");
		});
	});
});
