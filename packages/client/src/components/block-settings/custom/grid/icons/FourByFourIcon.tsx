import { SvgIcon } from '@mui/material';

export const FourByFourIcon = () => {
    return (
        <SvgIcon sx={{ paddingLeft: '1px', paddingTop: '1px' }}>
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M18 0H2C0.9 0 0 0.9 0 2V18C0 19.1 0.9 20 2 20H18C19.1 20 20 19.1 20 18V2C20 0.9 19.1 0 18 0ZM18.5 9.5H10.5V1.5H18.5V9.5ZM9.5 1.5V9.5H1.5V1.5H9.5ZM1.5 10.5H9.5V18.5H1.5V10.5ZM10.5 18.5V10.5H18.5V18.5H10.5Z"
                    fill="black"
                />
                <path d="M5.5 1.5L5.5 18.5" stroke="black" />
                <path d="M14.5 1.5L14.5 18.5" stroke="black" />
                <path d="M1.5 5.5H18.5" stroke="black" />
                <path d="M1.5 14.5H10H18.5" stroke="black" />
            </svg>
        </SvgIcon>
    );
};
