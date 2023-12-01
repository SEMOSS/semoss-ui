import { SvgIcon } from '@mui/material';

export const ThreeByThreeIcon = () => {
    return (
        <SvgIcon sx={{ paddingLeft: '1px', paddingTop: '1px' }}>
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M19 7L1 7M19 13H1" stroke="black" />
                <path
                    d="M18 0H2C0.9 0 0 1.125 0 2.5V17.5C0 18.875 0.9 20 2 20H18C19.1 20 20 18.875 20 17.5V2.5C20 1.125 19.1 0 18 0ZM6 18.5H1.5V1.5H6V18.5ZM12.25 18.5H7.75V1.5H12.25V18.5ZM18.5 18.5H14V1.5H18.5V18.5Z"
                    fill="black"
                />
            </svg>
        </SvgIcon>
    );
};
