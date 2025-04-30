interface IconProps {
    color?: string;

    width?: string;

    height?: string;
}

export const AddVariable = (props: IconProps) => {
    const { color = "#EBEEFE", width = "18", height = "18" } = props;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M3.595 1.5C0.801667 7.33333 0.801667 13.1667 3.595 20.1667M19.2376 1.5C20.7796 4.72 21.4723 7.94 21.3103 11.356M8.06433 7.33333H9.18166C10.299 7.33333 10.299 8.5 11.4342 11.4482C12.3113 13.7488 12.489 14.9575 13.0912 15.3518"
                stroke="#757575"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.33594 15.5002C8.96094 15.5002 10.5859 13.1668 11.6693 11.4168C12.7526 9.66683 14.3776 7.3335 16.0026 7.3335M16.0026 19.0002H22.5026M19.2526 15.5002V22.5002"
                stroke="#757575"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
