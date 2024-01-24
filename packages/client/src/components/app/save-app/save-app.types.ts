import { Control } from 'react-hook-form';

export type AppFormStep = {
    name: string;
    icon: React.ReactElement;
    title: string;
    component: React.FunctionComponent<{
        control: Control<any, any>;
        disabled: boolean;
    }>;
    requiredFields: string[];
};
