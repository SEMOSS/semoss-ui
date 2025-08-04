import { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { cn, inputStyles } from "../../../utils/tailwind";

export interface InputBlockDefV2 extends BlockDef<"input"> {
    widget: "input";
    data: {
        style: CSSProperties;
        label?: string;
        placeholder?: string;
        value?: string;
        type: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
        required?: boolean;
        disabled?: boolean;
        size: "sm" | "md" | "lg";
        variant: "outline" | "filled" | "ghost";
        show: string;
    };
    listeners: {
        onChange: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
        onFocus: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
        onBlur: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const InputBlockV2: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<InputBlockDefV2>(id);
    const [value, setValue] = useState(data.value || "");

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const getVariantClasses = (variant: string) => {
        switch (variant) {
            case "filled":
                return "bg-gray-50 border-gray-300 focus:bg-white focus:border-primary-500";
            case "ghost":
                return "bg-transparent border-transparent focus:border-primary-500";
            default:
                return "bg-white border-gray-300 focus:border-primary-500";
        }
    };

    const getSizeClasses = (size: string) => {
        switch (size) {
            case "sm":
                return "h-8 px-3 text-sm";
            case "lg":
                return "h-12 px-4 text-base";
            default:
                return "h-10 px-3 text-sm";
        }
    };

    const inputClasses = cn(
        inputStyles.base,
        getVariantClasses(data.variant),
        getSizeClasses(data.size),
        "rounded-md transition-colors duration-200"
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        if (listeners.onChange) {
            listeners.onChange();
        }
    };

    const handleFocus = () => {
        if (listeners.onFocus) {
            listeners.onFocus();
        }
    };

    const handleBlur = () => {
        if (listeners.onBlur) {
            listeners.onBlur();
        }
    };

    return (
        <div className="p-1" {...attrs}>
            <div className="space-y-2">
                {data.label && (
                    <label className="block text-sm font-medium text-gray-700">
                        {data.label}
                        {data.required && <span className="text-error-500 ml-1">*</span>}
                    </label>
                )}
                <input
                    type={data.type}
                    value={value}
                    placeholder={data.placeholder}
                    required={data.required}
                    disabled={data.disabled}
                    className={inputClasses}
                    style={data.style}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            </div>
        </div>
    );
}); 