export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

export interface ComponentInfo {
  name: string;
  path: string;
  category: string;
  exports: string[];
}

export interface HookInfo {
  name: string;
  path: string;
  exports: string[];
}

export interface UtilityInfo {
  name: string;
  path: string;
  exports: string[];
}

export interface EdgeFunctionInfo {
  name: string;
  path: string;
  hasIndex: boolean;
}

export interface RouteInfo {
  path: string;
  component: string;
  isProtected: boolean;
}

export interface PageInfo {
  name: string;
  path: string;
}

export interface DocsManifest {
  generatedAt: string;
  stats: {
    totalComponents: number;
    totalHooks: number;
    totalUtilities: number;
    totalEdgeFunctions: number;
    totalPages: number;
    totalRoutes: number;
  };
  projectStructure: FileInfo[];
  components: ComponentInfo[];
  hooks: HookInfo[];
  utilities: UtilityInfo[];
  edgeFunctions: EdgeFunctionInfo[];
  pages: PageInfo[];
  routes: RouteInfo[];
}
