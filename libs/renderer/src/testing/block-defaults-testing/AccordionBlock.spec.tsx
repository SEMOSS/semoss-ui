import { render, screen, renderHook, act } from "@testing-library/react";
import { expect, test } from "vitest";
import { useBlock } from "../../hooks";
import "@testing-library/jest-dom";

import { AccordionBlock } from "../../components/block-defaults/accordion-block/AccordionBlock";

describe("accordion block", () => {
    expect(1 + 1).toBe(2);

    // const useBlockSpy = vi.spyOn(useBlock, 'useBlock');

    // it('should render the accordion', () => {
    //     // useBlockSpy.mockReturnValue({id: 'test-id'});

    //     const { getByTestId } = render(<AccordionBlock id='test-id' />);
    //     expect(getByTestId).toBeInTheDocument();
    // });
});
