import { Table, Typography, Link, Chip, Stack } from '@semoss/ui';
import { tableCellClasses } from '@mui/material';
import { modelledDependency } from './appDetails.utility';
import { formatPermission } from '@/utils';

interface PropsDependencyTable {
    dependencies: modelledDependency[];
    permission: string;
}

const DependencyTable = (props: PropsDependencyTable) => {
    const { dependencies, permission } = props;
    return (
        <Table
            sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: 'none',
                },
            }}
        >
            <Table.Head>
                <Table.Row>
                    <Table.Cell>
                        <Typography variant="body2" fontWeight="bold">
                            {`Dependency (${dependencies.length})`}
                        </Typography>
                    </Table.Cell>
                    <Table.Cell>
                        <Typography variant="body2" fontWeight="bold">
                            Current level of access
                        </Typography>
                    </Table.Cell>
                    {permission === 'author' && (
                        <Table.Cell>
                            <Typography variant="body2" fontWeight="bold">
                                Access Type
                            </Typography>
                        </Table.Cell>
                    )}
                </Table.Row>
            </Table.Head>

            {dependencies.map((dep: modelledDependency) => (
                <Table.Row key={`name-${dep.name}--id-${dep.id}`}>
                    <Table.Cell>
                        <Link href={`./#/engine/${dep.type}/${dep.id}`}>
                            <Typography variant="body2">{dep.id}</Typography>
                        </Link>
                    </Table.Cell>
                    <Table.Cell>
                        <Typography variant="body2">
                            {formatPermission(dep.userPermission)}
                        </Typography>
                    </Table.Cell>
                    {permission === 'author' && (
                        <Table.Cell>
                            <Stack direction="row" spacing={1}>
                                {dep.isDiscoverable ? (
                                    <Chip label="Discoverable" />
                                ) : (
                                    <Chip label="Non-Discoverable" />
                                )}
                                {dep.isPublic ? (
                                    <Chip label="Public" />
                                ) : (
                                    <Chip label="Non-Public" />
                                )}
                            </Stack>
                        </Table.Cell>
                    )}
                </Table.Row>
            ))}
        </Table>
    );
};

export default DependencyTable;
