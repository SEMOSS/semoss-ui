import { styled, Paper } from '@/component-library';
import { tooltipClasses, Tooltip, TooltipProps } from '@mui/material';

export const StyledStepPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    margin: theme.spacing(1),
    height: '100%',
}));

export const StyledTextPaper = styled(Paper)(({ theme }) => ({
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: theme.palette.grey[300],
    minHeight: '50%',
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(1),
}));

interface StyledTooltipProps {
    disableBorder?: boolean;
}
export const StyledTooltip = styled(
    ({ className, ...props }: TooltipProps) => (
        <Tooltip
            {...props}
            classes={{ popper: className }}
            PopperProps={{
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, -10],
                        },
                    },
                ],
            }}
        />
    ),
    {
        shouldForwardProp: (prop) => prop !== 'disableBorder',
    },
)<StyledTooltipProps>(({ disableBorder, theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.background.default,
        color: 'inherit',
        border: disableBorder
            ? 'unset'
            : `0.5px solid ${theme.palette.divider}`,
        fontSize: theme.typography.pxToRem(12),
        padding: 0,
    },
}));
