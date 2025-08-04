import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { cn, cardStyles } from "../../../utils/tailwind";

export interface CardBlockDefV2 extends BlockDef<"card"> {
    widget: "card";
    data: {
        style: CSSProperties;
        title?: string;
        subtitle?: string;
        content: string;
        variant: "default" | "elevated" | "outlined" | "filled";
        size: "sm" | "md" | "lg";
        showHeader?: boolean;
        showFooter?: boolean;
        footerContent?: string;
        show: string;
    };
    listeners: {};
}

export const CardBlockV2: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<CardBlockDefV2>(id);

    const getVariantClasses = (variant: string) => {
        switch (variant) {
            case "elevated":
                return "shadow-lg";
            case "outlined":
                return "border-2 border-gray-200";
            case "filled":
                return "bg-gray-50";
            default:
                return "shadow-sm";
        }
    };

    const getSizeClasses = (size: string) => {
        switch (size) {
            case "sm":
                return "p-4";
            case "lg":
                return "p-8";
            default:
                return "p-6";
        }
    };

    const cardClasses = cn(
        cardStyles.base,
        getVariantClasses(data.variant),
        "transition-all duration-200 hover:shadow-md"
    );

    const headerClasses = cn(
        cardStyles.header,
        getSizeClasses(data.size)
    );

    const contentClasses = cn(
        cardStyles.content,
        getSizeClasses(data.size)
    );

    const footerClasses = cn(
        cardStyles.footer,
        getSizeClasses(data.size)
    );

    return (
        <div className="p-1" {...attrs}>
            <div className={cardClasses} style={data.style}>
                {/* Header */}
                {data.showHeader && (data.title || data.subtitle) && (
                    <div className={headerClasses}>
                        {data.title && (
                            <h3 className="text-lg font-semibold text-gray-900">
                                {data.title}
                            </h3>
                        )}
                        {data.subtitle && (
                            <p className="text-sm text-gray-600 mt-1">
                                {data.subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={contentClasses}>
                    <div className="text-gray-700">
                        {data.content}
                    </div>
                </div>

                {/* Footer */}
                {data.showFooter && data.footerContent && (
                    <div className={footerClasses}>
                        <div className="text-sm text-gray-600">
                            {data.footerContent}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}); 