import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';

interface LaunchpadCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

export function LaunchpadCodeEditor({ 
  value, 
  onChange, 
  language, 
  readOnly = false 
}: LaunchpadCodeEditorProps) {

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return javascript({ jsx: true });
      case 'typescript':
        return javascript({ jsx: true, typescript: true });
      case 'css':
        return css();
      case 'html':
        return html();
      case 'json':
        return json();
      case 'markdown':
        return markdown();
      default:
        return javascript({ jsx: true, typescript: true });
    }
  };

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[getLanguageExtension(language)]}
      theme="light"
      readOnly={readOnly}
      height="100%"
      style={{ height: '100%' }}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightSpecialChars: true,
        foldGutter: true,
        drawSelection: true,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
        syntaxHighlighting: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        rectangularSelection: true,
        crosshairCursor: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        closeBracketsKeymap: true,
        defaultKeymap: true,
        searchKeymap: true,
        historyKeymap: true,
        foldKeymap: true,
        completionKeymap: true,
        lintKeymap: true,
      }}
    />
  );
}
