import { InputSettings, JsonSettings } from '@/components/block-settings';

/**
 * Build the Editor Section
 * @returns an editor section
 */
export const buildEditorSection = () => ({
    name: 'Dimensions',
    children: [
        {
            description: 'Edit the underlying block data',
            render: ({ id }) => <JsonSettings id={id} />,
        },
    ],
});

/**
 * Build the Layout Section
 */
export const buildLayoutSection = () => ({
    name: 'Display',
    children: [
        {
            description: 'Display',
            render: ({ id }) => (
                <InputSettings id={id} label="Display" path="style.display" />
            ),
        },
    ],
});

/**
 * Build the Spacing Section
 * @returns a spacing section
 */
export const buildSpacingSection = () => ({
    name: 'Spacing',
    children: [
        {
            description: 'Margin',
            render: ({ id }) => (
                <InputSettings id={id} label="Margin" path="style.margin" />
            ),
        },
        {
            description: 'Padding',
            render: ({ id }) => (
                <InputSettings id={id} label="Padding" path="style.padding" />
            ),
        },
    ],
});

/**
 * Build the Dimensions Section
 * @returns a dimension section
 */
export const buildDimensionsSection = () => ({
    name: 'Dimensions',
    children: [
        {
            description: 'Width',
            render: ({ id }) => (
                <InputSettings id={id} label="Width" path="style.width" />
            ),
        },
        {
            description: 'MaxWidth',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Max Width"
                    path="style.maxWidth"
                />
            ),
        },
        {
            description: 'Height',
            render: ({ id }) => (
                <InputSettings id={id} label="Height" path="style.height" />
            ),
        },
        {
            description: 'MaxHeight',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Max Height"
                    path="style.maxHeight"
                />
            ),
        },
    ],
});

/**
 * Build the Style Section
 * @returns a style section
 */
export const buildStyleSection = () => ({
    name: 'Style',
    children: [
        {
            description: 'Border',
            render: ({ id }) => (
                <InputSettings id={id} label="Border" path="style.border" />
            ),
        },
        {
            description: 'Outline',
            render: ({ id }) => (
                <InputSettings id={id} label="Outline" path="style.outline" />
            ),
        },
        {
            description: 'Background Color',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Background Color"
                    path="style.backgroundColor"
                />
            ),
        },
        {
            description: 'Box Shadow',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Box Shadow"
                    path="style.boxShadow"
                />
            ),
        },
    ],
});

/**
 * Build the Typography Section
 * @returns a typography section
 */
export const buildTypographySection = () => ({
    name: 'Typography',
    children: [
        {
            description: 'Font Family',
            render: ({ id }) => (
                <InputSettings id={id} label="Font" path="style.fontFamily" />
            ),
        },
        {
            description: 'Font Size',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Font Size"
                    path="style.fontSize"
                />
            ),
        },
        {
            description: 'Font Weight',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Font Weight"
                    path="style.fontWeight"
                />
            ),
        },
        {
            description: 'Font Style',
            render: ({ id }) => (
                <InputSettings
                    id={id}
                    label="Font Style"
                    path="style.fontStyle"
                />
            ),
        },
    ],
});
