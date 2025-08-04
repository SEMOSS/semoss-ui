import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { cn } from "../../../utils/tailwind";

export interface TextBlockDefV2 extends BlockDef<"text"> {
    widget: "text";
    data: {
        style: CSSProperties;
        text: string;
        variant: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2" | "caption" | "overline";
        color?: "primary" | "secondary" | "success" | "warning" | "error" | "default";
        align?: "left" | "center" | "right" | "justify";
        weight?: "light" | "normal" | "medium" | "semibold" | "bold";
        route: string;
    };
    listeners: {};
}

export const TextBlockV2: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<TextBlockDefV2>(id);

    const getVariantClasses = (variant: string) => {
        switch (variant) {
            case "h1":
                return "text-4xl font-bold";
            case "h2":
                return "text-3xl font-bold";
            case "h3":
                return "text-2xl font-semibold";
            case "h4":
                return "text-xl font-semibold";
            case "h5":
                return "text-lg font-medium";
            case "h6":
                return "text-base font-medium";
            case "body1":
                return "text-base";
            case "body2":
                return "text-sm";
            case "caption":
                return "text-xs";
            case "overline":
                return "text-xs uppercase tracking-wide";
            default:
                return "text-base";
        }
    };

    const getColorClasses = (color?: string) => {
        switch (color) {
            case "primary":
                return "text-primary-600";
            case "secondary":
                return "text-secondary-600";
            case "success":
                return "text-success-600";
            case "warning":
                return "text-warning-600";
            case "error":
                return "text-error-600";
            default:
                return "text-gray-900";
        }
    };

    const getAlignClasses = (align?: string) => {
        switch (align) {
            case "center":
                return "text-center";
            case "right":
                return "text-right";
            case "justify":
                return "text-justify";
            default:
                return "text-left";
        }
    };

    const getWeightClasses = (weight?: string) => {
        switch (weight) {
            case "light":
                return "font-light";
            case "medium":
                return "font-medium";
            case "semibold":
                return "font-semibold";
            case "bold":
                return "font-bold";
            default:
                return "font-normal";
        }
    };

    const textClasses = cn(
        "whitespace-pre-line",
        getVariantClasses(data.variant),
        getColorClasses(data.color),
        getAlignClasses(data.align),
        getWeightClasses(data.weight)
    );

    return (
        <div className="p-1" {...attrs}>
            <div className={textClasses} style={data.style}>
                {data.text}
            </div>
        </div>
    );
}); 