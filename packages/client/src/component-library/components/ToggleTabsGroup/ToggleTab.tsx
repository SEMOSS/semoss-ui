import React from 'react';
import { Tab, TabProps } from '../Tabs/index';

export const ToggleTab = (props: TabProps) => {
    const { sx } = props;
    return <Tab sx={sx} {...props} />;
};
