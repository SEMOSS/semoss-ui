import { ReactNode } from 'react';
import { CardActionArea as MuiCardActionArea, SxProps } from '@mui/material';

export interface CardActionAreaProps {
    /** custom style object */
    sx?: SxProps;

    /** children to be rendered */
    children: ReactNode;
}

export const CardActionArea = (props: CardActionAreaProps) => {
    const { sx, children, ...otherProps } = props;
    return (
        <MuiCardActionArea sx={sx} {...otherProps}>
            {children}
        </MuiCardActionArea>
    );
};
