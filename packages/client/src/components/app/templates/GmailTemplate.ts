import { ActionMessages } from "@semoss/renderer";
import GOOGLE from "@/assets/img/google.png";
import type { Template } from "./templates.types";

export const GmailTemplate: Template = {
	name: "Gmail",
	description:
		"This is a template app that performs gmail operations using the Gmail API.",
	image: GOOGLE,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			data: {
				id: "data",
				cells: [
					{
						id: "6",
						widget: "code",
						parameters: {
							type: "pixel",
							code: "GoogleGmailProfileById()",
						},
					},
					{
						id: "1",
						widget: "code",
						parameters: {
							code: "GoogleGmailList(limit=5)",
							type: "pixel",
						},
					},
					{
						id: "2",
						widget: "code",
						parameters: {
							type: "pixel",
							code: "GoogleGmailGetUnreadEmails(limit=5)",
						},
					},
					{
						id: "3",
						widget: "code",
						parameters: {
							type: "pixel",
							code: "GoogleGmailReadEmail(id={{selectedMailId}})",
						},
					},
					{
						id: "4",
						widget: "code",
						parameters: {
							type: "pixel",
							code: 'GoogleGmailSendEmail(to="{{to}}", subject="{{subject}}", message="{{content_message}}")',
						},
					},
					{
						id: "5",
						widget: "code",
						parameters: {
							type: "pixel",
							code: "GoogleGmailDeleteEmail(id={{selectedMailId}})",
						},
					},
				],
			},
		},
		blocks: {
			"page-1": {
				slots: {
					content: {
						children: [
							"modal--1",
							"modal--2",
							"modal--3",
							"text--1",
							"container--1",
							"container--2",
							"container--18",
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
					loading: "{{data.isLoading}}",
				},
				listeners: {
					onPageLoad: {
						type: "async",
						order: [
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "6",
								},
							},
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "1",
								},
							},
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "2",
								},
							},
						],
					},
				},
				id: "page-1",
			},
			"text--1": {
				id: "text--1",
				widget: "text",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Gmail",
					variant: "h1",
					show: "{{getUserData.isSuccessful}}",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--2": {
				id: "text--2",
				widget: "text",
				parent: {
					id: "container--6",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "{{getUserData.output.emailAddress}} ",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--1": {
				id: "container--1",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "0px",
						flexWrap: "wrap",
						alignItems: "center",
					},
					show: "{{getUserData.isSuccessful}}",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["container--6", "container--15"],
					},
				},
				communityBlockMapping: {},
			},
			"text--3": {
				id: "text--3",
				widget: "text",
				parent: {
					id: "container--6",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Logged in by :",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--2": {
				id: "container--2",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
					},
					show: "{{getUserData.isSuccessful}}",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["tab--1"],
					},
				},
				communityBlockMapping: {},
			},
			"tab--1": {
				id: "tab--1",
				widget: "tab",
				parent: {
					id: "container--2",
					slot: "children",
				},
				data: {
					style: {},
					triggerBgColor: "",
					contentBgColor: "",
					showExpandIcon: false,
					activeTab: 1,
					show: "true",
					tabLabels: ["All Mails", "Unread Mails"],
					tabOrientation: "horizontal",
					variant: "standard",
					showTabIndicator: true,
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onChange: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					"1": {
						name: "1",
						children: ["iteration--1"],
					},
					"2": {
						name: "2",
						children: ["iteration--2"],
					}
				},
				communityBlockMapping: {},
			},
			"container--4": {
				id: "container--4",
				widget: "container",
				parent: {
					id: "iteration--2",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--5", "button--3"],
					},
				},
				communityBlockMapping: {},
			},
			"container--3": {
				id: "container--3",
				widget: "container",
				parent: {
					id: "iteration--1",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--4", "button--1", "button--2"],
					},
				},
				communityBlockMapping: {},
			},
			"text--4": {
				id: "text--4",
				widget: "text",
				parent: {
					id: "container--3",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						textAlign: "left",
					},
					text: "$getAllMails.subject",
					variant: "p",
					show: "true",
					loading: "{{getAllMails.isLoading}}",
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"button--1": {
				id: "button--1",
				widget: "button",
				parent: {
					id: "container--3",
					slot: "children",
				},
				data: {
					style: {},
					label: "Read",
					loading: "{{getAllMails.isLoading}}",
					disabled: false,
					variant: "outlined",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "selectedMailId",
									value: "$getAllMails.id",
									blockId: "button--1",
								},
							},
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "mailDetailsModal",
									value: "true",
									blockId: "button--1",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"button--2": {
				id: "button--2",
				widget: "button",
				parent: {
					id: "container--3",
					slot: "children",
				},
				data: {
					style: {},
					label: "Delete",
					loading: "{{getAllMails.isLoading}}",
					disabled: false,
					variant: "outlined",
					color: "error",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "selectedMailId",
									value: "$getAllMails.id",
									blockId: "button--2",
								},
							},
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									blockId: "",
									variable: "deleteModal",
									value: "true",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--5": {
				id: "text--5",
				widget: "text",
				parent: {
					id: "container--4",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "$getUnreadMails.subject",
					variant: "p",
					show: "true",
					loading: "{{getUnreadMails.isLoading}}",
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"button--3": {
				id: "button--3",
				widget: "button",
				parent: {
					id: "container--4",
					slot: "children",
				},
				data: {
					style: {},
					label: "Read",
					loading: "{{getUnreadMails.isLoading}}",
					disabled: false,
					variant: "outlined",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "selectedMailId",
									value: "$getUnreadMails.id",
									blockId: "button--3",
								},
							},
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "mailDetailsModal",
									value: "true",
									blockId: "button--3",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--6": {
				id: "container--6",
				widget: "container",
				parent: {
					id: "container--1",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "0px",
						flexWrap: "wrap",
						alignItems: "center",
						width: "60%",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--3", "text--2"],
					},
				},
				communityBlockMapping: {},
			},
			"button--5": {
				id: "button--5",
				widget: "button",
				parent: {
					id: "container--15",
					slot: "children",
				},
				data: {
					style: {},
					label: "Compose Mail",
					loading: false,
					disabled: false,
					variant: "contained",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "composeModal",
									value: "true",
									blockId: "button--5",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"modal--1": {
				id: "modal--1",
				widget: "modal",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {},
					title: "Compose new mail",
					open: "{{composeModal}} ",
					fullWidth: true,
					maxWidth: "sm",
					minWidth: "sm",
					designMode: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onClose: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "composeModal",
									value: "false",
									blockId: "modal--1",
								},
							},
						],
					},
				},
				slots: {
					content: {
						name: "content",
						children: ["container--7", "container--8"],
					},
					footer: {
						name: "footer",
						children: ["container--9"],
					},
				},
				communityBlockMapping: {},
			},
			"container--7": {
				id: "container--7",
				widget: "container",
				parent: {
					id: "modal--1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						backgroundColor: "#fffdfd",
						border: "1px solid #ebe7e7",
						"border-radius": "6px",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["input--1", "input--2"],
					},
				},
				communityBlockMapping: {},
			},
			"container--8": {
				id: "container--8",
				widget: "container",
				parent: {
					id: "modal--1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["input--3"],
					},
				},
				communityBlockMapping: {},
			},
			"input--1": {
				id: "input--1",
				widget: "input",
				parent: {
					id: "container--7",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "To",
					hint: "",
					type: "text",
					rows: 1,
					multiline: false,
					disabled: false,
					required: false,
					loading: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onChange: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: [],
					},
				},
				communityBlockMapping: {},
			},
			"input--2": {
				id: "input--2",
				widget: "input",
				parent: {
					id: "container--7",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "Subject",
					hint: "",
					type: "text",
					rows: 1,
					multiline: false,
					disabled: false,
					required: false,
					loading: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onChange: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: [],
					},
				},
				communityBlockMapping: {},
			},
			"input--3": {
				id: "input--3",
				widget: "input",
				parent: {
					id: "container--8",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "Content",
					hint: "",
					type: "text",
					rows: 10,
					multiline: false,
					disabled: false,
					required: false,
					loading: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onChange: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: [],
					},
				},
				communityBlockMapping: {},
			},
			"container--9": {
				id: "container--9",
				widget: "container",
				parent: {
					id: "modal--1",
					slot: "footer",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						justifyContent: "flex-end",
						alignItems: "center",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["button--6", "button--7"],
					},
				},
				communityBlockMapping: {},
			},
			"button--6": {
				id: "button--6",
				widget: "button",
				parent: {
					id: "container--9",
					slot: "children",
				},
				data: {
					style: {},
					label: "Cancel",
					loading: false,
					disabled: false,
					variant: "outlined",
					color: "error",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "composeModal",
									value: "false",
									blockId: "button--6",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"button--7": {
				id: "button--7",
				widget: "button",
				parent: {
					id: "container--9",
					slot: "children",
				},
				data: {
					style: {},
					label: "Send",
					loading: "{{sendMail.isLoading}}",
					disabled: false,
					variant: "contained",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "4",
								},
							},
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "composeModal",
									value: "false",
									blockId: "button--7",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"modal--2": {
				id: "modal--2",
				widget: "modal",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {},
					title: "Mail Content",
					open: "{{mailDetailsModal}} ",
					fullWidth: true,
					maxWidth: "sm",
					minWidth: "sm",
					designMode: false,
					show: "",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "3",
								},
							},
						],
					},
					onClose: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "mailDetailsModal",
									value: "false",
									blockId: "modal--2",
								},
							},
						],
					},
				},
				slots: {
					content: {
						name: "content",
						children: [
							"container--10",
							"container--11",
							"container--12",
							"container--13",
						],
					},
					footer: {
						name: "footer",
						children: ["container--14"],
					},
				},
				communityBlockMapping: {},
			},
			"container--10": {
				id: "container--10",
				widget: "container",
				parent: {
					id: "modal--2",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: "0px",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--7", "text--8"],
					},
				},
				communityBlockMapping: {},
			},
			"text--7": {
				id: "text--7",
				widget: "text",
				parent: {
					id: "container--10",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						fontSize: "13px",
					},
					text: "From : ",
					variant: "h6",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--8": {
				id: "text--8",
				widget: "text",
				parent: {
					id: "container--10",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: " {{readMail.output.from}} ",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--9": {
				id: "text--9",
				widget: "text",
				parent: {
					id: "container--11",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						fontSize: "13px",
					},
					text: "To : ",
					variant: "h6",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--10": {
				id: "text--10",
				widget: "text",
				parent: {
					id: "container--11",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: " {{readMail.output.to}} ",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--11": {
				id: "container--11",
				widget: "container",
				parent: {
					id: "modal--2",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: "0px",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--9", "text--10"],
					},
				},
				communityBlockMapping: {},
			},
			"text--11": {
				id: "text--11",
				widget: "text",
				parent: {
					id: "container--12",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						fontSize: "13px",
					},
					text: "Subject :",
					variant: "h6",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--12": {
				id: "text--12",
				widget: "text",
				parent: {
					id: "container--12",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: " {{readMail.output.subject}} ",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--12": {
				id: "container--12",
				widget: "container",
				parent: {
					id: "modal--2",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: "0px",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--11", "text--12"],
					},
				},
				communityBlockMapping: {},
			},
			"text--13": {
				id: "text--13",
				widget: "text",
				parent: {
					id: "container--13",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						fontSize: "13px",
					},
					text: "Content :",
					variant: "h6",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"text--14": {
				id: "text--14",
				widget: "text",
				parent: {
					id: "container--13",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: " {{readMail.output.content}} ",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--13": {
				id: "container--13",
				widget: "container",
				parent: {
					id: "modal--2",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: "0px",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--13", "text--14"],
					},
				},
				communityBlockMapping: {},
			},
			"container--14": {
				id: "container--14",
				widget: "container",
				parent: {
					id: "modal--2",
					slot: "footer",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						justifyContent: "flex-end",
						alignItems: "center",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["button--8"],
					},
				},
				communityBlockMapping: {},
			},
			"button--8": {
				id: "button--8",
				widget: "button",
				parent: {
					id: "container--14",
					slot: "children",
				},
				data: {
					style: {},
					label: "Close",
					loading: false,
					disabled: false,
					variant: "outlined",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "mailDetailsModal",
									value: "false",
									blockId: "button--8",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"iteration--1": {
				id: "iteration--1",
				widget: "iteration",
				parent: {
					id: "tab--1",
					slot: "1",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
					},
					source: " {{getAllMails}}",
					child: {
						id: "container--3",
						widget: "container",
						parent: {
							id: "iteration--1",
							slot: "children",
						},
						data: {
							style: {
								display: "flex",
								flexDirection: "row",
								padding: "4px",
								gap: "8px",
								flexWrap: "wrap",
								alignItems: "center",
							},
							show: "true",
							loading: false,
							loadType: "Skeleton",
							boxShadowParts: {
								offsetX: "",
								offsetY: "",
								blurRadius: "",
								spreadRadius: "",
								color: "",
							},
						},
						listeners: {
							preProcess: {
								type: "sync",
								order: [],
							},
						},
						slots: {
							children: {
								name: "children",
								children: ["text--4", "button--1", "button--2"],
							},
						},
						communityBlockMapping: {},
					},
					removeIds: [],
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["container--3"],
					},
				},
				communityBlockMapping: {},
			},
			"iteration--2": {
				id: "iteration--2",
				widget: "iteration",
				parent: {
					id: "tab--1",
					slot: "2",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
					},
					source: " {{getUnreadMails}} ",
					child: {
						id: "container--4",
						widget: "container",
						parent: {
							id: "iteration--2",
							slot: "children",
						},
						data: {
							style: {
								display: "flex",
								flexDirection: "row",
								padding: "4px",
								gap: "8px",
								flexWrap: "wrap",
								alignItems: "center",
							},
							show: "true",
							loading: false,
							loadType: "Skeleton",
							boxShadowParts: {
								offsetX: "",
								offsetY: "",
								blurRadius: "",
								spreadRadius: "",
								color: "",
							},
						},
						listeners: {
							preProcess: {
								type: "sync",
								order: [],
							},
						},
						slots: {
							children: {
								name: "children",
								children: ["text--5", "button--3"],
							},
						},
						communityBlockMapping: {},
					},
					removeIds: [],
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["container--4"],
					},
				},
				communityBlockMapping: {},
			},
			"iteration--3": {
				id: "iteration--3",
				widget: "iteration",
				parent: {
					id: "tab--1",
					slot: "3",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
					},
					source: "",
					removeIds: [],
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["container--5"],
					},
				},
				communityBlockMapping: {},
			},
			"container--5": {
				id: "container--5",
				widget: "container",
				parent: {
					id: "iteration--3",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--6"],
					},
				},
				communityBlockMapping: {},
			},
			"text--6": {
				id: "text--6",
				widget: "text",
				parent: {
					id: "container--5",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Reactor work in progress...",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--15": {
				id: "container--15",
				widget: "container",
				parent: {
					id: "container--1",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
						justifyContent: "flex-end",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["button--9", "button--5"],
					},
				},
				communityBlockMapping: {},
			},
			"button--9": {
				id: "button--9",
				widget: "button",
				parent: {
					id: "container--15",
					slot: "children",
				},
				data: {
					style: {},
					label: "Refresh",
					loading: false,
					disabled: false,
					variant: "outlined",
					color: "success",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "1",
								},
							},
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "2",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"modal--3": {
				id: "modal--3",
				widget: "modal",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {},
					title: "Delete Email",
					open: " {{deleteModal}} ",
					fullWidth: true,
					maxWidth: "sm",
					minWidth: "sm",
					designMode: false,
					show: "",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onClose: {
						type: "sync",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									blockId: "",
									variable: "deleteModal",
									value: "false",
								},
							},
						],
					},
				},
				slots: {
					content: {
						name: "content",
						children: ["text--15"],
					},
					footer: {
						name: "footer",
						children: ["container--16"],
					},
				},
				communityBlockMapping: {},
			},
			"text--15": {
				id: "text--15",
				widget: "text",
				parent: {
					id: "modal--3",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Are you sure you want to delete this mail?",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--16": {
				id: "container--16",
				widget: "container",
				parent: {
					id: "modal--3",
					slot: "footer",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["container--17"],
					},
				},
				communityBlockMapping: {},
			},
			"container--17": {
				id: "container--17",
				widget: "container",
				parent: {
					id: "container--16",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						justifyContent: "flex-end",
						alignItems: "center",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["button--10", "button--11"],
					},
				},
				communityBlockMapping: {},
			},
			"button--10": {
				id: "button--10",
				widget: "button",
				parent: {
					id: "container--17",
					slot: "children",
				},
				data: {
					style: {},
					label: "Cancel",
					loading: false,
					disabled: false,
					variant: "outlined",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "async",
						order: [
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									blockId: "",
									variable: "selectedMailId",
									value: '""',
								},
							},
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "deleteModal",
									value: "false",
									blockId: "button--10",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"button--11": {
				id: "button--11",
				widget: "button",
				parent: {
					id: "container--17",
					slot: "children",
				},
				data: {
					style: {},
					label: "Yes, Delete!",
					loading: "{{deleteMail.isLoading}}",
					disabled: false,
					variant: "contained",
					color: "error",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "5",
								},
							},
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "1",
								},
							},
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "2",
								},
							},
							{
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									variable: "deleteModal",
									value: "false",
									blockId: "button--10",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"container--18": {
				id: "container--18",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "24px",
						gap: "16px",
						flexWrap: "wrap",
						alignItems: "center",
						justifyContent: "center",
						marginTop: "48px",
					},
					show: "{{getUserData.isError}}",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["text--16"],
					},
				},
				communityBlockMapping: {},
			},
			"text--16": {
				id: "text--16",
				widget: "text",
				parent: {
					id: "container--18",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						textAlign: "center",
						fontSize: "18px",
					},
					text: "Please login with Google",
					variant: "h5",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
		},
		variables: {
			data: {
				type: "query",
				to: "data",
			},
			getAllMails: {
				type: "cell",
				to: "data",
				cellId: "1",
			},
			getUnreadMails: {
				type: "cell",
				to: "data",
				cellId: "2",
			},
			mailDetailsModal: {
				type: "string",
				value: "false",
			},
			composeModal: {
				type: "string",
				value: "false",
			},
			selectedMailId: {
				type: "string",
				value: "$getAllMails.id",
			},
			readMail: {
				type: "cell",
				to: "data",
				cellId: "3",
			},
			sendMail: {
				type: "cell",
				to: "data",
				cellId: "4",
			},
			to: {
				type: "block",
				to: "input--1",
			},
			subject: {
				type: "block",
				to: "input--2",
			},
			content_message: {
				type: "block",
				to: "input--3",
			},
			deleteMail: {
				type: "cell",
				to: "data",
				cellId: "5",
			},
			deleteModal: {
				type: "string",
				value: "false",
			},
			getUserData: {
				type: "cell",
				to: "data",
				cellId: "6",
			},
		},
		executionOrder: ["data"],
		version: "1.0.0-alpha.16",
	},
};
