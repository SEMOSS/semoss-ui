import { useState } from 'react';
import { useRootStore } from './useRootStore';
const { Parser } = require('node-sql-parser');


export interface QueryResult {
  output: any;
  operationType?: string[] | string;
  timeToRun?: number;
  error?: boolean;
  isSuccess?: boolean;
  executionInfo?: string;
  queryType: 'SELECT' | 'OTHER';
  numCollected?: number;
}

function detectQueryType(query: string): string {
  const parser = new Parser();
  const ast = parser.astify(query);
  console.log('AST:', ast);

  if (!Array.isArray(ast) || ast.length === 0) {
    if (ast.type) {
      return ast.type.toUpperCase() as "SELECT" | "OTHER";
    }
  }
  else
    return ast[0].type.toUpperCase() as "SELECT" | "OTHER";
}

function removeComments(query: string): string {
  const parser = new Parser();
  const ast = parser.astify(query);
  return parser.sqlify(ast);
}

export const isSchemaChangingQuery = (queryType: string): boolean => {
  return ['OTHER'].includes(queryType);
};

export const isErrorResponse = (response: any): boolean => {
  return response?.operationType?.includes('ERROR') ||
         (typeof response?.output === 'string' && response.output.startsWith('ERROR:'));
};

export const getErrorMessage = (response: any): string => {
  if (typeof response?.output === 'string' && response.output.startsWith('ERROR:')) {
    return response.output.replace('ERROR: ', '');
  }
  return response?.output || 'Unknown error occurred';
};

export const hasTabularData = (response: any): boolean => {
  return response?.output?.data?.headers && response?.output?.data?.values;
};

interface QueryExecutionOptions {
  onSchemaChange?: () => void;
}

export function useQueryExecution(engineId: string, options: QueryExecutionOptions = {}) {
  const { monolithStore } = useRootStore();
  const [query, setQuery] = useState('');
  const [previewData, setPreviewData] = useState<QueryResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const PREVIEW_LIMIT = 100;

  const clearQuery = () => {
    setQuery('');
  };

  const clearResults = () => {
    setPreviewData(null);
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      window.alert('Query is empty. Please enter a query.');
      return;
    }

    setPreviewLoading(true);

    try {
      const queryType = detectQueryType(query);
      console.log('Detected query type:', queryType);

      const cleanedQuery = removeComments(query).replaceAll('`','');

      let pixel = `SqlQuery(database=["${engineId}"], query=["<encode>${removeComments(query).replaceAll('`','')}</encode>"], limit=[${PREVIEW_LIMIT}]);`;
      
      const response = await monolithStore.runQuery(pixel);
      console.log('Full response:', response);
      
      if (response && response.pixelReturn && response.pixelReturn.length > 0) {
        const firstResult = response.pixelReturn[0];
        console.log('Setting data to:', firstResult);
        setPreviewData({
          ...firstResult,
          queryType: queryType as "SELECT" | "OTHER"
        });
      } else {
        console.log('No pixelReturn found, using full response');
        setPreviewData({
          output: response, 
          queryType: queryType as "SELECT" | "OTHER",
          timeToRun: 0 
        });
      }

      if (isSchemaChangingQuery(queryType)) {
        console.log('Schema-changing query detected:', queryType);
        if (!isErrorResponse(previewData) && options.onSchemaChange) {
          console.log('Triggering schema refresh');
          setTimeout(() => options.onSchemaChange(), 100);
        }
      }
    } catch (error: any) {
      console.error('Query execution error:', error);
      setPreviewData({
        error: true,
        output: `Error: ${error.message}`,
        operationType: ['ERROR'],
        queryType: detectQueryType(query) as "SELECT" | "OTHER",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return {
    query,
    setQuery,
    previewData,
    previewLoading,
    clearQuery,
    clearResults,
    executeQuery,
    PREVIEW_LIMIT
  };
}
