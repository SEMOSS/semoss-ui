import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Form, useForm } from "@semoss/ui/next";
import { SqlPolicyRulesField } from "./sql-policy-rules-field";
import {
	type PolicyFormValues,
	type PolicyRule,
	toBuiltInRules,
} from "./sql-query-policy";

const BUILT_INS = toBuiltInRules({ "PG_SLEEP*": "DENY", VERSION: "DENY" });

/** Props for {@link RulesHarness}. */
interface RulesHarnessProps {
	/** The function rules the form starts with. */
	rules: PolicyRule[];
	/** Whether the list can fold away, starting folded. */
	isCollapsible?: boolean;
}

/** The function rules list inside a form of its own. */
const RulesHarness = ({ rules, isCollapsible = false }: RulesHarnessProps) => {
	const form = useForm<PolicyFormValues>({
		defaultValues: {
			OPERATION_POLICY: [],
			FUNCTION_POLICY: rules,
			VARIABLE_POLICY: [],
			KEYWORD_POLICY: [],
			RELATION_POLICY: [],
			ROUTINE_POLICY: [],
		},
	});
	const [isOpen, setIsOpen] = useState(!isCollapsible);
	return (
		<Form form={form} onSubmit={() => undefined}>
			<SqlPolicyRulesField
				name="FUNCTION_POLICY"
				matchKind="name"
				label="Functions"
				description="Functions the SQL calls."
				builtIns={BUILT_INS}
				open={isOpen}
				onOpenChange={isCollapsible ? setIsOpen : undefined}
			/>
		</Form>
	);
};

afterEach(cleanup);

describe("SQL policy rules", () => {
	it("lists the built-in rules, and adds a removed one back", () => {
		render(<RulesHarness rules={BUILT_INS} />);
		expect(screen.getByText("PG_SLEEP*")).toBeInTheDocument();
		expect(screen.getAllByText("Built-in")).toHaveLength(2);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove the PG_SLEEP* rule from functions",
			}),
		);
		expect(screen.getAllByText("Built-in")).toHaveLength(1);
		const addBack = screen.getByRole("button", {
			name: "Add back the built-in functions rule for PG_SLEEP*",
		});

		fireEvent.click(addBack);
		expect(screen.getAllByText("Built-in")).toHaveLength(2);
		expect(
			screen.queryByRole("button", {
				name: "Add back the built-in functions rule for PG_SLEEP*",
			}),
		).not.toBeInTheDocument();
	});

	it("moves focus to the rule that takes a removed one's place, then to Add rule", () => {
		render(<RulesHarness rules={BUILT_INS} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove the PG_SLEEP* rule from functions",
			}),
		);
		expect(
			screen.getByRole("combobox", {
				name: "Functions, the VERSION rule: access",
			}),
		).toHaveFocus();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove the VERSION rule from functions",
			}),
		);
		expect(screen.getByRole("button", { name: "Add rule" })).toHaveFocus();
	});

	it("does not offer a built-in rule back while a rule of the user's own covers it", () => {
		render(
			<RulesHarness
				rules={[BUILT_INS[0], { key: "version", requirement: "OWNER" }]}
			/>,
		);

		expect(
			screen.queryByRole("button", {
				name: "Add back the built-in functions rule for VERSION",
			}),
		).not.toBeInTheDocument();
	});

	it("folds the rules away under a label that counts them", () => {
		render(<RulesHarness rules={[BUILT_INS[0]]} isCollapsible />);
		const label = screen.getByRole("button", { name: /Functions/ });

		expect(label).toHaveAttribute("aria-expanded", "false");
		expect(label).toHaveTextContent("1 rule, 1 built-in removed");
		expect(screen.queryByText("PG_SLEEP*")).not.toBeInTheDocument();

		fireEvent.click(label);
		expect(label).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText("PG_SLEEP*")).toBeInTheDocument();
	});
});
