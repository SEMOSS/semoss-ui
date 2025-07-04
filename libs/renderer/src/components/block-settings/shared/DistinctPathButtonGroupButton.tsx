import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { IconButton } from "@semoss/ui";
import { Paths, PathValue } from "../../../types";
import { useBlock, useBlockSettings } from "../../../hooks";
import { Block, BlockDef } from "../../../store";
import { getValueByPath } from "../../../utility";

/**
 * Used in the DistinctPathButtonGroupSettings
 */

interface DistinctPathButtonGroupButtonProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;

    /**
     * Style value
     */
    styleValue: string;

    /**
     * Icon for button display
     */
    ButtonIcon: any;

    /**
     * Hover title on button
     */
    title: string;

    /**
     * Whether should display selected by default
     */
    isDefault: boolean;
}

export const DistinctPathButtonGroupButton = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        styleValue,
        ButtonIcon,
        title,
        isDefault,
    }: DistinctPathButtonGroupButtonProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { data: blockData } = useBlock(id);

        // track the value
        const [value, setValue] = useState("");

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }

                const v = getValueByPath(data, path);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onClick = () => {
            const newValue = value !== styleValue ? styleValue : "";
            setValue(newValue);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(
                        path,
                        newValue as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const isDisabled = useMemo(() => {
            return !!(
                (blockData?.hasOwnProperty("href") && title === "Underlined") ||
                (blockData?.hasOwnProperty("variant") &&
                    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(
                        blockData.variant as string,
                    ) &&
                    title === "Bold")
            );
        }, [blockData, id, title]);

        return (
            <IconButton
                color={
                    value == styleValue || (isDefault ? !value : false)
                        ? "primary"
                        : undefined
                }
                size="small"
                onClick={onClick}
                title={title}
                disabled={isDisabled}
            >
                <ButtonIcon />
            </IconButton>
        );
    },
);
