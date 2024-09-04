import { BlockComponent, Variant, VariantModel } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { styled, ToggleTabsGroup, useNotification } from '@semoss/ui';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsSubMenu } from './SettingsSubMenu';
import { ConfigureSubMenu } from './ConfigureSubMenu';
import {
    TypeLlmComparisonForm,
    TypeLlmConfig,
    TypeVariant,
    TypeVariants,
} from '@/components/workspace';
import { LLMComparisonContext } from '@/contexts';
import {
    LlmComparisonFormDefaultValues,
    modelEngineOutput,
} from './LlmComparison.utility';

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    height: '36px',
    alignItems: 'center',
    width: '306px',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '32px',
    width: '50%',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(2),
}));

type Mode = 'configure' | 'settings';

export const LLMComparisonMenu: BlockComponent = ({ id }) => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();
    const [mode, setMode] = useState<Mode>('configure');
    const [allModels, setAllModels] = useState<TypeLlmConfig[]>([]);

    const { state } = useBlocks();

    const { control, setValue, handleSubmit, getValues, watch } =
        useForm<TypeLlmComparisonForm>({
            defaultValues: LlmComparisonFormDefaultValues,
        });

    useEffect(() => {
        notification.add({
            color: 'info',
            message:
                'The LLM Comparison tool is currently in beta, please contact the administrator with any issues with this part of the tool',
        });
    }, []);

    useEffect(() => {
        initialFetch();
    }, [id]);

    // fetch any relevant data and apply the app's variants to the form's state.
    const initialFetch = async () => {
        const allModels = await fetchAllModels();

        // Accepts a variant from the App's JSON and models it for the Comparison menu's form state.
        const modelVariantLlm = (variant: Variant): TypeLlmConfig => {
            const modelMatch = allModels.find(
                (mod) => mod.value === variant.model.id,
            );

            // TODO: need to handle error handling for if there is no longer a 'match' for a model stored in a user's variant.
            return {
                ...modelMatch,
                topP: variant.model.topP,
                temperature: variant.model.temperature,
                length: variant.model.length,
            };
        };

        // Variants modelled for adding to the form's state
        const modelledVariants: TypeVariants = {};

        // TODO: get variants from cell
        const cellVariants = {};
        Object.keys(cellVariants).forEach((name: string, idx) => {
            const variant = cellVariants[name];
            const model = modelVariantLlm(variant);

            const modelled: TypeVariant = {
                model,
                sortWeight: variant?.sortWeight ? variant?.sortWeight : idx,
            };

            modelledVariants[name] = modelled;
        });

        setValue('variants', modelledVariants);
    };

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = modelEngineOutput(res.pixelReturn[0].output);
        setAllModels(modelled);
        return modelled;
    };

    return (
        <LLMComparisonContext.Provider
            value={{
                blockId: id,
                control,
                setValue,
                getValues,
                handleSubmit,
                watch,
                allModels,
            }}
        >
            <StyledMenu>
                <StyledToggleTabsGroup
                    value={mode}
                    onChange={(e, val) => setMode(val as Mode)}
                >
                    <StyledToggleTabsGroupItem
                        label="Configure"
                        value="configure"
                    />
                    <StyledToggleTabsGroupItem
                        label="Settings"
                        value="settings"
                    />
                </StyledToggleTabsGroup>

                {mode === 'configure' && <ConfigureSubMenu />}

                {mode === 'settings' && <SettingsSubMenu />}
            </StyledMenu>
        </LLMComparisonContext.Provider>
    );
};
