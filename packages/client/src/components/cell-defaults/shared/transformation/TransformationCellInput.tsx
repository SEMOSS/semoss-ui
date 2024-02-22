import { Avatar, Chip, Stack, Typography, styled } from '@semoss/ui';
import { THEME } from '@/constants';
import { blue, green } from '@mui/material/colors';
import React from 'react';

const primaryLight = THEME.name === 'SEMOSS' ? blue[50] : green[50];
export const TransformationChip = styled(Chip)(({ theme }) => ({
    backgroundColor: primaryLight,
    color: theme.palette.primary.main,
    paddingLeft: theme.spacing(0.5),
}));
export const TransformationChipAvatar = styled(Avatar)(({ theme }) => ({
    color: `${theme.palette.primary.main}!important`,
    backgroundColor: primaryLight,
    borderRadius: '4px',
    svg: {
        fontSize: '1.25rem',
    },
}));
export const StyledTypography = styled(Typography)(({ theme }) => ({
    lineHeight: '24px',
    fontWeight: theme.typography.fontWeightBold,
}));

type TransformationCellInputComponent = React.FunctionComponent<{
    /** Whether the content is expanded */
    isExpanded?: boolean;
    /** User facing name to display */
    display: string;
    /** Icon to display */
    Icon: React.FunctionComponent;
    /** Main content slot */
    children: React.ReactNode;
}>;

export const TransformationCellInput: TransformationCellInputComponent = (
    props,
) => {
    const { children, display, Icon, isExpanded } = props;

    if (!isExpanded) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <div>
                    <TransformationChip
                        size="small"
                        color="primary"
                        label={display}
                        avatar={
                            <TransformationChipAvatar variant="rounded">
                                <Icon />
                            </TransformationChipAvatar>
                        }
                    />
                </div>
            </Stack>
        );
    }

    return (
        <Stack width="100%" paddingY={0.5}>
            <StyledTypography variant="body1">{display}</StyledTypography>
            {children}
        </Stack>
    );
};
