import { render, screen } from "../vitest.setup.tsx";
import { expect, test } from "vitest";
import "@testing-library/jest-dom";

import { AccordionBlock } from "../../components/block-defaults/accordion-block/AccordionBlock";

// const blocks = {
//     accordion: {
//         data: {
//             style: {
//                 display: "flex",
//                 flexDirection: "column",
//                 padding: "4px",
//                 gap: "8px",
//                 flexWrap: "wrap",
//             },
//         },
//         id: "accordion",
//         widget: "accordion",
//         slots: {
//             header: {
//                 name: "",
//                 children: [],
//             },
//             content: {
//                 name: "",
//                 children: [],
//             },
//         },
//         listeners: {
//             onChange: [],
//         },
//     },
// };

// describe("accordion block", () => {
//     test("renders correctly with mocked provider", async () => {
//         const { container } = render(<AccordionBlock id="accordion" />, {
//             blocks: blocks,
//         });

//         const exist = container.querySelector("[data-blocks='accordion']");
//         console.log({ exist });

//         expect(exist).toBeInTheDocument();
//     });
// });
