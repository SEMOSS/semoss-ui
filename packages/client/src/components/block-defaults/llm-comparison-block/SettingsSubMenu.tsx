import {
    Stack,
    Typography,
    styled,
    Switch,
    RadioGroup,
    TextField,
    Slider,
} from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { Controller } from 'react-hook-form';
import { VariantDragAndDrop } from './VariantDragAndDrop';

const StyledSettingsSubMenu = styled('div')(({ theme }) => ({
    width: '100%',
}));

const StyledHeader = styled('div')(({ theme }) => ({
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing(2),
    textTransform: 'capitalize',
}));

const StyledSection = styled(Stack)(({ theme }) => ({
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    width: '100%',
}));

const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
    margin: 0,
}));

export const SettingsSubMenu = () => {
    const { control, watch } = useLLMComparison();
    const orderType = watch('orderType');
    const variants = watch('variants');

    const handleSetOrder = () => {
        // TODO
    };

    const hanldeSampleSizeChange = () => {
        // TODO
    };

    const handleTrafficChange = () => {
        // TODO
    };

    return (
        <StyledSettingsSubMenu>
            <StyledSection
                direction="row"
                gap={1}
                sx={{ justifyContent: 'space-between' }}
            >
                <Typography variant="body2" color="secondary">
                    Display Model Name
                </Typography>

                <Controller
                    name="showModelsInResponse"
                    control={control}
                    render={({ field }) => (
                        <Switch
                            checked={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
            </StyledSection>

            <StyledSection direction="column" gap={1}>
                <Typography variant="body2" color="secondary">
                    Display Order
                </Typography>

                <Controller
                    name="orderType"
                    control={control}
                    render={({ field }) => (
                        <StyledRadioGroup
                            onChange={field.onChange}
                            name="orderType"
                        >
                            <RadioGroup.Item value="fixed" label="Fixed" />
                            <RadioGroup.Item value="random" label="Random" />
                            <RadioGroup.Item value="custom" label="Custom" />
                        </StyledRadioGroup>
                    )}
                />

                {orderType === 'custom' && <VariantDragAndDrop />}
            </StyledSection>

            <StyledHeader>
                <Typography variant="h6" fontWeight="bold">
                    Traffic Allocation
                </Typography>
            </StyledHeader>

            <StyledSection direction="column" gap={1}>
                <Typography variant="caption" color="secondary">
                    Sample Size
                </Typography>

                <TextField type="number" onChange={hanldeSampleSizeChange} />
            </StyledSection>

            <StyledSection direction="column" gap={1}>
                <Typography variant="caption" color="secondary">
                    Percentage of Traffic
                </Typography>

                <Stack gap={2} direction="row" alignItems="center">
                    <Slider
                        onChange={handleTrafficChange}
                        min={0}
                        max={100}
                        marks={[
                            { value: 0, label: '0' },
                            { value: 100, label: '100%' },
                        ]}
                        valueLabelDisplay="auto"
                    />

                    <TextField type="number" onChange={handleTrafficChange} />
                </Stack>
            </StyledSection>
        </StyledSettingsSubMenu>
    );
};
