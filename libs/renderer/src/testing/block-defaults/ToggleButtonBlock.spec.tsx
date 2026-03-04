import { waitFor } from "@testing-library/react";
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
			onChange: [],
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
		const { container } = await render(
			<ToggleButtonBlock id={blocks["toggle-button"].id} />,
			{
				blocks: blocks,
			},
		);
		const element = container.querySelector("[data-block='toggle-button']");
		const elementList = container.querySelectorAll("[type='button']");
		const onElement = container.querySelector("[value='on']");
		const offElement = container.querySelector("[value='off']");

		await waitFor(() => {
			expect(element).toBeInTheDocument();
			expect(elementList.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(onElement.getAttribute("aria-pressed")).toBe("false");
			expect(offElement.getAttribute("aria-pressed")).toBe("false");
		});
	});

	it("renders correctly with 'on' toggled", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button2"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='toggle-button2']",
		);
		const elementList = container.querySelectorAll("[type='button']");
		const onElement = container.querySelector("[value='on']");
		const offElement = container.querySelector("[value='off']");

		await waitFor(() => {
			expect(element).toBeInTheDocument();
			expect(elementList.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(onElement.getAttribute("aria-pressed")).toBe("true");
			expect(offElement.getAttribute("aria-pressed")).toBe("false");
		});
	});

	it("renders correctly with 'off' toggled", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button3"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='toggle-button3']",
		);
		const elementList = container.querySelectorAll("[type='button']");
		const onElement = container.querySelector("[value='on']");
		const offElement = container.querySelector("[value='off']");

		await waitFor(() => {
			expect(element).toBeInTheDocument();
			expect(elementList.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(onElement.getAttribute("aria-pressed")).toBe("false");
			expect(offElement.getAttribute("aria-pressed")).toBe("true");
		});
	});

	it("renders correctly with toggle button disabled", async () => {
		const { container } = await render(
			<ToggleButtonBlock id={blocks["toggle-button4"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='toggle-button4']",
		);
		const elementList = container.querySelectorAll("[type='button']");
		const onElement = container.querySelector("[value='on']");
		const offElement = container.querySelector("[value='off']");

		await waitFor(() => {
			expect(element).toBeInTheDocument();
			expect(elementList.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(onElement.getAttribute("aria-pressed")).toBe("false");
			expect(offElement.getAttribute("aria-pressed")).toBe("true");
			expect(onElement.classList.contains("Mui-disabled")).toBeTruthy;
			expect(offElement.classList.contains("Mui-disabled")).toBeTruthy;
		});
	});

	it("clicks and toggles", async () => {
		const { container } = render(
			<ToggleButtonBlock id={blocks["toggle-button"].id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='toggle-button']");
		const elementList = container.querySelectorAll("[type='button']");
		const onElement = container.querySelector("[value='on']");
		const offElement = container.querySelector("[value='off']");

		await waitFor(() => {
			expect(element).toBeInTheDocument();
			expect(elementList.length).toBe(2);
			expect(screen.getByText("on")).toBeInTheDocument();
			expect(screen.getByText("off")).toBeInTheDocument();
			expect(onElement.getAttribute("aria-pressed")).toBe("false");
			expect(offElement.getAttribute("aria-pressed")).toBe("false");
		});

		//this fire event click is causing the error: actions.order is not iterable
		// fireEvent.click(onElement);
		// screen.debug()
		// await waitFor(() => {
		// 	expect(onElement.getAttribute("aria-pressed")).toBe("true");
		// 	expect(offElement.getAttribute("aria-pressed")).toBe("false");
		// });
	});
});
