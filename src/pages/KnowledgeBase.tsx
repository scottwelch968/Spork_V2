import { useState } from 'react';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Upload, Trash2, FileText, Search, Loader2, BookOpen } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import ReactMarkdown from 'react-markdown';

export default function KnowledgeBase() {
  const {
    documents,
    isLoading,
    isQuerying,
    uploadDocument,
    deleteDocument,
    queryKnowledgeBase,
  } = useKnowledgeBase();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentTitle(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadDocument(selectedFile, documentTitle);
    setSelectedFile(null);
    setDocumentTitle('');
  };

  const handleDelete = async (docId: string, storagePath: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId, storagePath);
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) return;

    const result = await queryKnowledgeBase(
      question,
      selectedDocIds.length > 0 ? selectedDocIds : undefined
    );

    if (result) {
      setAnswer(result.answer);
      setSources(result.sources);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold font-roboto-slab mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select File (PDF, DOCX, TXT)
              </label>
              <Input
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
            </div>
            {selectedFile && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Document Title
                </label>
                <Input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter document title"
                  disabled={isLoading}
                />
              </div>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>

          {/* Documents List */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Your Documents ({documents.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedDocIds.includes(doc.id)}
                      onCheckedChange={() => toggleDocSelection(doc.id)}
                    />
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id, doc.storage_path)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No documents uploaded yet
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Query Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold font-roboto-slab mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Ask Questions
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Question
              </label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about your documents..."
                rows={3}
                disabled={isQuerying || documents.length === 0}
              />
              {selectedDocIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Searching in {selectedDocIds.length} selected document(s)
                </p>
              )}
            </div>
            <Button
              onClick={handleQuery}
              disabled={!question.trim() || isQuerying || documents.length === 0}
              className="w-full"
            >
              {isQuerying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Ask AI
                </>
              )}
            </Button>
          </div>

          {/* Answer Section */}
          {answer && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Answer</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary/30 p-4 rounded-lg">
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>
              </div>
              
              {sources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sources</h3>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-sm"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{source.title}</span>
                        <span className="text-muted-foreground">({source.fileName})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {documents.length === 0 && (
            <div className="mt-6 text-center text-muted-foreground py-8">
              Upload documents first to start asking questions
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
