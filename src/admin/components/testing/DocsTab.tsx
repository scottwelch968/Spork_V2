import { useState, useEffect } from 'react';
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Badge,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    ScrollArea
} from '@/admin/ui';
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
    Table as TableIcon,
    Shield,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronRight,
    Lock,
    Unlock,
    Clock,
    BarChart3
} from 'lucide-react';
import { exportToPdf } from '@/utils/exportDocumentationPdf';
import { toast } from 'sonner';
import { CollapsibleDocSection } from './docs/CollapsibleDocSection';
import { MigrationGuideSection } from './docs/MigrationGuideSection';
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
        { id: 'backend-docs', title: 'Backend Schema', icon: <Database className="h-4 w-4" /> },
        { id: 'edge-functions-live', title: 'Edge Functions', icon: <Server className="h-4 w-4" /> },
        { id: 'secrets-live', title: 'Secrets', icon: <Key className="h-4 w-4" /> },
        { id: 'migration-guide', title: 'Migration Guide', icon: <FileText className="h-4 w-4" /> },
        { id: 'stats', title: 'Project Stats', icon: <Database className="h-4 w-4" /> },
        { id: 'components', title: 'Components', icon: <Component className="h-4 w-4" /> },
        { id: 'hooks', title: 'Hooks', icon: <Anchor className="h-4 w-4" /> },
        { id: 'utilities', title: 'Utilities', icon: <Wrench className="h-4 w-4" /> },
        { id: 'pages', title: 'Pages', icon: <FileCode className="h-4 w-4" /> },
        { id: 'routes', title: 'Routes', icon: <Route className="h-4 w-4" /> },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-admin-info" />
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
            <Collapsible key={table.name} open={isExpanded} onOpenChange={() => toggleTable(table.name)} className="border border-admin-border rounded-xl bg-admin-card shadow-sm overflow-hidden group">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-admin-bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-admin-bg-muted rounded border border-admin-border">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-admin-text-muted" /> : <ChevronRight className="h-4 w-4 text-admin-text-muted" />}
                            </div>
                            <TableIcon className="h-4 w-4 text-admin-info" />
                            <span className="font-mono text-sm font-bold text-admin-text">{table.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-admin-border text-admin-text-muted">
                                {table.columns.length} COLS
                            </Badge>
                            {table.rls_enabled ? (
                                <Badge className="text-[10px] bg-admin-success/10 text-admin-success border-admin-success/20">
                                    <Shield className="h-3 w-3 mr-1" />
                                    RLS
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="text-[10px] bg-admin-error/10 text-admin-error border-admin-error/20">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    NO RLS
                                </Badge>
                            )}
                            {table.rls_policies.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] bg-admin-info/10 text-admin-info border-admin-info/20">
                                    {table.rls_policies.length} POLICIES
                                </Badge>
                            )}
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
                    <div className="p-6 border-t border-admin-border space-y-6">
                        {/* Columns */}
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted mb-3 flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-admin-info" />
                                COLUMNS
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {table.columns.map(col => (
                                    <div key={col.name} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-admin-bg-muted/50 border border-admin-border shadow-sm">
                                        <span className="font-mono font-semibold text-admin-text">{col.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-admin-text-muted">{col.type}</span>
                                            {col.nullable && <Badge className="text-[9px] bg-admin-bg-muted border-admin-border text-admin-text-muted">NULL</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Foreign Keys */}
                        {table.foreign_keys.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted mb-3 flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-admin-warning" />
                                    FOREIGN KEYS
                                </h4>
                                <div className="space-y-2">
                                    {table.foreign_keys.map((fk, idx) => (
                                        <div key={idx} className="text-xs p-3 rounded-lg bg-admin-warning/5 border border-admin-warning/10 flex items-center gap-3">
                                            <Key className="h-3.5 w-3.5 text-admin-warning" />
                                            <div>
                                                <span className="font-mono font-bold text-admin-text">{fk.column}</span>
                                                <span className="text-admin-text-muted mx-2">→</span>
                                                <span className="font-mono text-admin-info">{fk.references_table}.{fk.references_column}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RLS Policies */}
                        {table.rls_policies.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted mb-3 flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-admin-success" />
                                    RLS POLICIES
                                </h4>
                                <div className="grid gap-3">
                                    {table.rls_policies.map((policy, idx) => (
                                        <div key={idx} className="text-xs p-4 rounded-xl bg-admin-card border border-admin-border shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-admin-text">{policy.name}</span>
                                                <Badge className="text-[9px] bg-admin-info/10 text-admin-info border-admin-info/20">{policy.command}</Badge>
                                            </div>
                                            {policy.using_expression && (
                                                <pre className="text-[10px] bg-admin-bg-muted p-2.5 rounded-lg border border-admin-border text-admin-text-muted font-mono overflow-hidden truncate">
                                                    USING: {policy.using_expression}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    return (
        <div className="space-y-8">
            {/* Premium Header */}
            <Card className="bg-admin-card border-admin-border overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-admin-info via-admin-accent to-admin-info animate-shimmer" />
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-admin-info-muted flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-500 shadow-inner">
                                <FileCode className="h-8 w-8 text-admin-info" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-admin-text font-roboto-slab tracking-tight">System Documentation</h1>
                                <p className="text-admin-text-muted mt-2 max-w-lg leading-relaxed">
                                    Live architectural overview, backend schema records, and auto-generated system documentation.
                                </p>
                                {schema && (
                                    <div className="flex items-center gap-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-admin-text-muted">
                                        <Clock className="h-3 w-3" />
                                        Last Sync: {new Date(schema.generated_at).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={isSchemaLoading}
                                className="h-11 border-admin-border text-admin-text hover:bg-admin-bg-muted gap-2 shadow-sm px-6"
                            >
                                {isSchemaLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-admin-info" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 text-admin-info" />
                                )}
                                Sync Schema
                            </Button>
                            <Button onClick={handleExportPdf} disabled={isExporting} className="h-11 bg-admin-info hover:bg-admin-info/90 text-white gap-2 shadow-lg px-6">
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="h-4 w-4" />
                                )}
                                Generate PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table of Contents Searchbar Style */}
            <Card className="bg-admin-card border-admin-border p-3">
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-3 px-3 mr-2 border-r border-admin-border">
                        <FolderTree className="h-4 w-4 text-admin-text-muted" />
                        <span className="text-xs font-bold text-admin-text uppercase tracking-widest">Navigator</span>
                    </div>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => {
                                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="px-4 py-2 text-xs font-semibold text-admin-text-muted hover:text-admin-info hover:bg-admin-info/5 rounded-lg border border-transparent hover:border-admin-info/20 transition-all duration-300 flex items-center gap-2"
                        >
                            <span className="opacity-70">{section.icon}</span>
                            {section.title}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Main Content Area */}
            <div id="documentation-content" className="space-y-10">

                {/* Database Section */}
                <section id="backend-docs" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-admin-info/10 rounded-xl border border-admin-info/20">
                                <Database className="h-5 w-5 text-admin-info" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-roboto-slab text-admin-text">Database Schema</h3>
                                <p className="text-sm text-admin-text-muted">Real-time introspection of the production database</p>
                            </div>
                            {schema && (
                                <Badge className="bg-admin-info/10 text-admin-info border-admin-info/20 font-bold px-3">
                                    {schema.tables.length} TABLES
                                </Badge>
                            )}
                        </div>
                        <Button onClick={handleDownloadSchema} variant="ghost" size="sm" disabled={!schema} className="text-admin-info hover:bg-admin-info/10 gap-2">
                            <FileDown className="h-4 w-4" />
                            Export Markdown
                        </Button>
                    </div>

                    {isSchemaLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-admin-card border border-admin-border rounded-2xl border-dashed">
                            <Loader2 className="h-10 w-10 animate-spin text-admin-info mb-4" />
                            <span className="text-sm font-bold text-admin-text-muted uppercase tracking-widest">Introspecting Schema...</span>
                        </div>
                    ) : schema ? (
                        <div className="space-y-8">
                            {/* Type Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Enums */}
                                {schema.enums.length > 0 && (
                                    <Card className="bg-admin-card border-admin-border shadow-sm">
                                        <CardHeader className="py-4 bg-admin-bg-muted/30 border-b border-admin-border">
                                            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-admin-text">
                                                <Code className="h-4 w-4 text-admin-info" />
                                                Custom Enums ({schema.enums.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {schema.enums.map(e => (
                                                    <div key={e.name} className="p-3 rounded-xl bg-admin-bg-muted/50 border border-admin-border shadow-sm">
                                                        <span className="font-mono text-xs font-bold text-admin-text mb-2 block">{e.name}</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {e.values.map(v => (
                                                                <Badge key={v} className="text-[9px] font-bold bg-admin-bg-muted border-admin-border text-admin-text-muted uppercase tracking-tight">{v}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Storage */}
                                {schema.storage_buckets.length > 0 && (
                                    <Card className="bg-admin-card border-admin-border shadow-sm">
                                        <CardHeader className="py-4 bg-admin-bg-muted/30 border-b border-admin-border">
                                            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-admin-text">
                                                <Package className="h-4 w-4 text-admin-warning" />
                                                Storage Buckets ({schema.storage_buckets.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {schema.storage_buckets.map(b => (
                                                    <div key={b.name} className="p-3 rounded-xl bg-admin-bg-muted/50 border border-admin-border shadow-sm flex items-center gap-2">
                                                        {b.is_public ? <Unlock className="h-3 w-3 text-admin-success" /> : <Lock className="h-3 w-3 text-admin-warning" />}
                                                        <span className="text-xs font-bold text-admin-text font-mono uppercase">{b.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Functional Objects */}
                            {schema.functions.length > 0 && (
                                <Card className="bg-admin-card border-admin-border shadow-sm">
                                    <CardHeader className="py-4 bg-admin-bg-muted/30 border-b border-admin-border">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-admin-text">
                                            <Server className="h-4 w-4 text-admin-accent" />
                                            Database Functions ({schema.functions.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ScrollArea className="h-60">
                                            <div className="p-4 space-y-1">
                                                {schema.functions.map(f => (
                                                    <div key={f.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-admin-bg-muted/50 transition-colors border border-transparent hover:border-admin-border group">
                                                        <span className="font-mono text-xs font-bold text-admin-text truncate group-hover:text-admin-info transition-colors">{f.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="text-[10px] bg-admin-bg-muted border-admin-border text-admin-text-muted font-mono">{f.return_type}</Badge>
                                                            <Badge className="text-[10px] bg-admin-accent/10 text-admin-accent border-admin-accent/20 uppercase font-bold">{f.language}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Table System */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-admin-text-muted flex items-center gap-4">
                                    <span>Data Entities</span>
                                    <div className="h-[1px] bg-admin-border flex-1" />
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {schema.tables.map(table => renderTableCard(table))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Card className="p-12 text-center border-dashed border-admin-border bg-admin-bg-muted/10">
                            <div className="h-16 w-16 bg-admin-bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Database className="h-8 w-8 text-admin-text-muted opacity-30" />
                            </div>
                            <p className="text-admin-text font-bold mb-2">Schema Not Loaded</p>
                            <p className="text-admin-text-muted text-sm max-w-sm mx-auto mb-6">Connect to the database and sync the schema to explore live definitions and policies.</p>
                            <Button onClick={handleRefresh} className="bg-admin-info text-white">Sync Database Now</Button>
                        </Card>
                    )}
                </section>

                <div className="h-px bg-admin-border w-full opacity-50" />

                {/* Edge Functions */}
                <section id="edge-functions-live" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-admin-accent/10 rounded-xl border border-admin-accent/20">
                                <Server className="h-5 w-5 text-admin-accent" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-roboto-slab text-admin-text">Edge Functions</h3>
                                <p className="text-sm text-admin-text-muted">Available serverless logic endpoints</p>
                            </div>
                        </div>
                        <Button onClick={handleDownloadEdgeFunctions} variant="ghost" size="sm" className="text-admin-accent hover:bg-admin-accent/10 gap-2">
                            <FileDown className="h-4 w-4" />
                            Documentation
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {edgeFunctions.map(fn => (
                            <div key={fn.name} className="flex items-center justify-between p-4 rounded-xl bg-admin-card border border-admin-border shadow-sm hover:border-admin-accent/50 transition-all duration-300 group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-admin-bg-muted rounded-lg group-hover:bg-admin-accent/10 transition-colors">
                                        <Code className="h-4 w-4 text-admin-text-muted group-hover:text-admin-accent" />
                                    </div>
                                    <span className="font-mono text-sm font-bold text-admin-text">{fn.name}</span>
                                </div>
                                <Badge className={`text-[10px] font-bold ${fn.verify_jwt ? 'bg-admin-info/10 text-admin-info border-admin-info/20' : 'bg-admin-warning/10 text-admin-warning border-admin-warning/20'}`}>
                                    {fn.verify_jwt ? 'SECURED' : 'PUBLIC'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Secrets */}
                <section id="secrets-live" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-admin-warning/10 rounded-xl border border-admin-warning/20">
                                <Key className="h-5 w-5 text-admin-warning" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-roboto-slab text-admin-text">Environment Secrets</h3>
                                <p className="text-sm text-admin-text-muted">Configuration and API key status audit</p>
                            </div>
                        </div>
                        <Button onClick={handleDownloadSecrets} variant="ghost" size="sm" className="text-admin-warning hover:bg-admin-warning/10 gap-2">
                            <FileDown className="h-4 w-4" />
                            Manifest
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {secrets.map(secret => (
                            <div key={secret.name} className="flex items-center justify-between p-4 rounded-xl bg-admin-card border border-admin-border shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Key className="h-4 w-4 text-admin-text-muted" />
                                    <span className="font-mono text-sm font-bold text-admin-text">{secret.name}</span>
                                </div>
                                <Badge className={`text-[10px] font-bold uppercase ${secret.is_configured ? 'bg-admin-success/10 text-admin-success border-admin-success/20' : 'bg-admin-error/10 text-admin-error border-admin-error/20'}`}>
                                    {secret.is_configured ? 'CONFIGURED' : 'MISSING'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Custom Guides */}
                <section id="migration-guide">
                    <MigrationGuideSection
                        isOpen={migrationGuideOpen}
                        onToggle={() => setMigrationGuideOpen(!migrationGuideOpen)}
                    />
                </section>

                {/* Manifest Stats */}
                {manifest && (
                    <section id="stats" className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-admin-info/10 rounded-xl border border-admin-info/20">
                                <BarChart3 className="h-5 w-5 text-admin-info" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-roboto-slab text-admin-text">System Metrics</h3>
                                <p className="text-sm text-admin-text-muted">Quantified developer ecosystem overview</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                            {[
                                { label: 'Components', val: manifest.stats.totalComponents, icon: Component, col: 'text-admin-info' },
                                { label: 'Hooks', val: manifest.stats.totalHooks, icon: Anchor, col: 'text-admin-accent' },
                                { label: 'Utilities', val: manifest.stats.totalUtilities, icon: Wrench, col: 'text-admin-warning' },
                                { label: 'Edge Functions', val: manifest.stats.totalEdgeFunctions, icon: Server, col: 'text-admin-accent' },
                                { label: 'Pages', val: manifest.stats.totalPages, icon: FileCode, col: 'text-admin-info' },
                                { label: 'Routes', val: manifest.stats.totalRoutes, icon: Route, col: 'text-admin-info' },
                            ].map((s, i) => (
                                <Card key={i} className="bg-admin-card border-admin-border shadow-sm border-b-2 border-b-transparent hover:border-b-admin-info transition-all duration-300">
                                    <CardContent className="pt-6 text-center">
                                        <div className="h-10 w-10 rounded-full bg-admin-bg-muted flex items-center justify-center mx-auto mb-3">
                                            <s.icon className={`h-5 w-5 ${s.col}`} />
                                        </div>
                                        <div className="text-2xl font-bold text-admin-text font-roboto-slab">{s.val}</div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted mt-1">{s.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Code Entities */}
                <section id="components" className="space-y-4">
                    <CollapsibleDocSection
                        title={`Component Library (${manifest?.stats.totalComponents || 0})`}
                        icon={<Component className="h-5 w-5" />}
                    >
                        <div className="space-y-8">
                            {Object.entries(groupedComponents).sort(([a], [b]) => a.localeCompare(b)).map(([category, components]) => (
                                <div key={category} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-admin-info text-white font-bold uppercase tracking-wider text-[10px] items-center px-4 py-1">{category}</Badge>
                                        <div className="h-px bg-admin-border flex-1 opacity-40" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {components.map((comp) => (
                                            <div key={comp.path} className="flex flex-col p-4 rounded-xl bg-admin-bg-muted/50 border border-admin-border hover:bg-admin-bg-muted transition-colors shadow-sm group">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Code className="h-3.5 w-3.5 text-admin-info opacity-70" />
                                                    <span className="font-mono text-sm font-bold text-admin-text group-hover:text-admin-info transition-colors truncate">{comp.name}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-admin-text-muted truncate lowercase">{comp.path.replace('src/', '@/')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleDocSection>
                </section>

                <section id="hooks" className="space-y-4">
                    <CollapsibleDocSection
                        title={`Application Hooks (${manifest?.stats.totalHooks || 0})`}
                        icon={<Anchor className="h-5 w-5" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {manifest?.hooks.map((hook) => (
                                <div key={hook.path} className="p-4 rounded-xl bg-admin-bg-muted/50 border border-admin-border shadow-sm flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Anchor className="h-4 w-4 text-admin-accent" />
                                            <span className="font-mono text-sm font-bold text-admin-text">{hook.name}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-admin-text-muted lowercase">{hook.path.replace('src/hooks/', 'hooks/')}</span>
                                    </div>
                                    {hook.exports.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {hook.exports.map(e => (
                                                <span key={e} className="text-[10px] bg-admin-accent/5 text-admin-accent-muted border border-admin-accent/10 px-2 py-0.5 rounded-md font-mono">{e}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CollapsibleDocSection>
                </section>

            </div>
        </div>
    );
}
