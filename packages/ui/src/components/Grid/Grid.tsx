import MuiGrid from "@mui/material/Grid";
import { SxProps } from "@mui/system";

export interface GridProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * The number of columns.
     * @default 12
     */
    columns?: number;

    /**
     * Defines the horizontal space between the type `item` components.
     * It overrides the value of the `spacing` prop.
     */
    columnSpacing?: number | string;

    /**
     * If `true`, the component will have the flex *container* behavior.
     * You should be wrapping *items* with a *container*.
     * @default false
     */
    container?: boolean;

    /**
     * Defines the `flex-direction` style property.
     * It is applied for all screen sizes.
     * @default 'row'
     */
    direction?: "row" | "row-reverse" | "column" | "column-reverse";

    /**
     * If `true`, the component will have the flex *item* behavior.
     * You should be wrapping *items* with a *container*.
     * @default false
     */
    item?: boolean;

    /**
     * Defines the vertical space between the type `item` components.
     * It overrides the value of the `spacing` prop.
     */
    rowSpacing?: number | string;

    /**
     * Defines the space between the type `item` components.
     * It can only be used on a type `container` component.
     * @default 0
     */
    spacing?: number | string;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * Defines the `flex-wrap` style property.
     * It's applied for all screen sizes.
     * @default 'wrap'
     */
    wrap?: "nowrap" | "wrap" | "wrap-reverse";

    /**
     * If `true`, it sets `min-width: 0` on the item.
     * Refer to the limitations section of the documentation to better understand the use case.
     * @default false
     */
    zeroMinWidth?: boolean;
}

export const Grid = (props: GridProps) => {
    const { children, sx } = props;
    return (
        <MuiGrid sx={sx} {...props}>
            {children}
        </MuiGrid>
    );
};
