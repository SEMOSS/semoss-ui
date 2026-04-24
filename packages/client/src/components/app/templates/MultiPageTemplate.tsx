import LANDINGPAGE from "@/assets/img/DragDrop.png";
import type { Template } from "./templates.types";

export const MultiPageTemplate: Template = {
	name: "Multi Page",
	description:
		"This is an app used to help you understand how to integrate multi page into app building",
	image: LANDINGPAGE,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {},
		blocks: {
			"page-1": {
				slots: {
					content: {
						children: ["text--5103", "link--4550", "link--6451"],
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
						order: [],
					},
				},
				id: "page-1",
			},
			"page--2889": {
				id: "page--2889",
				widget: "page",
				parent: null,
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "24px",
						gap: "8px",
						fontFamily: "roboto",
					},
					route: "about",
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: ["text--4135", "link--8114"],
					},
				},
			},
			"page--1193": {
				id: "page--1193",
				widget: "page",
				parent: null,
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "24px",
						gap: "8px",
						fontFamily: "roboto",
					},
					route: "resources",
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: ["text--170", "link--9507", "link--2298"],
					},
				},
			},
			"link--2298": {
				id: "link--2298",
				widget: "link",
				parent: {
					id: "page--1193",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					href: "https://github.com/",
					text: "Version Control",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"text--170": {
				id: "text--170",
				widget: "text",
				parent: {
					id: "page--1193",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Resources",
					variant: "h1",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"link--9507": {
				id: "link--9507",
				widget: "link",
				parent: {
					id: "page--1193",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					href: "/",
					text: "Go home",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"text--4135": {
				id: "text--4135",
				widget: "text",
				parent: {
					id: "page--2889",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "About",
					variant: "h1",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"link--8114": {
				id: "link--8114",
				widget: "link",
				parent: {
					id: "page--2889",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					href: "/resources",
					text: "Go to resources",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"text--5103": {
				id: "text--5103",
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
					text: "Landing Page",
					variant: "h1",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"link--4550": {
				id: "link--4550",
				widget: "link",
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
					href: "/resources",
					text: "Go to resources",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"link--6451": {
				id: "link--6451",
				widget: "link",
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
					href: "/about",
					text: "Go to About",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
		},
		variables: {},
		executionOrder: [],
		version: "1.0.0-alpha.10",
	},
};
