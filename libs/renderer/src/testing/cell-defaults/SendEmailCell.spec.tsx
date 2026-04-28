import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { DefaultBlocks } from "../../components/block-defaults";
import { Blocks } from "../../components/blocks";
import { SendEmailCell } from "../../components/cell-defaults/send-email-cell/SendEmailCell";
import { StateStore } from "../../store";

const query = {
	mcp_driver: {
		id: "mcp_driver",
		cells: [
			{
				id: "1",
				widget: "send-email",
				parameters: {
					smtpHost: "localhost",
					smtpPort: "1025",
					subject: "Nothing",
					to: "john@test.com",
					cc: "",
					bcc: "",
					from: "test@test.com",
					message: "Helloooo",
					username: "test",
					password: "test",
				},
			},
		],
	},
};

describe("Send Email Cell", () => {
	const renderWithBlocks = (ui: React.ReactElement) => {
		const store = new StateStore({
			mode: "interactive",
			insightId: "new",
			state: {
				executionOrder: [],
				queries: {
					[query.mcp_driver.id]: query.mcp_driver,
				},
				variables: {},
				version: "",
				blocks: {},
			},
			cellRegistry: {},
		});

		return render(
			<Blocks state={store} registry={DefaultBlocks}>
				{ui}
			</Blocks>,
		);
	};

	test("renders all send-email form fields", () => {
		const cell = {
			id: "1",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		renderWithBlocks(
			<SendEmailCell cell={cell as never} isExpanded={true} />,
		);

		expect(screen.getByPlaceholderText("smtpHost")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("smtpPort")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("password")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("from")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("to")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("cc")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("bcc")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("subject")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("message")).toBeInTheDocument();
	});

	test("displays correct input values in textboxes", async () => {
		const cell = {
			id: "1",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		const user = userEvent.setup();

		renderWithBlocks(
			<SendEmailCell cell={cell as never} isExpanded={true} />,
		);

		const smtpHostInput = screen.getByPlaceholderText(
			"smtpHost",
		) as HTMLInputElement;
		const smtpPortInput = screen.getByPlaceholderText(
			"smtpPort",
		) as HTMLInputElement;
		const usernameInput = screen.getByPlaceholderText(
			"username",
		) as HTMLInputElement;
		const fromInput = screen.getByPlaceholderText(
			"from",
		) as HTMLInputElement;
		const toInput = screen.getByPlaceholderText("to") as HTMLInputElement;
		const subjectInput = screen.getByPlaceholderText(
			"subject",
		) as HTMLInputElement;
		const messageInput = screen.getByPlaceholderText(
			"message",
		) as HTMLTextAreaElement;
		const passwordInput = screen.getByPlaceholderText(
			"password",
		) as HTMLInputElement;

		await user.type(
			usernameInput,
			query.mcp_driver.cells[0].parameters.username,
		);
		await user.type(
			passwordInput,
			query.mcp_driver.cells[0].parameters.password,
		);
		await user.type(fromInput, query.mcp_driver.cells[0].parameters.from);
		await user.type(toInput, query.mcp_driver.cells[0].parameters.to);
		await user.type(
			subjectInput,
			query.mcp_driver.cells[0].parameters.subject,
		);
		await user.type(
			messageInput,
			query.mcp_driver.cells[0].parameters.message,
		);

		expect(smtpHostInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.smtpHost,
		);
		expect(smtpPortInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.smtpPort,
		);
		expect(usernameInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.username,
		);
		expect(passwordInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.password,
		);
		expect(fromInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.from,
		);
		expect(toInput).toHaveValue(query.mcp_driver.cells[0].parameters.to);
		expect(subjectInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.subject,
		);
		expect(messageInput).toHaveValue(
			query.mcp_driver.cells[0].parameters.message,
		);
	});
});
