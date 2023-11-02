import React, { useState } from 'react';
import { List, Typography, styled } from '@semoss/ui';
import {
    ExpandLess,
    ExpandMore,
    FormatListBulletedOutlined,
    SpaceDashboardOutlined,
} from '@mui/icons-material';

const StyledFilter = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    width: '355px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
}));

const StyledFilterList = styled(List)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    gap: theme.spacing(2),
}));

interface AppFilterProps {
    onChange: (filters) => void;
}
export const AppFilter = (props: AppFilterProps) => {
    const [filterByVisibility, setFilterByVisibility] = useState(true);

    return (
        <StyledFilter>
            <StyledFilterList>
                <List.Item
                    secondaryAction={
                        <List.ItemButton
                            onClick={() => {
                                setFilterByVisibility(!filterByVisibility);
                            }}
                        >
                            {filterByVisibility ? (
                                <ExpandLess />
                            ) : (
                                <ExpandMore />
                            )}
                        </List.ItemButton>
                    }
                >
                    <List.ItemText
                        disableTypography
                        primary={
                            <Typography variant="h6">Filter By</Typography>
                        }
                    />
                </List.Item>
            </StyledFilterList>
        </StyledFilter>
    );
};
