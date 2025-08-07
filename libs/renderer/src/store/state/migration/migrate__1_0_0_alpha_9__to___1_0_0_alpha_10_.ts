import type { Migration } from "./migration.types";

/**
 * @name config
 * @description
 *
 *  Make every cell a variable if not already
 * */
const config: Migration = {
	versionFrom: "1.0.0-alpha.9",
	versionTo: "1.0.0-alpha.10",
	run: (state) => {
		const newState = { ...state };

		// check each cell, convert each cell to a
		Object.values(state.queries).forEach((q) => {
			q.cells.forEach((c) => {
				let found = false;
				Object.values(newState.variables).forEach((variable) => {
					if (variable.to === q.id) {
						if (c.id === variable.cellId) {
							found = true;
						}
					}
				});

				// create a variable for cells that arent already there
				if (!found) {
					const variableConfig = {
						type: "cell",
						to: q.id,
						cellId: c.id,
					};

					// EDGE CASE: Check if someone coincidentally named there variable nbName--cellId
					const baseKey = `${q.id}--${c.id}`;
					let variableKey = baseKey;
					let attemptCount = 0;

					while (newState.variables[variableKey]) {
						const randomSuffix = Math.floor(Math.random() * 100000);
						variableKey = `${baseKey}--${randomSuffix}`;

						attemptCount++;

						if (attemptCount > 100) {
							throw new Error(
								`Failed to generate unique id for variable pointing to -->  sheet: ${q.id} cell:${c.id}`,
							);
						}
					}
					newState.variables[`${q.id}--${c.id}`] = variableConfig;
				}
			});
		});

		return newState;
	},
};

export default config;

// {
//     "queries": {
//         "long-python": {
//             "id": "long-python",
//             "cells": [
//                 {
//                     "id": 78792,
//                     "widget": "code",
//                     "parameters": {
//                         "code": "import random\r\nimport time\r\n\r\nmatch = 3\r\nb = True\r\ncount = 0\r\n\r\nwhile b:\r\n    count +=1\r\n    random_number = random.randint(1, 5)  # Generates a random integer between 1 and 100\r\n    print(f\"Generated: {random_number}\")\r\n    print(f\"Count: {count}\")\r\n    if(match == random_number): b = False\r\n    time.sleep(1)  # Pauses for 1 second before generating the next number\r\n\r\nmatch",
//                         "type": "py"
//                     }
//                 },
//                 {
//                     "id": "78791",
//                     "widget": "code",
//                     "parameters": {
//                         "type": "py",
//                         "code": "\"long-python sheet is done executing: \" + f\"It took {count} times to guess.\""
//                     }
//                 }
//             ]
//         },
//         "quick-addition": {
//             "id": "quick-addition",
//             "cells": [
//                 {
//                     "id": 38750,
//                     "widget": "code",
//                     "parameters": {
//                         "code": "add = 1+99\r\nadd",
//                         "type": "py"
//                     }
//                 },
//                 {
//                     "id": "38749",
//                     "widget": "code",
//                     "parameters": {
//                         "type": "py",
//                         "code": "\r\n\"\"\"This is the quick-addition sheet - 1+99={{add-cell}}\"\"\"\r\n"
//                     }
//                 }
//             ]
//         },
//         "llm-call": {
//             "id": "llm-call",
//             "cells": [
//                 {
//                     "id": 76289,
//                     "widget": "code",
//                     "parameters": {
//                         "code": "LLM(engine = \"4acbe913-df40-4ac0-b28a-daa5ad91b172\", command = \"<encode>Who won the world series in 1995, Tell me about how good the team is with 400 words</encode>\", paramValues=[{'max_completion_tokens':2000,'temperature':0.3}]);",
//                         "type": "pixel"
//                     }
//                 },
//                 {
//                     "id": "76288",
//                     "widget": "code",
//                     "parameters": {
//                         "type": "py",
//                         "code": "\"llm-call notebook: \" + \" \" + {{unstructured-llm}}[\"response\"]"
//                     }
//                 }
//             ]
//         }
//     },
//     "blocks": {
//         "page-1": {
//             "slots": {
//                 "content": {
//                     "children": [
//                         "text--4960",
//                         "text--458",
//                         "text--639",
//                         "text--651",
//                         "text--8726",
//                         "text--8791"
//                     ],
//                     "name": "content"
//                 }
//             },
//             "widget": "page",
//             "data": {
//                 "route": "",
//                 "style": {
//                     "padding": "24px",
//                     "fontFamily": "roboto",
//                     "flexDirection": "column",
//                     "display": "flex",
//                     "gap": "8px"
//                 }
//             },
//             "listeners": {
//                 "onPageLoad": {
//                     "type": "sync",
//                     "order": [
//                         {
//                             "message": "DISPATCH_OUTPUTS_EVENT",
//                             "payload": {}
//                         },
//                         {
//                             "message": "RUN_QUERY",
//                             "payload": {
//                                 "queryId": "long-python"
//                             }
//                         },
//                         {
//                             "message": "RUN_QUERY",
//                             "payload": {
//                                 "queryId": "quick-addition"
//                             }
//                         },
//                         {
//                             "message": "RUN_QUERY",
//                             "payload": {
//                                 "queryId": "llm-call"
//                             }
//                         }
//                     ]
//                 }
//             },
//             "id": "page-1"
//         },
//         "text--4960": {
//             "id": "text--4960",
//             "widget": "text",
//             "parent": {
//                 "id": "page-1",
//                 "slot": "content"
//             },
//             "data": {
//                 "style": {
//                     "padding": "4px",
//                     "whiteSpace": "pre-line",
//                     "textOverflow": "ellipsis"
//                 },
//                 "text": "Event 1",
//                 "variant": "h3",
//                 "show": "true"
//             },
//             "listeners": {
//                 "preProcess": {
//                     "type": "sync",
//                     "order": []
//                 }
//             },
//             "slots": {}
//         },
//         "text--639": {
//             "id": "text--639",
//             "widget": "text",
//             "parent": {
//                 "id": "page-1",
//                 "slot": "content"
//             },
//             "data": {
//                 "style": {
//                     "padding": "4px",
//                     "whiteSpace": "pre-line",
//                     "textOverflow": "ellipsis"
//                 },
//                 "text": "Event 2",
//                 "variant": "h3",
//                 "show": "true"
//             },
//             "listeners": {
//                 "preProcess": {
//                     "type": "sync",
//                     "order": []
//                 }
//             },
//             "slots": {}
//         },
//         "text--8726": {
//             "id": "text--8726",
//             "widget": "text",
//             "parent": {
//                 "id": "page-1",
//                 "slot": "content"
//             },
//             "data": {
//                 "style": {
//                     "padding": "4px",
//                     "whiteSpace": "pre-line",
//                     "textOverflow": "ellipsis"
//                 },
//                 "text": "Event 3 ",
//                 "variant": "h3",
//                 "show": "true"
//             },
//             "listeners": {
//                 "preProcess": {
//                     "type": "sync",
//                     "order": []
//                 }
//             },
//             "slots": {}
//         },
//         "text--458": {
//             "id": "text--458",
//             "widget": "text",
//             "parent": {
//                 "id": "page-1",
//                 "slot": "content"
//             },
//             "data": {
//                 "style": {
//                     "padding": "4px",
//                     "whiteSpace": "pre-line",
//                     "textOverflow": "ellipsis"
//                 },
//                 "text": "{{long-python}}",
//                 "variant": "p",
//                 "show": "true"
//             },
//             "listeners": {
//                 "preProcess": {
//                     "type": "sync",
//                     "order": []
//                 }
//             },
//             "slots": {}
//         },
//         "text--8791": {
//             "id": "text--8791",
//             "widget": "text",
//             "parent": {
//                 "id": "page-1",
//                 "slot": "content"
//             },
//             "data": {
//                 "style": {
//                     "padding": "4px",
//                     "whiteSpace": "pre-line",
//                     "textOverflow": "ellipsis"
//                 },
//                 "text": "{{76288}} ",
//                 "variant": "p",
//                 "show": "true"
//             },
//             "listeners": {
//                 "preProcess": {
//                     "type": "sync",
//                     "order": []
//                 }
//             },
//             "slots": {}
//         },
//         "text--651": {
//             "id": "text--651",
//             "widget": "text",
//             "parent": {
//                 "id": "page-1",
//                 "slot": "content"
//             },
//             "data": {
//                 "style": {
//                     "padding": "4px",
//                     "whiteSpace": "pre-line",
//                     "textOverflow": "ellipsis"
//                 },
//                 "text": "{{quick-addition}}",
//                 "variant": "p",
//                 "show": "true"
//             },
//             "listeners": {
//                 "preProcess": {
//                     "type": "sync",
//                     "order": []
//                 }
//             },
//             "slots": {}
//         }
//     },
//     "variables": {
//         "76288": {
//             "type": "cell",
//             "to": "llm-call",
//             "cellId": "76288"
//         },
//         "add-cell": {
//             "type": "cell",
//             "to": "quick-addition",
//             "cellId": "38750"
//         },
//         "long-python": {
//             "type": "query",
//             "to": "long-python"
//         },
//         "quick-addition": {
//             "type": "query",
//             "to": "quick-addition"
//         },
//         "unstructured-llm": {
//             "type": "cell",
//             "to": "llm-call",
//             "cellId": "76289"
//         }
//     },
//     "executionOrder": [
//         "long-python",
//         "quick-addition",
//         "llm-call"
//     ],
//     "version": "1.0.0-alpha.9"
// }
