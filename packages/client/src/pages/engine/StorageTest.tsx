import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Checkbox,
  Search,
  Table,
  Typography,
  styled,
  useNotification,
} from '@semoss/ui';
import { usePixel } from '@/hooks';

export interface FileTableProps {
  id: string;
  storagePath?: string;
}


export interface FileExplorerProps {
  fileName: string;
  fileSize: number;
  lastModified: {
    seconds: number;
    nanos: number;
  };
}

const StyledTableContainer = styled(Table.Container)({
  borderRadius: '12px',
  boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTableTitleContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'stretch',
  boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
  backgroundColor: 'white',
  justifyContent: 'space-between',
});

const StyledFileContent = styled('div')({
  display: 'flex',
  width: '100%',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '25px',
  flexShrink: '0',
  paddingLeft: '5px',
});

const StyledTableTitleDiv = styled('div')({
  display: 'flex',
  padding: '12px 24px 12px 16px',
  alignItems: 'center',
  gap: '10px',
});

const StyledFileTable = styled(Table)({ backgroundColor: 'white' });

interface StorageTestProps {
  id: string;
  storagePath?: string;
}

interface EnrichedFile extends FileExplorerProps {
  formattedDate: string;
}

const StorageTest = ({ id, storagePath = '/' }: StorageTestProps) => {
  const [selectedFiles, setSelectedFiles] = useState<EnrichedFile[]>([]);
  const [filePage, setFilePage] = useState<number>(1);
  const [fileCount, setFileCount] = useState<number>(0);
  const [filteredFileCount, setFilteredFileCount] = useState<number>(0);
  const fileSearchRef = useRef<any>(null);
  const didMount = useRef<boolean>(false);
  const notification = useNotification();

  const NUM_RESULTS_PER_PAGE = 5;

  const { control, watch, setValue } = useForm<{
    FILES: EnrichedFile[];
    SEARCH_FILTER: string;
  }>({
    defaultValues: {
      FILES: [],
      SEARCH_FILTER: '',
    },
  });

  const searchFilter = watch('SEARCH_FILTER');
  const verifiedFiles = watch('FILES');

  const query = `Storage(storage = '${id}') | ListStoragePathDetails(storagePath='${storagePath}')`;
  const getFileDetails = usePixel<FileExplorerProps[]>(query);

  useEffect(() => {
    if (getFileDetails.status !== 'SUCCESS' || !getFileDetails.data) return;

    const enrichedFiles: EnrichedFile[] = getFileDetails.data.map((file: any) => {
      const date = new Date(
        file.lastModified.seconds * 1000 + Math.round(file.lastModified.nanos / 1e6)
      );
      return {
        fileName: file.key ?? 'Unknown',
        fileSize: file.size ?? 0,
        lastModified: file.lastModified,
        formattedDate: date.toLocaleString(),
      };
    });

    const filtered = enrichedFiles.filter((file) =>
      file.fileName.toLowerCase().includes(searchFilter.toLowerCase())
    );

    filtered.sort(
      (a, b) => new Date(a.formattedDate).getTime() - new Date(b.formattedDate).getTime()
    );

    setValue('FILES', filtered);
    if (!didMount.current) {
      setFileCount(enrichedFiles.length);
      didMount.current = true;
    }
    setFilteredFileCount(filtered.length);
    fileSearchRef.current?.focus();

    return () => {
      setValue('FILES', []);
      setSelectedFiles([]);
    };
  }, [getFileDetails.status, getFileDetails.data, searchFilter]);

  return (
    <StyledFileContent>
      <StyledTableContainer>
        <StyledTableTitleContainer>
          <StyledTableTitleDiv>
            <Typography variant={'h6'}>Files</Typography>
          </StyledTableTitleDiv>
          <div>
            <Search
              ref={fileSearchRef}
              placeholder={'Search Files'}
              size="small"
              sx={{ marginRight: '20px' }}
              value={searchFilter}
              onChange={(e) => setValue('SEARCH_FILTER', e.target.value)}
            />
          </div>
        </StyledTableTitleContainer>

        <StyledFileTable>
          <Table.Head>
            <Table.Cell size="small">Select</Table.Cell>
            <Table.Cell size="small">Name</Table.Cell>
            <Table.Cell size="small">Date Uploaded</Table.Cell>
            <Table.Cell size="small">Size</Table.Cell>
          </Table.Head>
          <Table.Body>
            {verifiedFiles.map((file, i) => {
              const start = filePage * NUM_RESULTS_PER_PAGE - NUM_RESULTS_PER_PAGE;
              const end = filePage * NUM_RESULTS_PER_PAGE;
              if (i >= start && i < end) {
                const isSelected = selectedFiles.some(
                  (f) => f.fileName === file.fileName
                );
                return (
                  <Table.Row key={i}>
                    <Table.Cell size="medium">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {
                          setSelectedFiles((prev) =>
                            isSelected
                              ? prev.filter((f) => f.fileName !== file.fileName)
                              : [...prev, file]
                          );
                        }}
                      />
                    </Table.Cell>
                    <Table.Cell>{file.fileName}</Table.Cell>
                    <Table.Cell>{file.formattedDate}</Table.Cell>
                    <Table.Cell>
                      {Math.round(file.fileSize * 10) / 10} KB
                    </Table.Cell>
                  </Table.Row>
                );
              }
            })}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Pagination
                rowsPerPageOptions={[]}
                onPageChange={(e, v) => {
                  setFilePage(v + 1);
                  setSelectedFiles([]);
                }}
                page={filePage - 1}
                rowsPerPage={NUM_RESULTS_PER_PAGE}
                count={filteredFileCount}
              />
            </Table.Row>
          </Table.Footer>
        </StyledFileTable>
      </StyledTableContainer>
    </StyledFileContent>
  );
};

export default StorageTest;
