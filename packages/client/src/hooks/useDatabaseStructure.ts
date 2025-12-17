import { useState, useEffect, useMemo } from 'react';
import { usePixel } from './usePixel';
import { useRootStore } from './useRootStore';

interface Column {
  column: string;
  type: string;
}

interface TableStructure {
  table: string;
  open: boolean;
  columns: Column[];
}

interface SchemaResponse {
  relationships: Array<{
    sourceColumn?: string;
    targetColumn?: string;
    relation: string;
    source: string;
    target: string;
  }>;
  tables: Array<{
    isPrimKey: boolean[];
    raw_type: string[];
    columns: string[];
    type: string[];
    table: string;
  }>;
  positions: Record<string, { top: number; left: number }>;
}

export function useDatabaseStructure(engineId: string) {
  const [structure, setStructure] = useState<{
    tables: TableStructure[];
  }>({
    tables: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [toggleState, setToggleState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>({});
  const [activeTable, setActiveTable] = useState<string | null>(null);
  
  const { monolithStore } = useRootStore();

  const getTableNames = async () => {
    if (!engineId) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      const pixel = `ExternalUpdateJdbcTablesAndViews(database=["${engineId}"]);`;
      const response = await monolithStore.runQuery(pixel);
      const output = response.pixelReturn[0]?.output;
            
      const tables = output?.tables || [];
      const views = output?.views || [];
      
      return [...tables, ...views];
    } catch (err) {
      console.error('Error fetching table names:', err);
      setError('Failed to fetch table names');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDatabaseStructure = async () => {
    if (!engineId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tableNames = await getTableNames();
      
      if (tableNames.length === 0) {
        console.log('No tables found for database:', engineId);
        setIsLoading(false);
        setStructure({ tables: [] });
        return;
      }
            
      const filters = JSON.stringify(tableNames);
      const pixel = `ExternalUpdateJdbcSchema(database=["${engineId}"], filters=${filters});`;
      
      const response = await monolithStore.runQuery(pixel);
      const schemaData = response.pixelReturn[0]?.output as SchemaResponse;
      
      if (!schemaData || !schemaData.tables) {
        throw new Error('Invalid schema data returned');
      }
      
      const tablesData: TableStructure[] = schemaData.tables.map(table => {
        const columns: Column[] = table.columns.map((columnName, index) => ({
          column: columnName,
          type: table.type[index] || 'UNKNOWN',
        }));
        
        return {
          table: table.table,
          open: true,
          columns,
        };
      });
            
      setStructure({
        tables: tablesData
      });
      
      const initialExpanded: Record<string, boolean> = {};
      tablesData.forEach(table => {
        initialExpanded[table.table] = true;
      });
      setExpandedTables(initialExpanded);
      
    } catch (err) {
      console.error('Error fetching database structure:', err);
      setError('Failed to fetch database structure');
      setStructure({ tables: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDatabaseStructure = () => {
    if (engineId) {
      fetchDatabaseStructure();
    }
  };

  useEffect(() => {
    if (engineId) {
      fetchDatabaseStructure();
    }
  }, [engineId]);

  const searchedStructure = useMemo(() => {
    if (!searchTerm) {
      return structure.tables;
    }

    const cleanedSearch = searchTerm.replace(/ /g, '_');
    const searched: TableStructure[] = [];

    for (let tableIdx = 0; tableIdx < structure.tables.length; tableIdx++) {
      const table = { ...structure.tables[tableIdx] };
      table.columns = table.columns.filter((column: Column) =>
        column.column.toLowerCase().includes(cleanedSearch.toLowerCase())
      );

      if (table.columns.length > 0) {
        searched.push(table);
      }
    }

    return searched;
  }, [structure.tables, searchTerm]);

  const toggleTable = (tableName: string) => {
    // Toggle a single table and update toggleState immediately based on the new expanded state
    setExpandedTables(prev => {
      const newState = {
        ...prev,
        [tableName]: !prev[tableName]
      };
      const anyExpanded = Object.values(newState).some(Boolean);
      setToggleState(anyExpanded);
      return newState;
    });
  };

  const toggleAllTables = () => {
    // Derive current expand state from latest expandedTables and flip it
    setExpandedTables(prev => {
      const areAllExpanded = searchedStructure.length > 0 && searchedStructure.every((t) => !!prev[t.table]);
      const newState = !areAllExpanded;
      const newExpanded: Record<string, boolean> = {};
      searchedStructure.forEach((table: TableStructure) => {
        newExpanded[table.table] = newState;
      });
      setToggleState(newState);
      return newExpanded;
    });
  };
  // NOTE: checkToggle was removed because we now update toggleState synchronously in the setters above.

  const toggleColumnSelection = (tableName: string, columnName: string) => {
    // if switching to a different table, reset column selection
    if (activeTable && activeTable !== tableName) {
      setSelectedColumns({ [tableName]: [columnName] });
    } else {
      setSelectedColumns(prev => {
        const currentColumns = prev[tableName] || [];
        const isSelected = currentColumns.includes(columnName);
        
        if (isSelected) {
          const newColumns = currentColumns.filter(col => col !== columnName);
          return { ...prev, [tableName]: newColumns };
        } else {
          return { ...prev, [tableName]: [...currentColumns, columnName] };
        }
      });
    }
    setActiveTable(tableName);
  };

  const clearColumnSelection = () => {
    setSelectedColumns({});
    setActiveTable(null);
  };

  const generateSelectedColumnsQuery = (): string => {
    if (!activeTable || !selectedColumns[activeTable] || selectedColumns[activeTable].length === 0) {
      return '';
    }
    
    const columns = selectedColumns[activeTable];
    
    if (columns.length === 1) {
      return `SELECT ${columns[0]} FROM ${activeTable}`;
    }
    
    const columnList = columns.join(', ');
    return `SELECT ${columnList} FROM ${activeTable}`;
  };

  return {
    structure,
    searchTerm,
    setSearchTerm,
    searchedStructure,
    expandedTables,
    toggleState,
    toggleTable,
    toggleAllTables,
    isLoading,
    error,
    refreshDatabaseStructure,
    selectedColumns,
    activeTable,
    toggleColumnSelection,
    clearColumnSelection,
    generateSelectedColumnsQuery,
  };
}