import { styled, Grid, Typography } from '@semoss/ui';
import { BlocksMenuCard } from './BlocksMenuCard';
import { BlocksMenuItem } from './BlocksMenuBlocks';

const StyledGrid = styled(Grid)(({ theme }) => ({
    paddingBottom: theme.spacing(3),
    marginTop: theme.spacing(1),
    '&:not(:last-child)': {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    textTransform: 'capitalize',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginBottom: theme.spacing(1),
}));

export function BlocksMenuBlockTypeSection(props: {
    title?: string;
    menuItems: BlocksMenuItem[];
}) {
    return (
        <StyledGrid container>
            <Grid item xs={12}>
                <StyledTypography variant="h6">
                    {props?.title ?? ' '}
                </StyledTypography>
            </Grid>
            <Grid container spacing={2}>
                {Array.from(props.menuItems, (menuItem: BlocksMenuItem) => {
                    return (
                        <Grid item key={menuItem.blockJson.widget} xs={'auto'}>
                            <BlocksMenuCard menuItem={menuItem} />
                        </Grid>
                    );
                })}
                {!props.menuItems.length ? (
                    <Grid item>
                        <Typography variant="body1">
                            <em>No blocks found</em>
                        </Typography>
                    </Grid>
                ) : (
                    <></>
                )}
            </Grid>
        </StyledGrid>
    );
}
