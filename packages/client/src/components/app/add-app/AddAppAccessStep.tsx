import { styled, Box, Switch, Stack, Typography } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { ADD_APP_FORM_FIELD_IS_GLOBAL } from './add-app.constants';

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    '&:not(:last-child)': {
        marginBottom: theme.spacing(2),
    },
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
    width: '42px!important',
    height: '26px!important',
    padding: '0px!important',
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color:
                theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 22,
        height: 22,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));

export const AddAppAccessStep = (props: {
    control: Control<any, any>;
    disabled: boolean;
}) => {
    return (
        <Controller
            name={ADD_APP_FORM_FIELD_IS_GLOBAL}
            control={props.control}
            rules={{}}
            render={({ field }) => {
                return (
                    <StyledBox>
                        <StyledSwitch
                            disabled={props.disabled}
                            disableRipple
                            checked={field.value}
                            onChange={(newValue) => {
                                field.onChange(newValue);
                            }}
                        />
                        <Stack direction="column" ml="12px">
                            <Typography variant="body1">Make Public</Typography>
                            <Typography variant="body2">
                                Show app to all users and automatically give
                                them read-only access. Users can request
                                elevated access.
                            </Typography>
                        </Stack>
                    </StyledBox>
                );
            }}
        />
    );
};
