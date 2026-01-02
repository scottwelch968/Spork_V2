import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  FileDown, 
  FolderTree,
  Component, 
  Anchor, 
  Wrench, 
  Package, 
  Database, 
  Route,
  Loader2,
  FileText,
  Server,
  Key,
  Code,
  FileCode,
  Table,
  Shield,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { exportToPdf } from '@/utils/exportDocumentationPdf';
import { toast } from 'sonner';
import { CollapsibleDocSection } from '@/components/admin/docs';
import { MigrationGuideSection } from '@/components/admin/docs/MigrationGuideSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { DocsManifest } from '@/types/docsManifest';
import { useBackendDocs, type TableInfo } from '@/hooks/useBackendDocs';
import { 
  generateDatabaseSchemaMarkdown, 
  generateEdgeFunctionsMarkdown, 
  generateSecretsMarkdown,
  downloadMarkdown 
} from '@/utils/generateSchemaMarkdown';

export function DocsTab() {
  const [manifest, setManifest] = useState<DocsManifest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [migrationGuideOpen, setMigrationGuideOpen] = useState(false);
  
  const { 
    schema, 
    edgeFunctions, 
    secrets, 
    isLoading: isSchemaLoading, 
    refresh: refreshSchema 
  } = useBackendDocs();

  const fetchManifest = async () => {
    try {
      const response = await fetch('/docs-manifest.json');
      if (response.ok) {
        const data = await response.json();
        setManifest(data);
      }
    } catch (e) {
      console.error('Failed to fetch docs manifest:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, []);

  const handleRefresh = async () => {
    await refreshSchema();
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportToPdf('documentation-content', 'spork-documentation');
      toast.success('Documentation has been exported to PDF.');
    } catch (error) {
      toast.error('Failed to export documentation to PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSchema = () => {
    if (schema) {
      const md = generateDatabaseSchemaMarkdown(schema);
      downloadMarkdown(md, 'DATABASE_SCHEMA.md');
      toast.success('DATABASE_SCHEMA.md has been downloaded.');
    }
  };

  const handleDownloadEdgeFunctions = () => {
    const md = generateEdgeFunctionsMarkdown(edgeFunctions);
    downloadMarkdown(md, 'EDGE_FUNCTIONS.md');
    toast.success('EDGE_FUNCTIONS.md has been downloaded.');
  };

  const handleDownloadSecrets = () => {
    const md = generateSecretsMarkdown(secrets);
    downloadMarkdown(md, 'SECRETS.md');
    toast.success('SECRETS.md has been downloaded.');
  };

  const handleDownloadAll = () => {
    if (schema) {
      handleDownloadSchema();
    }
    handleDownloadEdgeFunctions();
    handleDownloadSecrets();
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const sections = [
    { id: 'backend-docs', title: 'Backend Schema', icon: <Database className="h-5 w-5" /> },
    { id: 'edge-functions-live', title: 'Edge Functions', icon: <Server className="h-5 w-5" /> },
    { id: 'secrets-live', title: 'Secrets', icon: <Key className="h-5 w-5" /> },
    { id: 'migration-guide', title: 'Migration Guide', icon: <FileText className="h-5 w-5" /> },
    { id: 'stats', title: 'Project Stats', icon: <Database className="h-5 w-5" /> },
    { id: 'components', title: 'Components', icon: <Component className="h-5 w-5" /> },
    { id: 'hooks', title: 'Hooks', icon: <Anchor className="h-5 w-5" /> },
    { id: 'utilities', title: 'Utilities', icon: <Wrench className="h-5 w-5" /> },
    { id: 'pages', title: 'Pages', icon: <FileCode className="h-5 w-5" /> },
    { id: 'routes', title: 'Routes', icon: <Route className="h-5 w-5" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupedComponents = manifest?.components.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, typeof manifest.components>) || {};

  const renderTableCard = (table: TableInfo) => {
    const isExpanded = expandedTables.has(table.name);
    
    return (
      <Collapsible key={table.name} open={isExpanded} onOpenChange={() => toggleTable(table.name)}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Table className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-mono">{table.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {table.columns.length} cols
                  </Badge>
                  {table.rls_enabled ? (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      RLS
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      No RLS
                    </Badge>
                  )}
                  {table.rls_policies.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {table.rls_policies.length} policies
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Columns */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">COLUMNS</h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {table.columns.map(col => (
                    <div key={col.name} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30">
                      <span className="font-mono">{col.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{col.type}</Badge>
                        {col.nullable && <Badge variant="secondary" className="text-xs">nullable</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foreign Keys */}
              {table.foreign_keys.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">FOREIGN KEYS</h4>
                  <div className="space-y-1">
                    {table.foreign_keys.map((fk, idx) => (
                      <div key={idx} className="text-xs py-1 px-2 rounded bg-muted/30">
                        <span className="font-mono">{fk.column}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-mono">{fk.references_table}.{fk.references_column}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RLS Policies */}
              {table.rls_policies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">RLS POLICIES</h4>
                  <div className="space-y-2">
                    {table.rls_policies.map((policy, idx) => (
                      <div key={idx} className="text-xs p-2 rounded bg-muted/30 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{policy.name}</span>
                          <Badge variant="outline" className="text-xs">{policy.command}</Badge>
                        </div>
                        {policy.using_expression && (
                          <div className="text-muted-foreground truncate">
                            USING: <code className="text-xs">{policy.using_expression.substring(0, 80)}...</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold font-roboto-slab">App Documentation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live backend schema and auto-generated documentation
          </p>
          {schema && (
            <p className="text-xs text-muted-foreground mt-2">
              Schema generated: {new Date(schema.generated_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isSchemaLoading}
          >
            {isSchemaLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Schema
          </Button>
          <Button onClick={handleExportPdf} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Export to PDF
          </Button>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Table of Contents</h3>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant="outline"
              size="sm"
              onClick={() => {
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="gap-2"
            >
              {section.icon}
              {section.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Documentation Content */}
      <div id="documentation-content" className="space-y-6 bg-background">
        
        {/* Live Backend Schema Section */}
        <div id="backend-docs" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Database Schema (Live)</h3>
              {schema && (
                <Badge variant="secondary">{schema.tables.length} tables</Badge>
              )}
            </div>
            <Button onClick={handleDownloadSchema} variant="outline" size="sm" disabled={!schema}>
              <FileDown className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          
          {isSchemaLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading schema...</span>
            </div>
          ) : schema ? (
            <div className="space-y-4">
              {/* Enums */}
              {schema.enums.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Enums ({schema.enums.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {schema.enums.map(e => (
                        <div key={e.name} className="p-2 rounded bg-muted/50">
                          <span className="font-mono text-xs font-semibold">{e.name}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {e.values.map(v => (
                              <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Storage Buckets */}
              {schema.storage_buckets.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Storage Buckets ({schema.storage_buckets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {schema.storage_buckets.map(b => (
                        <Badge key={b.name} variant={b.is_public ? 'default' : 'secondary'}>
                          {b.is_public ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                          {b.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Database Functions */}
              {schema.functions.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Database Functions ({schema.functions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {schema.functions.map(f => (
                        <div key={f.name} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30">
                          <span className="font-mono">{f.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{f.return_type}</Badge>
                            <Badge variant="secondary" className="text-xs">{f.language}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tables */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">TABLES</h4>
                <div className="grid gap-2">
                  {schema.tables.map(table => renderTableCard(table))}
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Click "Refresh Schema" to load live database schema</p>
            </Card>
          )}
        </div>

        {/* Live Edge Functions Section */}
        <div id="edge-functions-live" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Edge Functions</h3>
              <Badge variant="secondary">{edgeFunctions.length} functions</Badge>
            </div>
            <Button onClick={handleDownloadEdgeFunctions} variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="grid gap-2">
            {edgeFunctions.map(fn => (
              <div key={fn.name} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{fn.name}</span>
                </div>
                <Badge variant={fn.verify_jwt ? 'default' : 'secondary'} className="text-xs">
                  {fn.verify_jwt ? 'JWT Required' : 'Public'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Live Secrets Section */}
        <div id="secrets-live" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Configured Secrets</h3>
              <Badge variant="secondary">{secrets.length} secrets</Badge>
            </div>
            <Button onClick={handleDownloadSecrets} variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="grid gap-2">
            {secrets.map(secret => (
              <div key={secret.name} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{secret.name}</span>
                </div>
                <Badge variant={secret.is_configured ? 'default' : 'destructive'} className="text-xs">
                  {secret.is_configured ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Configured</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Missing</>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Guide - Database Driven */}
        <div id="migration-guide">
          <MigrationGuideSection 
            isOpen={migrationGuideOpen} 
            onToggle={() => setMigrationGuideOpen(!migrationGuideOpen)} 
          />
        </div>

        {/* File Structure Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderTree className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">File Structure</h3>
              {manifest && (
                <Badge variant="secondary">
                  {manifest.stats.totalComponents + manifest.stats.totalHooks + manifest.stats.totalUtilities} items
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast.info('Ask AI: "Regenerate the docs manifest" to scan the codebase and update the file structure.');
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Components, hooks, utilities, and routes from the codebase. Last updated: {manifest ? new Date(manifest.generatedAt).toLocaleString() : 'Not loaded'}
          </p>
        </div>

        {/* Stats Section */}
        {manifest && (
          <div id="stats" className="space-y-4">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Project Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{manifest.stats.totalComponents}</div>
                  <p className="text-sm text-muted-foreground">Components</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{manifest.stats.totalHooks}</div>
                  <p className="text-sm text-muted-foreground">Hooks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{manifest.stats.totalUtilities}</div>
                  <p className="text-sm text-muted-foreground">Utilities</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{manifest.stats.totalEdgeFunctions}</div>
                  <p className="text-sm text-muted-foreground">Edge Functions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{manifest.stats.totalPages}</div>
                  <p className="text-sm text-muted-foreground">Pages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{manifest.stats.totalRoutes}</div>
                  <p className="text-sm text-muted-foreground">Routes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Components Section */}
        {manifest && (
          <CollapsibleDocSection
            title={`Components (${manifest.stats.totalComponents})`}
            icon={<Component className="h-5 w-5" />}
            id="components"
          >
            <div className="space-y-6">
              {Object.entries(groupedComponents).sort(([a], [b]) => a.localeCompare(b)).map(([category, components]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium capitalize flex items-center gap-2">
                    <Badge variant="outline">{category}</Badge>
                    <span className="text-muted-foreground text-sm">({components.length})</span>
                  </h4>
                  <div className="grid gap-2">
                    {components.map((comp) => (
                      <div key={comp.path} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{comp.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">{comp.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleDocSection>
        )}

        {/* Hooks Section */}
        {manifest && (
          <CollapsibleDocSection
            title={`Hooks (${manifest.stats.totalHooks})`}
            icon={<Anchor className="h-5 w-5" />}
            id="hooks"
          >
            <div className="grid gap-2">
              {manifest.hooks.map((hook) => (
                <div key={hook.path} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{hook.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hook.exports.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        exports: {hook.exports.slice(0, 3).join(', ')}{hook.exports.length > 3 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleDocSection>
        )}

        {/* Utilities Section */}
        {manifest && (
          <CollapsibleDocSection
            title={`Utilities (${manifest.stats.totalUtilities})`}
            icon={<Wrench className="h-5 w-5" />}
            id="utilities"
          >
            <div className="grid gap-2">
              {manifest.utilities.map((util) => (
                <div key={util.path} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{util.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {util.exports.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        exports: {util.exports.slice(0, 3).join(', ')}{util.exports.length > 3 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleDocSection>
        )}

        {/* Pages Section */}
        {manifest && (
          <CollapsibleDocSection
            title={`Pages (${manifest.stats.totalPages})`}
            icon={<FileCode className="h-5 w-5" />}
            id="pages"
          >
            <div className="grid gap-2">
              {manifest.pages.map((page) => (
                <div key={page.path} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{page.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{page.path}</span>
                </div>
              ))}
            </div>
          </CollapsibleDocSection>
        )}

        {/* Routes Section */}
        {manifest && (
          <CollapsibleDocSection
            title={`Routes (${manifest.stats.totalRoutes})`}
            icon={<Route className="h-5 w-5" />}
            id="routes"
          >
            <div className="grid gap-2">
              {manifest.routes.map((route) => (
                <div key={route.path} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{route.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{route.component}</span>
                    {route.isProtected && (
                      <Badge variant="secondary" className="text-xs">Protected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleDocSection>
        )}
      </div>
    </div>
  );
}
