import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Paper,
    IconButton,
    Tooltip,
    Typography,
    Popover,
    TextField,
    Slider,
    PopoverOrigin,
} from '@mui/material';
import { PsychologyOutlined } from '@mui/icons-material';

import { ChatRoom } from '@/stores';

const StyledPopover = styled(Popover)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: '4px',
    },
}));

const StyledPopoverContent = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    width: '252px',
}));

interface OptionsPickerComponentProps {
    /**
     * Track if disabled
     */
    isDisabled?: boolean;

    /**
     * Options to Pick from
     */
    options: ChatRoom['options'];

    /**
     * Callback triggered when a model is asked
     */
    setOptions: (options: ChatRoom['options']) => void;

    /**
     * Set popover anchorOrigin prop
     */
    anchorOrigin?: PopoverOrigin;

    /**
     * Set popover transformOrigin prop
     */
    transformOrigin?: PopoverOrigin;
}

const marks = [
    { value: 0, label: '0' },
    { value: 0.2 },
    { value: 0.4 },
    { value: 0.6 },
    { value: 0.8 },
    { value: 1, label: '1' },
];

export const OptionsPickerComponent: React.FC<OptionsPickerComponentProps> =
    observer((props) => {
        const {
            isDisabled = false,
            options,
            setOptions,
            anchorOrigin = {
                vertical: 'bottom',
                horizontal: 'left',
            },
            transformOrigin = {
                vertical: 'top',
                horizontal: 'left',
            },
        } = props;

        const [optionsAnchorEle, setOptionsAnchorEle] =
            useState<HTMLButtonElement | null>(null);

        return (
            <>
                <Tooltip title="Open Options" placement="top">
                    <IconButton
                        size={'small'}
                        disabled={isDisabled}
                        color={optionsAnchorEle ? 'primary' : 'default'}
                        aria-label="Open Options"
                        onClick={(e) => {
                            setOptionsAnchorEle(e.currentTarget);
                        }}
                    >
                        <PsychologyOutlined color="inherit" fontSize="medium" />
                    </IconButton>
                </Tooltip>

                <StyledPopover
                    id={'chat-footer--options'}
                    open={!!optionsAnchorEle}
                    anchorEl={optionsAnchorEle}
                    onClose={() => {
                        // set the options
                        setOptions(options);

                        // close it
                        setOptionsAnchorEle(null);
                    }}
                    anchorOrigin={anchorOrigin}
                    transformOrigin={transformOrigin}
                >
                    <StyledPopoverContent>
                        <Typography variant="subtitle2" my={1}>
                            Token Length:
                        </Typography>
                        <TextField
                            aria-label="Token Length"
                            type="number"
                            value={options.tokenLength}
                            onChange={(e) =>
                                setOptions({
                                    ...options,
                                    tokenLength: Number(e.target.value) || 0,
                                })
                            }
                            inputProps={{
                                min: 0,
                            }}
                            size="small"
                            variant="outlined"
                            fullWidth={true}
                        />
                        <Typography variant="subtitle2" my={1}>
                            Temperature:
                        </Typography>
                        <Slider
                            aria-label="Temperature"
                            value={options.temperature}
                            onChange={(e, val) =>
                                setOptions({
                                    ...options,
                                    temperature: val as number,
                                })
                            }
                            size="small"
                            valueLabelDisplay="auto"
                            min={0}
                            max={1}
                            step={0.01}
                            marks={marks}
                        />
                        {/* <FormControlLabel
                            control={
                                <Checkbox
                                    checked={options.showUi}
                                    onChange={(e, val) =>
                                        setOptions({
                                            ...options,
                                            showUi: !options.showUi,
                                        })
                                    }
                                />
                            }
                            label="Show UI"
                        /> */}
                    </StyledPopoverContent>
                </StyledPopover>
            </>
        );
    });
