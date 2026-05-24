import CHATAI from "@/assets/img/DragDrop.png";
import { TEMPLATE_ACTION_MESSAGES } from "./action-messages";
import type { Template } from "./templates.types";

// TODO: Expand on this
// 1. Show better menu option labels unique-id and name/better-column??
// 2. Above the delete button show more meta of the selected option so user can understand more about the row they are about to delete
export const DeleteDiabetesRecordTemplate: Template = {
	name: "Delete Diabetes Record",
	description: "Delete a diabetes record",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			"delete-record": {
				id: "delete-record",
				cells: [
					{
						id: "53371",
						widget: "code",
						parameters: {
							code: "from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = \"950eb187-e352-444d-ad6a-6476ed9390af\", insight_id = '${i}');",
							type: "py",
						},
					},
					{
						id: "53370",
						widget: "code",
						parameters: {
							code: 'databaseEngine.removeData(query = "DELETE FROM diabetes WHERE DIABETES_UNIQUE_ROW_ID={{delete_id}}")',
							type: "py",
						},
					},
				],
			},
			"on-page-load": {
				id: "on-page-load",
				cells: [
					{
						id: "36924",
						widget: "query-import",
						parameters: {
							frameVariableName: "FRAME_22910",
							frameType: "PY",
							databaseId: "950eb187-e352-444d-ad6a-6476ed9390af",
							selectQuery: "SELECT * FROM diabetes",
						},
					},
					{
						id: "36923",
						widget: "code",
						parameters: {
							code: "unique_row_id = FRAME_22910['DIABETES_UNIQUE_ROW_ID'].to_list();",
							type: "py",
						},
					},
					{
						id: "36925",
						widget: "code",
						parameters: {
							code: "unique_row_id",
							type: "py",
						},
					},
				],
			},
		},
		blocks: {
			"text--2655": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "text",
				data: {
					route: "text--2655",
					variant: "p",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: " {{delete-id.output}} ",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--2655",
			},
			"page-1": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					content: {
						children: [
							"text--7810",
							"select--9490",
							"button--601",
							"text--2655",
						],
						name: "content",
					},
				},
				widget: "page",
				data: {
					route: "",
					style: {
						padding: "24px",
						fontFamily: "roboto",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
					},
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [
							{
								payload: {
									queryId: "on-page-load",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
						],
					},
				},
				id: "page-1",
			},
			"select--9490": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					content: {
						children: [],
						name: "content",
					},
				},
				widget: "select",
				data: {
					optionLabel: "",
					route: "select--9490",
					hint: "",
					optionSublabel: "",
					options: "{{unique_row_id.output}}",
					style: {
						padding: "4px",
					},
					disabled: false,
					label: "Select Unique ID",
					loading: "{{page-load-query.isLoading}}",
					required: false,
				},
				listeners: {
					onChange: {
						type: "sync",
						order: [],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "select--9490",
			},
			"text--7810": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "text",
				data: {
					route: "text--7810",
					variant: "p",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						fontSize: "20px",
						textOverflow: "ellipsis",
					},
					text: "Delete Diabetes Record",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--7810",
			},
			"button--601": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "button",
				data: {
					route: "button--601",
					color: "error",
					variant: "contained",
					style: {},
					disabled: false,
					label: "Delete Record",
					loading: "{{delete-id.isLoading}}",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								payload: {
									queryId: "delete-record",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
							{
								payload: {
									queryId: "on-page-load",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "button--601",
			},
		},
		variables: {
			"delete-id": {
				to: "delete-record",
				type: "cell",
				cellId: "53370",
			},
			delete_id: {
				to: "select--9490",
				type: "block",
			},
			"page-load-query": {
				to: "on-page-load",
				type: "query",
			},
			unique_row_id: {
				to: "on-page-load",
				type: "cell",
				cellId: "36925",
			},
			"delete-record--53371": {
				type: "cell",
				to: "delete-record",
				cellId: "53371",
			},
			"on-page-load--36924": {
				type: "cell",
				to: "on-page-load",
				cellId: "36924",
			},
			"on-page-load--36923": {
				type: "cell",
				to: "on-page-load",
				cellId: "36923",
			},
		},
		executionOrder: ["on-page-load", "delete-record"],
		version: "1.0.0-alpha.10",
	},
};
