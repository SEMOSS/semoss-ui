import { useRef } from 'react';

interface EditorHookParams {
  onRun: () => void;
  initialValue?: string;
  tables?: any[];
}

export function useQueryEditor({
  onRun,
  initialValue = '',
  tables = []
}: EditorHookParams) {
  const editorRef = useRef<any>(null);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    try {

      // const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
      //   provideCompletionItems: (model: any, position: any) => {
      //     const suggestions: any[] = [];
          
      //     tables.forEach((table: any) => {
      //       suggestions.push({
      //         label: table.table,
      //         kind: monaco.languages.CompletionItemKind.Class,
      //         insertText: table.table,
      //         detail: 'Table',
      //       });

      //       table.columns.forEach((column: any) => {
      //         suggestions.push({
      //           label: column.column,
      //           kind: monaco.languages.CompletionItemKind.Field,
      //           insertText: column.column,
      //           detail: 'Column',
      //         });
      //       });
      //     });

      //     return { suggestions };
      //   }
      // });

      editor.addAction({
        id: 'run-query',
        label: 'Run Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          onRun();
        }
      });

      if (initialValue) {
        editor.setValue(initialValue);
      }
    } catch (error) {
      console.error('Error setting up editor:', error);
    }
  };

  const setValue = (value: string) => {
    if (editorRef.current) {
      editorRef.current.setValue(value);
    }
  };

  return {
    editorRef,
    handleEditorMount,
    setValue
  };
}
