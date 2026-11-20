import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import type { ToolViewProps } from "@semoss/shared";
import { a2uiRequest } from "./a2ui.fixtures";
import { A2uiToolView } from "./a2ui-tool-view";

it("renders real SDK bindings with labeled SEMOSS controls and returns edited values", async () => {
	const onRespond = vi.fn().mockResolvedValue(undefined);
	const onApprove = vi.fn();
	render(
		<StrictMode>
			<A2uiToolView
				call={{
					id: "ui",
					functionName: "ShowUI",
					arguments: a2uiRequest,
					status: "pending",
				}}
				mode="approval"
				params={{}}
				host={{}}
				onRespond={onRespond}
				onApprove={onApprove}
				onDecline={vi.fn()}
			/>
		</StrictMode>,
	);
	const field = await screen.findByRole("textbox", {
		name: "Additional context",
	});
	fireEvent.change(field, { target: { value: "Review tomorrow" } });
	fireEvent.click(
		await screen.findByRole("button", { name: "Prepare task" }),
	);
	await waitFor(() =>
		expect(onRespond).toHaveBeenCalledWith(
			expect.objectContaining({
				result: expect.objectContaining({
					version: "1.0",
					action: expect.objectContaining({
						name: "prepare",
						context: { notes: "Review tomorrow" },
					}),
				}),
			}),
		),
	);
	expect(onApprove).not.toHaveBeenCalled();
});

it.each([
	[{ component: "Slider", min: 0.1, max: 0.5, steps: 4 }, 0.3],
	[{ component: "TextField", variant: "number" }, "-1.5"],
	[{ component: "DateTimeInput", enableDate: true }, "2024-02-29"],
	[{ component: "DateTimeInput", enableTime: true }, "09:30"],
	[
		{ component: "DateTimeInput", enableDate: true, enableTime: true },
		"2026-11-16T09:30",
	],
])(
	"submits the initial value displayed by %j without an edit",
	async (properties, value) => {
		const original = a2uiRequest.messages[0].createSurface;
		const request = {
			title: "Example",
			messages: [
				{
					version: "1.0",
					createSurface: {
						...original,
						dataModel: { notes: value },
						components: original.components.map((component) =>
							component.id === "notes"
								? {
										id: "notes",
										...properties,
										label: "Initial value",
										value: { "@path": "/notes" },
									}
								: component,
						),
					},
				},
			],
		};
		const onRespond = vi.fn().mockResolvedValue(undefined);
		render(
			<A2uiToolView
				call={{
					id: "ui",
					functionName: "ShowUI",
					arguments: request,
					status: "pending",
				}}
				mode="approval"
				params={{}}
				host={{}}
				onRespond={onRespond}
				onApprove={vi.fn()}
				onDecline={vi.fn()}
			/>,
		);
		expect(
			await screen.findByLabelText(/^Initial value/),
		).toHaveDisplayValue(String(value));
		fireEvent.click(screen.getByRole("button", { name: "Prepare task" }));
		await waitFor(() =>
			expect(onRespond).toHaveBeenCalledWith(
				expect.objectContaining({
					result: expect.objectContaining({
						action: expect.objectContaining({
							context: { notes: value },
						}),
					}),
				}),
			),
		);
	},
);

it("preserves edits when the host updates callbacks and after a failed response", async () => {
	const first = vi.fn();
	const next = vi
		.fn()
		.mockRejectedValueOnce(new Error("Connection lost"))
		.mockResolvedValue(undefined);
	const props: ToolViewProps = {
		call: {
			id: "ui",
			functionName: "ShowUI",
			arguments: a2uiRequest,
			status: "pending",
		},
		mode: "approval",
		params: {},
		host: {},
		onRespond: first,
		onApprove: vi.fn(),
		onDecline: vi.fn(),
	};
	const { rerender } = render(<A2uiToolView {...props} />);
	fireEvent.change(
		await screen.findByRole("textbox", { name: "Additional context" }),
		{ target: { value: "Keep this draft" } },
	);
	rerender(<A2uiToolView {...props} onRespond={next} />);
	fireEvent.click(screen.getByRole("button", { name: "Prepare task" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Connection lost",
	);
	expect(
		screen.getByRole("textbox", { name: "Additional context" }),
	).toHaveValue("Keep this draft");
	fireEvent.click(screen.getByRole("button", { name: "Prepare task" }));
	await waitFor(() => expect(next).toHaveBeenCalledTimes(2));
	expect(first).not.toHaveBeenCalled();
	expect(next).toHaveBeenLastCalledWith(
		expect.objectContaining({
			result: expect.objectContaining({
				action: expect.objectContaining({
					context: { notes: "Keep this draft" },
				}),
			}),
		}),
	);
});

it("returns checkbox, choices, slider, and date input changes through real SDK bindings", async () => {
	const original = a2uiRequest.messages[0].createSurface;
	const onRespond = vi.fn().mockResolvedValue(undefined);
	const request = {
		title: "Plan a review",
		messages: [
			{
				version: "1.0",
				createSurface: {
					...original,
					dataModel: {
						notes: "",
						confirmed: false,
						task: ["review"],
						people: [],
						priority: 2,
						date: "2026-11-16",
					},
					components: [
						...original.components.map((component) =>
							component.id === "root"
								? {
										...component,
										children: [
											"intro",
											"notes",
											"confirmed",
											"task",
											"people",
											"priority",
											"date",
											"continue",
										],
									}
								: component.id === "continue"
									? {
											...component,
											action: {
												event: {
													name: "prepare",
													context: {
														confirmed: {
															"@path":
																"/confirmed",
														},
														task: {
															"@path": "/task",
														},
														people: {
															"@path": "/people",
														},
														priority: {
															"@path":
																"/priority",
														},
														date: {
															"@path": "/date",
														},
													},
												},
											},
										}
									: component,
						),
						{
							id: "confirmed",
							component: "CheckBox",
							label: "Include context",
							value: { "@path": "/confirmed" },
						},
						{
							id: "task",
							component: "ChoicePicker",
							label: "Task",
							options: [
								{ label: "Review", value: "review" },
								{ label: "Summary", value: "summary" },
							],
							value: { "@path": "/task" },
						},
						{
							id: "people",
							component: "ChoicePicker",
							label: "People",
							variant: "multipleSelection",
							options: [
								{ label: "Alex", value: "alex" },
								{ label: "Sam", value: "sam" },
							],
							value: { "@path": "/people" },
						},
						{
							id: "priority",
							component: "Slider",
							label: "Priority",
							max: 10,
							steps: 10,
							value: { "@path": "/priority" },
						},
						{
							id: "date",
							component: "DateTimeInput",
							label: "Review date",
							enableDate: true,
							value: { "@path": "/date" },
						},
					],
				},
			},
		],
	};
	render(
		<A2uiToolView
			call={{
				id: "ui",
				functionName: "ShowUI",
				arguments: request,
				status: "pending",
			}}
			mode="approval"
			params={{}}
			host={{}}
			onRespond={onRespond}
			onApprove={vi.fn()}
			onDecline={vi.fn()}
		/>,
	);
	fireEvent.click(
		await screen.findByRole("checkbox", { name: "Include context" }),
	);
	fireEvent.click(screen.getByRole("radio", { name: "Summary" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Alex" }));
	fireEvent.click(screen.getByRole("checkbox", { name: "Sam" }));
	fireEvent.change(screen.getByRole("slider", { name: /^Priority/ }), {
		target: { value: "7" },
	});
	fireEvent.change(screen.getByLabelText("Review date"), {
		target: { value: "2026-11-18" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Prepare task" }));
	await waitFor(() =>
		expect(onRespond).toHaveBeenCalledWith(
			expect.objectContaining({
				result: expect.objectContaining({
					action: expect.objectContaining({
						context: {
							confirmed: true,
							task: ["summary"],
							people: ["alex", "sam"],
							priority: 7,
							date: "2026-11-18",
						},
					}),
				}),
			}),
		),
	);
});
