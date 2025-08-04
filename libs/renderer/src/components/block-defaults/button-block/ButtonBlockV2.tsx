import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { cn, getColorClasses, getSizeClasses } from "../../../utils/tailwind";

export interface ButtonBlockDefV2 extends BlockDef<"button"> {
    widget: "button";
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
        disabled?: boolean;
        variant: "primary" | "secondary" | "success" | "warning" | "error" | "outline" | "ghost";
        size: "sm" | "md" | "lg" | "xl";
        show: string;
        type: "button" | "submit" | "reset";
        icon?: string;
        iconPosition?: "left" | "right";
    };
    listeners: {
        onClick: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const ButtonBlockV2: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ButtonBlockDefV2>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const getVariantClasses = (variant: string) => {
        switch (variant) {
            case "primary":
                return "bg-primary-500 hover:bg-primary-600 text-white border-primary-500";
            case "secondary":
                return "bg-secondary-500 hover:bg-secondary-600 text-white border-secondary-500";
            case "success":
                return "bg-success-500 hover:bg-success-600 text-white border-success-500";
            case "warning":
                return "bg-warning-500 hover:bg-warning-600 text-white border-warning-500";
            case "error":
                return "bg-error-500 hover:bg-error-600 text-white border-error-500";
            case "outline":
                return "bg-transparent hover:bg-gray-100 text-gray-700 border-gray-300";
            case "ghost":
                return "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent";
            default:
                return "bg-primary-500 hover:bg-primary-600 text-white border-primary-500";
        }
    };

    const baseClasses = cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "border",
        getVariantClasses(data.variant),
        getSizeClasses(data.size)
    );

    const iconClasses = cn(
        "transition-opacity duration-200",
        data.loading ? "opacity-0" : "opacity-100"
    );

    return (
        <div className="p-1" {...attrs}>
            <button
                type={data.type}
                disabled={data.disabled || data.loading}
                className={baseClasses}
                style={data.style}
                onClick={() => {
                    listeners.onClick();
                }}
            >
                {/* Left Icon */}
                {data.icon && data.iconPosition !== "right" && (
                    <span className={cn(iconClasses, "mr-2")}>
                        {/* Icon component would go here */}
                        <span className="w-4 h-4">{data.icon}</span>
                    </span>
                )}

                {/* Label */}
                <span className={cn("transition-opacity duration-200", data.loading ? "opacity-0" : "opacity-100")}>
                    {data.label}
                </span>

                {/* Right Icon */}
                {data.icon && data.iconPosition === "right" && (
                    <span className={cn(iconClasses, "ml-2")}>
                        {/* Icon component would go here */}
                        <span className="w-4 h-4">{data.icon}</span>
                    </span>
                )}

                {/* Loading Spinner */}
                {data.loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    </div>
                )}
            </button>
        </div>
    );
}); 