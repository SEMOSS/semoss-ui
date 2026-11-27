import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChoiceStep } from "./choice-step";
import { ConfirmStep } from "./confirm-step";
import { DialsStep } from "./dials-step";
import { MirrorStep } from "./mirror-step";
import { ProbeStep } from "./probe-step";
import { RoundsStep } from "./rounds-step";
import { StandsStep } from "./stands-step";

afterEach(cleanup);

const base = { id: "step", title: "A step", detail: "What it asks" };
/** The last thing a step told its page. */
const last = (onChange: ReturnType<typeof vi.fn>) =>
	onChange.mock.calls.at(-1)?.[0];

describe("what was noticed", () => {
	const step = {
		...base,
		kind: "confirm" as const,
		items: ["You answer in one line.", "You never say thanks."],
	};

	it("starts with everything kept, and tells the page what is left as it is dropped, put right and added to", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<ConfirmStep step={step} onChange={onChange} />);
		const keep = screen.getByRole("button", {
			name: "Keep: You never say thanks.",
		});
		expect(keep).toHaveAttribute("aria-pressed", "true");
		expect(onChange).not.toHaveBeenCalled();

		await user.click(keep);
		expect(keep).toHaveAttribute("aria-pressed", "false");
		expect(last(onChange)).toEqual({ items: ["You answer in one line."] });
		// what is dropped cannot be edited until it is kept again
		expect(screen.getByLabelText("What I noticed, 2 of 2")).toBeDisabled();

		const first = screen.getByLabelText("What I noticed, 1 of 2");
		await user.clear(first);
		await user.type(first, "You answer in two lines.");
		await user.type(
			screen.getByLabelText("Something I missed"),
			"  No small talk  {Enter}",
		);
		expect(last(onChange)).toEqual({
			items: ["You answer in two lines.", "No small talk"],
		});
		expect(screen.getByLabelText("Something I missed")).toHaveValue("");
		expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
	});
});

describe("the dials", () => {
	const step = {
		...base,
		kind: "dials" as const,
		dials: [
			{
				key: "formal",
				left: "Formal",
				right: "Casual",
				about: "Asking for a report that is late",
				samples: ["One", "Two", "Three", "Four", "Five"],
				value: 2,
			},
			{
				key: "blunt",
				left: "Blunt",
				right: "Diplomatic",
				about: "Saying no",
				samples: [
					"No.",
					"No, sorry.",
					"Not now.",
					"Maybe later.",
					"Perhaps.",
				],
				value: 3,
			},
		],
	};

	it("opens where it was set, says each stop out loud, and tells the page every dial when one moves", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<DialsStep step={step} onChange={onChange} />);
		const formal = within(
			screen.getByRole("radiogroup", { name: "Formal to Casual" }),
		);
		expect(
			formal.getByRole("radio", {
				name: "2 of 5, from Formal to Casual",
			}),
		).toBeChecked();
		expect(screen.getByText("Two")).toBeVisible();

		await user.click(
			formal.getByRole("radio", {
				name: "5 of 5, from Formal to Casual",
			}),
		);
		expect(screen.getByText("Five")).toBeVisible();
		expect(screen.queryByText("Two")).toBeNull();
		expect(last(onChange)).toEqual({ values: { formal: 5, blunt: 3 } });
	});
});

describe("replies to choose between", () => {
	const step = {
		...base,
		kind: "rounds" as const,
		rounds: [
			{
				id: "r1",
				from: "Sam, a teammate",
				message: "Can we move the date?",
				a: "No.",
				aIs: "blunt",
				b: "Let us look at it.",
				bIs: "soft",
			},
			{
				id: "t1",
				from: "Jordan, from sales",
				message: "Just say yes.",
			},
		],
	};

	it("takes one of two replies or the owner's own words, and never says which way a reply leans", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { rerender } = render(
			<RoundsStep step={step} part={0} onChange={onChange} />,
		);
		expect(screen.getByText("Can we move the date?")).toBeVisible();
		expect(screen.queryByText("blunt")).toBeNull();

		const a = screen.getByRole("button", { name: "Reply A: No." });
		await user.click(a);
		expect(a).toHaveAttribute("aria-pressed", "true");
		expect(last(onChange)).toEqual({ rounds: { r1: { pick: "a" } } });
		// pressed again, the round is unanswered
		await user.click(a);
		expect(last(onChange)).toEqual({ rounds: {} });

		await user.click(
			screen.getByRole("button", { name: "Reply B: Let us look at it." }),
		);
		await user.type(
			screen.getByLabelText("Neither? Write what you would send"),
			"Not this week.",
		);
		// their own words take the round from the reply that was chosen
		expect(last(onChange)).toEqual({
			rounds: { r1: { pick: "own", text: "Not this week." } },
		});
		expect(
			screen.getByRole("button", { name: "Reply B: Let us look at it." }),
		).toHaveAttribute("aria-pressed", "false");

		// the next round has no replies to choose from, and what was answered before is kept
		rerender(<RoundsStep step={step} part={1} onChange={onChange} />);
		expect(screen.queryByRole("button", { name: /^Reply/ })).toBeNull();
		await user.type(
			screen.getByLabelText("Write what you would send"),
			"No. Friday is not real.",
		);
		expect(last(onChange)).toEqual({
			rounds: {
				r1: { pick: "own", text: "Not this week." },
				t1: { pick: "own", text: "No. Friday is not real." },
			},
		});
		rerender(<RoundsStep step={step} part={0} onChange={onChange} />);
		expect(
			screen.getByLabelText("Neither? Write what you would send"),
		).toHaveValue("Not this week.");
	});
});

describe("things to pick from", () => {
	const step = {
		...base,
		kind: "choice" as const,
		title: "What wins?",
		options: ["Speed", "Quality", "Cost"],
		ordered: true,
	};

	it("keeps the order things were picked in, numbers them, and takes the owner's own", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<ChoiceStep step={step} onChange={onChange} />);
		const group = within(screen.getByRole("group", { name: "What wins?" }));
		await user.click(group.getByRole("button", { name: "Quality" }));
		await user.click(group.getByRole("button", { name: "Speed" }));
		expect(last(onChange)).toEqual({
			picked: ["Quality", "Speed"],
			own: [],
		});
		const quality = group.getByTestId("choice-step-option-Quality");
		const speed = group.getByTestId("choice-step-option-Speed");
		expect(quality).toHaveAttribute("aria-pressed", "true");
		expect(quality).toHaveRole("button");
		expect(quality).toHaveAccessibleName(/^1\s*Quality$/);
		expect(speed).toHaveAccessibleName(/^2\s*Speed$/);

		// taking the first one back moves the other up
		await user.click(quality);
		expect(speed).toHaveAccessibleName(/^1\s*Speed$/);

		await user.type(screen.getByLabelText("Add your own"), "Trust{Enter}");
		await user.type(screen.getByLabelText("Add your own"), "Trust");
		await user.click(screen.getByRole("button", { name: "Add" }));
		// the same thing is not added twice
		expect(last(onChange)).toEqual({ picked: ["Speed"], own: ["Trust"] });
		await user.click(screen.getByRole("button", { name: "Remove Trust" }));
		expect(last(onChange)).toEqual({ picked: ["Speed"], own: [] });
	});

	it("marks a pick with a check where the order does not matter", async () => {
		const user = userEvent.setup();
		render(
			<ChoiceStep
				step={{ ...step, ordered: false }}
				onChange={vi.fn()}
			/>,
		);
		const cost = screen.getByRole("button", { name: "Cost" });
		await user.click(cost);
		expect(cost).toHaveAttribute("aria-pressed", "true");
		expect(cost.querySelector("svg")).not.toBeNull();
		expect(screen.queryByRole("button", { name: "1 Cost" })).toBeNull();
	});
});

describe("standing answers", () => {
	const step = {
		...base,
		kind: "stands" as const,
		suggestions: ["When will it be done?", "Who owns this?"],
	};

	it("adds a suggested question or the owner's own, and reports only the ones that are answered", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<StandsStep step={step} onChange={onChange} />);
		expect(screen.getByText(/Nothing yet/)).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "When will it be done?" }),
		);
		// taken, it is not offered again
		expect(
			screen.queryByRole("button", { name: "When will it be done?" }),
		).toBeNull();
		expect(last(onChange)).toEqual({ rows: [] });
		await user.type(
			screen.getByLabelText("Your answer to When will it be done?"),
			"When it is tested.",
		);
		await user.click(
			screen.getByRole("button", { name: "A question of your own" }),
		);
		await user.type(screen.getByLabelText("Question 2"), "Can I skip QA?");
		expect(last(onChange)).toEqual({
			rows: [
				{
					question: "When will it be done?",
					answer: "When it is tested.",
				},
			],
		});
		await user.click(
			screen.getByRole("button", {
				name: "Remove When will it be done?",
			}),
		);
		expect(last(onChange)).toEqual({ rows: [] });
		// given back, the suggestion is offered again
		expect(
			screen.getByRole("button", { name: "When will it be done?" }),
		).toBeVisible();
	});

	it("takes no more than the server keeps", async () => {
		const user = userEvent.setup();
		render(<StandsStep step={step} onChange={vi.fn()} />);
		const own = screen.getByRole("button", {
			name: "A question of your own",
		});
		for (let count = 0; count < 6; count++) await user.click(own);
		expect(own).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Who owns this?" }),
		).toBeDisabled();
	});
});

describe("answers that do not add up", () => {
	it("settles each one way, the other, or on what it depends", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ProbeStep
				step={{
					...base,
					kind: "probe",
					probes: [
						{
							id: "p1",
							question:
								"You set Blunt but picked the softer reply.",
							a: "As blunt as the dial",
							b: "Softer, like my picks",
						},
					],
				}}
				onChange={onChange}
			/>,
		);
		const group = within(
			screen.getByRole("radiogroup", {
				name: "You set Blunt but picked the softer reply.",
			}),
		);
		await user.click(
			group.getByRole("radio", { name: "Softer, like my picks" }),
		);
		expect(last(onChange)).toEqual({
			probes: { p1: { pick: "b", note: undefined } },
		});
		expect(screen.queryByLabelText("What does it depend on?")).toBeNull();

		await user.click(group.getByRole("radio", { name: "It depends" }));
		await user.type(
			screen.getByLabelText("What does it depend on?"),
			"Who is asking",
		);
		expect(last(onChange)).toEqual({
			probes: { p1: { pick: "both", note: "Who is asking" } },
		});
	});
});

describe("the twin answering as the owner", () => {
	const step = {
		...base,
		kind: "mirror" as const,
		rounds: [
			{
				id: "m1",
				ask: "Should we add the export?",
				reply: "Not before launch. Scope is frozen! Happy to discuss further.",
				tries: 0,
			},
			{
				id: "m2",
				ask: "What is the budget?",
				reply: "Ask Dana.",
				tries: 2,
			},
		],
	};

	it("takes what is not the owner sentence by sentence, how close the whole is, and asks for it again", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const onRewrite = vi.fn();
		const { rerender } = render(
			<MirrorStep
				step={step}
				part={0}
				onChange={onChange}
				onRewrite={onRewrite}
			/>,
		);
		const again = screen.getByRole("button", { name: "Try again" });
		// nothing to write it again from yet
		expect(again).toBeDisabled();

		const chatty = screen.getByRole("button", {
			name: "Happy to discuss further.",
		});
		await user.click(chatty);
		// marked with more than colour: pressed, struck through, and said
		expect(chatty).toHaveAttribute("aria-pressed", "true");
		expect(chatty).toHaveAccessibleName(
			/Happy to discuss further\.\s*\(not me\)/,
		);
		// marks without a verdict are not an answer yet
		expect(last(onChange)).toEqual({ rounds: {} });

		await user.click(screen.getByRole("radio", { name: "Close" }));
		await user.type(
			screen.getByLabelText("What is off? (optional)"),
			"Too chatty",
		);
		expect(last(onChange)).toEqual({
			rounds: {
				m1: {
					verdict: "close",
					flagged: ["Happy to discuss further."],
					note: "Too chatty",
					// which wording it is about: the server drops what was said of an earlier one
					tries: 0,
				},
			},
		});
		await user.click(again);
		expect(onRewrite).toHaveBeenCalledWith(
			"m1",
			["Happy to discuss further."],
			"Too chatty",
		);

		// written again, it starts unmarked: the old marks were about other words
		rerender(
			<MirrorStep
				step={{
					...step,
					rounds: [
						{
							...step.rounds[0],
							reply: "Not before launch. Scope is frozen.",
							tries: 1,
						},
						step.rounds[1],
					],
				}}
				part={0}
				onChange={onChange}
				onRewrite={onRewrite}
			/>,
		);
		expect(screen.queryByRole("button", { pressed: true })).toBeNull();
		expect(screen.getByLabelText("What is off? (optional)")).toHaveValue(
			"",
		);
		expect(
			screen.getByRole("button", { name: "Try again" }),
		).toBeDisabled();
	});

	it("stops offering to write an answer again after two tries, and says the marks are kept", async () => {
		const user = userEvent.setup();
		render(
			<MirrorStep
				step={step}
				part={1}
				onChange={vi.fn()}
				onRewrite={vi.fn()}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Ask Dana." }));
		expect(
			screen.getByRole("button", { name: "Try again" }),
		).toBeDisabled();
		expect(screen.getByText(/written again twice/)).toBeVisible();
	});
});

describe("a step the owner comes back to", () => {
	it("opens what was noticed with what they kept, dropped and put in their own words", () => {
		render(
			<ConfirmStep
				step={{
					...base,
					kind: "confirm",
					items: ["You answer in one line.", "You never say thanks."],
				}}
				initial={{
					items: ["You answer in one line.", "No small talk"],
				}}
				onChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", {
				name: "Keep: You answer in one line.",
			}),
		).toHaveAttribute("aria-pressed", "true");
		expect(
			screen.getByRole("button", { name: "Keep: You never say thanks." }),
		).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByLabelText("What I noticed, 3 of 3")).toHaveValue(
			"No small talk",
		);
	});

	it("opens the dials where they were left, and where they were set when what came back is no stop", () => {
		const step = {
			...base,
			kind: "dials" as const,
			dials: [
				{
					key: "formal",
					left: "Formal",
					right: "Casual",
					about: "Asking for a report",
					samples: ["One", "Two", "Three", "Four", "Five"],
					value: 2,
				},
			],
		};
		const { unmount } = render(
			<DialsStep
				step={step}
				initial={{ values: { formal: 5 } }}
				onChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("radio", {
				name: "5 of 5, from Formal to Casual",
			}),
		).toBeChecked();
		unmount();
		render(
			<DialsStep
				step={step}
				initial={{ values: { formal: 9 } }}
				onChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("radio", {
				name: "2 of 5, from Formal to Casual",
			}),
		).toBeChecked();
	});

	it("opens the replies with the one that was picked, or with the owner's own words", () => {
		const step = {
			...base,
			kind: "rounds" as const,
			rounds: [
				{
					id: "r1",
					from: "Sam, a teammate",
					message: "Can we move the date?",
					a: "No.",
					b: "Let us look at it.",
				},
				{
					id: "r2",
					from: "Priya, your manager",
					message: "Can you take this on?",
					a: "Yes.",
					b: "Yes, happily.",
				},
			],
		};
		const initial = {
			rounds: {
				r1: { pick: "b" },
				r2: { pick: "own", text: "Yes, later." },
			},
		};
		const { rerender } = render(
			<RoundsStep
				step={step}
				initial={initial}
				part={0}
				onChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Reply B: Let us look at it." }),
		).toHaveAttribute("aria-pressed", "true");
		rerender(
			<RoundsStep
				step={step}
				initial={initial}
				part={1}
				onChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByLabelText("Neither? Write what you would send"),
		).toHaveValue("Yes, later.");
		expect(screen.queryByRole("button", { pressed: true })).toBeNull();
	});

	it("opens the picks in the order they were made with what was added, without what is no longer offered", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<ChoiceStep
				step={{
					...base,
					kind: "choice",
					title: "What wins?",
					options: ["Speed", "Quality", "Cost"],
					ordered: true,
				}}
				initial={{
					picked: ["Quality", "My personal life", "Speed"],
					own: ["Trust"],
				}}
				onChange={onChange}
			/>,
		);
		expect(
			screen.getByTestId("choice-step-option-Quality"),
		).toHaveAccessibleName(/^1\s*Quality$/);
		expect(
			screen.getByTestId("choice-step-option-Speed"),
		).toHaveAccessibleName(/^2\s*Speed$/);
		expect(
			screen.getByRole("button", { name: "Remove Trust" }),
		).toBeVisible();
		// what was there stays in the answer as the owner goes on from it
		await user.click(screen.getByRole("button", { name: "Cost" }));
		expect(last(onChange)).toEqual({
			picked: ["Quality", "Speed", "Cost"],
			own: ["Trust"],
		});
	});

	it("opens the standing answers that were given, and does not offer their questions again", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<StandsStep
				step={{
					...base,
					kind: "stands",
					suggestions: ["When will it be done?", "Who owns this?"],
				}}
				initial={{
					rows: [
						{
							question: "When will it be done?",
							answer: "When it is tested.",
						},
					],
				}}
				onChange={onChange}
			/>,
		);
		expect(
			screen.getByLabelText("Your answer to When will it be done?"),
		).toHaveValue("When it is tested.");
		expect(
			screen.queryByRole("button", { name: "When will it be done?" }),
		).toBeNull();
		// one added now sits beside the one that was there
		await user.click(
			screen.getByRole("button", { name: "Who owns this?" }),
		);
		await user.type(
			screen.getByLabelText("Your answer to Who owns this?"),
			"Ask the lead.",
		);
		expect(last(onChange)).toEqual({
			rows: [
				{
					question: "When will it be done?",
					answer: "When it is tested.",
				},
				{ question: "Who owns this?", answer: "Ask the lead." },
			],
		});
	});

	it("opens what did not add up as it was settled", () => {
		render(
			<ProbeStep
				step={{
					...base,
					kind: "probe",
					probes: [
						{
							id: "p1",
							question:
								"You set Blunt but picked the softer reply.",
							a: "As blunt as the dial",
							b: "Softer, like my picks",
						},
					],
				}}
				initial={{
					probes: { p1: { pick: "both", note: "Who is asking" } },
				}}
				onChange={vi.fn()}
			/>,
		);
		expect(screen.getByRole("radio", { name: "It depends" })).toBeChecked();
		expect(screen.getByLabelText("What does it depend on?")).toHaveValue(
			"Who is asking",
		);
	});

	it("opens the twin's answers with what the owner said of them", () => {
		render(
			<MirrorStep
				step={{
					...base,
					kind: "mirror",
					rounds: [
						{
							id: "m1",
							ask: "Should we add the export?",
							reply: "Not before launch. Happy to discuss further.",
							tries: 1,
						},
					],
				}}
				initial={{
					rounds: {
						m1: {
							verdict: "no",
							flagged: ["Happy to discuss further."],
							note: "Too chatty",
						},
					},
				}}
				part={0}
				onChange={vi.fn()}
				onRewrite={vi.fn()}
			/>,
		);
		expect(screen.getByRole("radio", { name: "Not me" })).toBeChecked();
		const chatty = screen.getByTestId("mirror-step-sentence-1");
		expect(chatty).toHaveAttribute("aria-pressed", "true");
		expect(chatty).toHaveAccessibleName(
			/Happy to discuss further\.\s*\(not me\)/,
		);
		expect(screen.getByLabelText("What is off? (optional)")).toHaveValue(
			"Too chatty",
		);
	});
});
