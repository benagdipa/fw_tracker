import React, { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import { Tooltip, Button, IconButton, Menu, MenuHandler, MenuList, MenuItem } from '@material-tailwind/react';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/snippets/sql';

// Icons
import { PlayIcon, DocumentDuplicateIcon, ClockIcon } from '@heroicons/react/24/solid';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import { format } from 'sql-formatter';

const MAX_HISTORY_ITEMS = 10;

const SQLEditor = ({
  value,
  onChange,
  onExecute,
  height = '200px',
  fontSize = 14,
  isLoading = false,
  isDarkMode = true,
  readOnly = false,
  placeholder = 'Enter your SQL query here...',
  onFormat,
  autoFocus = true,
}) => {
  const editorRef = useRef(null);
  const [queryHistory, setQueryHistory] = useState(() => {
    const savedHistory = localStorage.getItem('sqlQueryHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Save query history to localStorage whenever it changes
    localStorage.setItem('sqlQueryHistory', JSON.stringify(queryHistory));
  }, [queryHistory]);

  useEffect(() => {
    // Add custom autocompletion words
    if (editorRef.current?.editor) {
      const customCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
          const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 
            'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'INSERT', 
            'UPDATE', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'WITH',
            'AS', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'IS NULL', 'IS NOT NULL', 'IN',
            'BETWEEN', 'LIKE', 'DESC', 'ASC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
          ];
          
          const completions = keywords.map(word => ({
            caption: word,
            value: word,
            meta: 'keyword'
          }));
          
          callback(null, completions);
        }
      };
      
      try {
        const langTools = ace.require('ace/ext/language_tools');
        if (langTools && langTools.completers && Array.isArray(langTools.completers)) {
          if (!langTools.completers.includes(customCompleter)) {
            langTools.addCompleter(customCompleter);
          }
        }
      } catch (error) {
        console.error('Error setting up SQL autocompletion:', error);
      }
    }
  }, [editorRef.current]);

  const handleFormatQuery = () => {
    if (!value || readOnly || isLoading) return;

    try {
      const formattedQuery = format(value, {
        language: 'sql',
        uppercase: true,
        linesBetweenQueries: 2,
        indentStyle: 'standard'
      });
      
      onChange(formattedQuery);
    } catch (error) {
      console.error('Error formatting SQL:', error);
      // You might want to show a toast notification here
    }
  };

  const handleCopyToClipboard = async () => {
    if (!value || isLoading) return;

    try {
      await navigator.clipboard.writeText(value);
      // You might want to show a success toast notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // You might want to show an error toast notification here
    }
  };

  const handleQueryExecution = () => {
    if (!value.trim() || isLoading) return;

    // Add query to history if it's not already the most recent one
    setQueryHistory(prev => {
      const newHistory = prev.filter(q => q !== value); // Remove if exists
      return [value, ...newHistory].slice(0, MAX_HISTORY_ITEMS); // Add to front and limit size
    });

    if (onExecute) {
      onExecute();
    }
  };

  const handleHistoryItemClick = (query) => {
    onChange(query);
    setShowHistory(false);
  };

  return (
    <div className="sql-editor-container relative">
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <Menu>
          <MenuHandler>
            <IconButton
              size="sm"
              color={isDarkMode ? "white" : "gray"}
              variant="text"
              disabled={queryHistory.length === 0}
            >
              <ClockIcon className="h-4 w-4" />
            </IconButton>
          </MenuHandler>
          <MenuList>
            {queryHistory.map((query, index) => (
              <MenuItem
                key={index}
                onClick={() => handleHistoryItemClick(query)}
                className="truncate max-w-md"
              >
                {query}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        <Tooltip content="Format SQL" placement="top">
          <IconButton 
            size="sm" 
            color={isDarkMode ? "white" : "gray"} 
            variant="text" 
            onClick={handleFormatQuery}
            disabled={!value || readOnly || isLoading}
          >
            <FormatAlignJustifyIcon className="h-4 w-4" />
          </IconButton>
        </Tooltip>

        <Tooltip content="Copy to clipboard" placement="top">
          <IconButton 
            size="sm" 
            color={isDarkMode ? "white" : "gray"} 
            variant="text" 
            onClick={handleCopyToClipboard}
            disabled={!value || isLoading}
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </IconButton>
        </Tooltip>

        {onExecute && (
          <Tooltip content="Run query" placement="top">
            <Button
              size="sm"
              color="blue"
              className="flex items-center gap-1 px-2 py-1.5 h-8"
              onClick={handleQueryExecution}
              disabled={!value || isLoading}
              loading={isLoading}
            >
              <PlayIcon className="h-3.5 w-3.5" />
              <span className="text-xs">Run</span>
            </Button>
          </Tooltip>
        )}
      </div>
      
      <AceEditor
        ref={editorRef}
        mode="sql"
        theme={isDarkMode ? "twilight" : "github"}
        value={value}
        onChange={onChange}
        name="sql-editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          showPrintMargin: false,
        }}
        width="100%"
        height={height}
        fontSize={fontSize}
        placeholder={placeholder}
        readOnly={readOnly || isLoading}
        style={{ borderRadius: '0.5rem' }}
        onLoad={(editor) => {
          if (autoFocus) {
            editor.focus();
          }
        }}
      />
    </div>
  );
};

export default SQLEditor; 