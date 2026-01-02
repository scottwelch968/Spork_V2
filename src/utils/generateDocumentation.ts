export interface ProjectFile {
  name: string;
  type: 'file' | 'folder';
  description?: string;
  children?: ProjectFile[];
}

export interface ComponentDoc {
  name: string;
  path: string;
  description: string;
  props?: string[];
  uses?: string[];
  category: string;
}

export interface HookDoc {
  name: string;
  path: string;
  description: string;
  returns: string;
  usage?: string;
}

export interface UtilityDoc {
  name: string;
  path: string;
  description: string;
  functions: string[];
}

export interface DependencyDoc {
  name: string;
  version: string;
  description: string;
  category: string;
}

export interface RouteDoc {
  path: string;
  page: string;
  protected: boolean;
  adminOnly: boolean;
  description: string;
}

export interface ContextDoc {
  name: string;
  path: string;
  description: string;
  provides: string[];
}

export interface Documentation {
  generatedAt: string;
  version: string;
  projectStructure: ProjectFile[];
  components: ComponentDoc[];
  hooks: HookDoc[];
  utilities: UtilityDoc[];
  dependencies: DependencyDoc[];
  routes: RouteDoc[];
  contexts: ContextDoc[];
}

export function generateDocumentation(): Documentation {
  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    projectStructure: getProjectStructure(),
    components: getComponents(),
    hooks: getHooks(),
    utilities: getUtilities(),
    dependencies: getDependencies(),
    routes: getRoutes(),
    contexts: getContexts(),
  };
}

function getProjectStructure(): ProjectFile[] {
  return [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'components',
          type: 'folder',
          description: 'React UI components organized by feature',
          children: [
            { name: 'admin', type: 'folder', description: 'Admin panel components (analytics, billing, email, models, personas, prompts, spaces)' },
            { name: 'auth', type: 'folder', description: 'Authentication components (LoginForm, SignupForm, GoogleAuthButton, ProtectedRoute)' },
            { name: 'chat', type: 'folder', description: 'Chat interface components (ChatInterface, MessageList, MessageInput, ModelSelector)' },
            { name: 'files', type: 'folder', description: 'File management components (FileCard, FileGrid, FileList)' },
            { name: 'layout', type: 'folder', description: 'App layout components (AppLayout, LeftSidebar, RightSidebar, TopBar)' },
            { name: 'settings', type: 'folder', description: 'User settings components (AccountInfoSection, ChatPreferencesSection)' },
            { name: 'space', type: 'folder', description: 'Workspace/Space components (SpaceCard, SpaceSettings, chat, files, ai-config)' },
            { name: 'templates', type: 'folder', description: 'Template cards and dialogs for Discover section' },
            { name: 'ui', type: 'folder', description: 'Shadcn UI primitive components (Button, Card, Dialog, etc.)' },
          ],
        },
        {
          name: 'contexts',
          type: 'folder',
          description: 'React Context providers for global state',
          children: [
            { name: 'AuthContext.tsx', type: 'file', description: 'Authentication state and session management' },
            { name: 'ChatContext.tsx', type: 'file', description: 'Chat state (model, persona, pending prompt)' },
          ],
        },
        {
          name: 'hooks',
          type: 'folder',
          description: '42+ custom React hooks for data fetching and state management',
        },
        {
          name: 'pages',
          type: 'folder',
          description: 'Page components for routing',
          children: [
            { name: 'admin', type: 'folder', description: 'Admin panel pages' },
            { name: 'Auth.tsx', type: 'file', description: 'Login/Signup page' },
            { name: 'Dashboard.tsx', type: 'file', description: 'Main dashboard' },
            { name: 'Chat.tsx', type: 'file', description: 'AI chat interface' },
            { name: 'Files.tsx', type: 'file', description: 'File management' },
            { name: 'Spaces.tsx', type: 'file', description: 'Workspace list' },
            { name: 'SpaceView.tsx', type: 'file', description: 'Individual workspace view' },
            { name: 'Settings.tsx', type: 'file', description: 'User settings' },
            { name: 'Billing.tsx', type: 'file', description: 'Billing dashboard' },
            { name: 'Discover.tsx', type: 'file', description: 'Template discovery' },
          ],
        },
        {
          name: 'utils',
          type: 'folder',
          description: 'Utility functions and helpers',
        },
        {
          name: 'integrations',
          type: 'folder',
          description: 'External service integrations',
          children: [
            { name: 'supabase', type: 'folder', description: 'Supabase client and types (auto-generated)' },
          ],
        },
        { name: 'App.tsx', type: 'file', description: 'Root application component with routing' },
        { name: 'main.tsx', type: 'file', description: 'Application entry point' },
        { name: 'index.css', type: 'file', description: 'Global styles and CSS variables (design system)' },
      ],
    },
    {
      name: 'supabase',
      type: 'folder',
      children: [
        { name: 'functions', type: 'folder', description: 'Edge functions for backend logic' },
        { name: 'migrations', type: 'folder', description: 'Database migrations (read-only)' },
        { name: 'config.toml', type: 'file', description: 'Supabase configuration (auto-generated)' },
      ],
    },
    {
      name: 'public',
      type: 'folder',
      description: 'Static assets and uploads',
    },
  ];
}

function getComponents(): ComponentDoc[] {
  return [
    // Layout Components
    { name: 'AppLayout', path: 'src/components/layout/AppLayout.tsx', description: 'Main application wrapper with sidebars and top bar', uses: ['LeftSidebar', 'RightSidebar', 'TopBar'], category: 'Layout' },
    { name: 'LeftSidebar', path: 'src/components/layout/LeftSidebar.tsx', description: 'Primary navigation sidebar with collapsible menu', uses: ['Button', 'HoverCard', 'DropdownMenu'], category: 'Layout' },
    { name: 'RightSidebar', path: 'src/components/layout/RightSidebar.tsx', description: 'Contextual sidebar for chat history, prompts, personas', uses: ['Tabs', 'ScrollArea', 'ChatHistory'], category: 'Layout' },
    { name: 'TopBar', path: 'src/components/layout/TopBar.tsx', description: 'Top navigation bar with dynamic page headers', uses: ['ModelSelector', 'PersonaSelector'], category: 'Layout' },
    
    // Auth Components
    { name: 'LoginForm', path: 'src/components/auth/LoginForm.tsx', description: 'Email/password login form', uses: ['Input', 'Button', 'Form'], category: 'Auth' },
    { name: 'SignupForm', path: 'src/components/auth/SignupForm.tsx', description: 'User registration form', uses: ['Input', 'Button', 'Form'], category: 'Auth' },
    { name: 'GoogleAuthButton', path: 'src/components/auth/GoogleAuthButton.tsx', description: 'Google OAuth login button', uses: ['Button'], category: 'Auth' },
    { name: 'ProtectedRoute', path: 'src/components/auth/ProtectedRoute.tsx', description: 'Route wrapper requiring authentication', uses: ['useAuth'], category: 'Auth' },
    
    // Chat Components
    { name: 'ChatInterface', path: 'src/components/chat/ChatInterface.tsx', description: 'Main chat UI with messages and input', uses: ['MessageList', 'MessageInput', 'ModelSelector', 'PersonaSelector'], category: 'Chat' },
    { name: 'MessageList', path: 'src/components/chat/MessageList.tsx', description: 'Displays chat message history', uses: ['ScrollArea', 'ImageMessageResponse'], category: 'Chat' },
    { name: 'MessageInput', path: 'src/components/chat/MessageInput.tsx', description: 'Chat input with file attachments', uses: ['Textarea', 'Button', 'AttachmentDropdown'], category: 'Chat' },
    { name: 'ModelSelector', path: 'src/components/chat/ModelSelector.tsx', description: 'AI model selection dropdown', uses: ['Select', 'useModels'], category: 'Chat' },
    { name: 'PersonaSelector', path: 'src/components/chat/PersonaSelector.tsx', description: 'Persona/assistant selection', uses: ['Select'], category: 'Chat' },
    { name: 'ChatHistory', path: 'src/components/chat/ChatHistory.tsx', description: 'List of previous chats', uses: ['ScrollArea', 'useChat'], category: 'Chat' },
    
    // File Components
    { name: 'FileCard', path: 'src/components/files/FileCard.tsx', description: 'File display card with actions', uses: ['Card', 'DropdownMenu', 'ImageLightbox'], category: 'Files' },
    { name: 'FileGrid', path: 'src/components/files/FileGrid.tsx', description: 'Grid layout for files', uses: ['FileCard'], category: 'Files' },
    { name: 'FileList', path: 'src/components/files/FileList.tsx', description: 'List layout for files', uses: ['FileRow'], category: 'Files' },
    { name: 'FileUploadZone', path: 'src/components/files/FileUploadZone.tsx', description: 'Drag-and-drop file upload area', uses: ['useFiles'], category: 'Files' },
    
    // Space Components
    { name: 'SpaceCard', path: 'src/components/space/SpaceCard.tsx', description: 'Workspace display card', uses: ['Card', 'Badge', 'DropdownMenu'], category: 'Spaces' },
    { name: 'SpaceGrid', path: 'src/components/space/SpaceGrid.tsx', description: 'Grid of workspace cards', uses: ['SpaceCard'], category: 'Spaces' },
    { name: 'CreateSpaceDialog', path: 'src/components/space/CreateSpaceDialog.tsx', description: 'Dialog for creating new workspace', uses: ['Dialog', 'Form', 'Input'], category: 'Spaces' },
    { name: 'SpaceSettings', path: 'src/components/space/SpaceSettings.tsx', description: 'Workspace settings panel', uses: ['Card', 'Switch', 'Input'], category: 'Spaces' },
    { name: 'MemberList', path: 'src/components/space/MemberList.tsx', description: 'List of workspace members', uses: ['Avatar', 'Badge'], category: 'Spaces' },
    { name: 'InviteMemberDialog', path: 'src/components/space/InviteMemberDialog.tsx', description: 'Dialog for inviting members', uses: ['Dialog', 'Input', 'Select'], category: 'Spaces' },
    
    // Settings Components
    { name: 'AccountInfoSection', path: 'src/components/settings/AccountInfoSection.tsx', description: 'User profile information form', uses: ['Card', 'Input', 'Form'], category: 'Settings' },
    { name: 'ChatPreferencesSection', path: 'src/components/settings/ChatPreferencesSection.tsx', description: 'Chat behavior preferences', uses: ['Card', 'Switch', 'Select'], category: 'Settings' },
    { name: 'DangerZoneSection', path: 'src/components/settings/DangerZoneSection.tsx', description: 'Account deletion section', uses: ['Card', 'Button', 'AlertDialog'], category: 'Settings' },
    
    // Template Components
    { name: 'SpaceTemplateCard', path: 'src/components/templates/SpaceTemplateCard.tsx', description: 'Space template display card', uses: ['Card', 'Badge', 'Button'], category: 'Templates' },
    { name: 'PromptTemplateCard', path: 'src/components/templates/TemplateCard.tsx', description: 'Prompt template display card', uses: ['Card', 'Badge', 'Button'], category: 'Templates' },
    { name: 'PersonaTemplateCard', path: 'src/components/templates/PersonaTemplateCard.tsx', description: 'Persona template display card', uses: ['Card', 'Badge', 'Button'], category: 'Templates' },
    
    // Admin Components
    { name: 'AdminLayout', path: 'src/components/admin/AdminLayout.tsx', description: 'Admin panel wrapper with access control', uses: ['AppLayout', 'useAdmin'], category: 'Admin' },
    { name: 'ModelsList', path: 'src/components/admin/models/ModelsList.tsx', description: 'Admin model management list', uses: ['Table', 'Badge', 'Button'], category: 'Admin' },
    { name: 'ModelForm', path: 'src/components/admin/models/ModelForm.tsx', description: 'Model configuration form', uses: ['Form', 'Input', 'Select', 'Slider'], category: 'Admin' },
  ];
}

function getHooks(): HookDoc[] {
  return [
    // Auth Hooks
    { name: 'useAuth', path: 'src/hooks/useAuth.tsx', description: 'Authentication state and methods with session management', returns: 'user, session, signIn, signOut, signUp, isLoading' },
    { name: 'useAdmin', path: 'src/hooks/useAdmin.tsx', description: 'Admin role check for protected admin routes', returns: 'isAdmin, isLoading' },
    
    // Data Hooks
    { name: 'useSpace', path: 'src/hooks/useSpace.tsx', description: 'Workspace CRUD operations and state', returns: 'spaces, createSpace, updateSpace, deleteSpace, toggleArchive, togglePin' },
    { name: 'useFiles', path: 'src/hooks/useFiles.tsx', description: 'File management operations', returns: 'files, folders, uploadFile, deleteFile, moveFile, createFolder' },
    { name: 'useChat', path: 'src/hooks/useChat.tsx', description: 'Chat state and message operations', returns: 'messages, chats, sendMessage, createChat, deleteChat' },
    { name: 'useModels', path: 'src/hooks/useModels.tsx', description: 'AI models fetching and selection', returns: 'models, isLoading, defaultModel' },
    { name: 'usePrompts', path: 'src/hooks/usePrompts.tsx', description: 'User prompts CRUD operations', returns: 'prompts, createPrompt, updatePrompt, deletePrompt' },
    { name: 'useKnowledgeBase', path: 'src/hooks/useKnowledgeBase.tsx', description: 'Knowledge base document management', returns: 'documents, uploadDocument, deleteDocument, queryKnowledgeBase' },
    
    // Billing Hooks
    { name: 'useBilling', path: 'src/hooks/useBilling.tsx', description: 'User billing and usage data', returns: 'usage, subscription, quotas, isLoading' },
    { name: 'useSubscriptionTiers', path: 'src/hooks/useSubscriptionTiers.tsx', description: 'Subscription tier management (admin)', returns: 'tiers, createTier, updateTier, deleteTier' },
    { name: 'useUserSubscriptions', path: 'src/hooks/useUserSubscriptions.tsx', description: 'User subscription management (admin)', returns: 'subscriptions, updateSubscription' },
    { name: 'usePaymentProcessors', path: 'src/hooks/usePaymentProcessors.tsx', description: 'Payment processor configuration', returns: 'processors, updateProcessor' },
    { name: 'useDiscountCodes', path: 'src/hooks/useDiscountCodes.tsx', description: 'Discount code management', returns: 'codes, createCode, updateCode, deleteCode' },
    { name: 'useCreditPackages', path: 'src/hooks/useCreditPackages.tsx', description: 'Credit package management', returns: 'packages, createPackage, updatePackage' },
    { name: 'useUserCredits', path: 'src/hooks/useUserCredits.tsx', description: 'User credit balance and purchases', returns: 'credits, purchaseCredits' },
    
    // Admin Hooks
    { name: 'useAdminSpaces', path: 'src/hooks/useAdminSpaces.tsx', description: 'Admin workspace management', returns: 'spaces, suspendSpace, reassignSpace' },
    { name: 'useAdminPromptTemplates', path: 'src/hooks/useAdminPromptTemplates.tsx', description: 'Admin prompt template management', returns: 'templates, categories, createTemplate, updateTemplate' },
    { name: 'useAdminPersonas', path: 'src/hooks/useAdminPersonas.tsx', description: 'Admin persona template management', returns: 'templates, categories, analytics, mutations' },
    
    // Space-specific Hooks
    { name: 'useSpaceChats', path: 'src/hooks/useSpaceChats.tsx', description: 'Space chat management', returns: 'chats, messages, createChat, sendMessage' },
    { name: 'useSpacePersonas', path: 'src/hooks/useSpacePersonas.tsx', description: 'Space persona management', returns: 'personas, createPersona, updatePersona, deletePersona' },
    { name: 'useSpacePrompts', path: 'src/hooks/useSpacePrompts.tsx', description: 'Space prompt management', returns: 'prompts, createPrompt, updatePrompt, deletePrompt' },
    { name: 'useSpaceCollaboration', path: 'src/hooks/useSpaceCollaboration.tsx', description: 'Space member and invitation management', returns: 'members, invitations, inviteMember, removeMember' },
    
    // Email Hooks
    { name: 'useEmailProviders', path: 'src/hooks/useEmailProviders.tsx', description: 'Email provider configuration', returns: 'providers, createProvider, updateProvider' },
    { name: 'useEmailTemplates', path: 'src/hooks/useEmailTemplates.tsx', description: 'Email template management', returns: 'templates, createTemplate, updateTemplate' },
    { name: 'useEmailRules', path: 'src/hooks/useEmailRules.tsx', description: 'Email automation rules', returns: 'rules, createRule, updateRule' },
    { name: 'useEmailLogs', path: 'src/hooks/useEmailLogs.tsx', description: 'Email sending logs', returns: 'logs, isLoading' },
    
    // Template Hooks
    { name: 'useSpaceTemplates', path: 'src/hooks/useSpaceTemplates.tsx', description: 'Space template library', returns: 'templates, categories, useTemplate' },
    { name: 'usePromptTemplates', path: 'src/hooks/usePromptTemplates.tsx', description: 'Prompt template library', returns: 'templates, categories, useTemplate' },
    { name: 'usePersonaTemplates', path: 'src/hooks/usePersonaTemplates.tsx', description: 'Persona template library', returns: 'templates, categories, useTemplate' },
    
    // Analytics Hooks
    { name: 'useRealtimeAnalytics', path: 'src/hooks/useRealtimeAnalytics.tsx', description: 'Real-time usage analytics with Supabase subscriptions', returns: 'stats, activityFeed, connectionStatus' },
    
    // Settings Hooks
    { name: 'useUserSettings', path: 'src/hooks/useUserSettings.tsx', description: 'User preferences and settings', returns: 'settings, updateSettings' },
    { name: 'useSystemSettings', path: 'src/hooks/useSystemSettings.tsx', description: 'System-wide configuration (admin)', returns: 'settings, updateSetting' },
    
    // Utility Hooks
    { name: 'useFolders', path: 'src/hooks/useFolders.tsx', description: 'Chat folder organization', returns: 'folders, createFolder, addChatToFolder' },
    { name: 'useImageGeneration', path: 'src/hooks/useImageGeneration.tsx', description: 'AI image generation', returns: 'images, generateImage, deleteImage, isGenerating' },
    { name: 'use-mobile', path: 'src/hooks/use-mobile.tsx', description: 'Mobile viewport detection', returns: 'isMobile' },
    { name: 'use-toast', path: 'src/hooks/use-toast.ts', description: 'Toast notification system', returns: 'toast, toasts, dismiss' },
  ];
}

function getUtilities(): UtilityDoc[] {
  return [
    { name: 'utils', path: 'src/lib/utils.ts', description: 'General utility functions', functions: ['cn() - Tailwind class name merger'] },
    { name: 'logActivity', path: 'src/utils/logActivity.ts', description: 'Activity logging to workspace_activity table', functions: ['logActivity(workspaceId, action, details)'] },
    { name: 'triggerSystemEvent', path: 'src/utils/triggerSystemEvent.ts', description: 'Triggers system events for email automation', functions: ['triggerSystemEvent(eventType, payload)'] },
    { name: 'costForecasting', path: 'src/utils/costForecasting.ts', description: 'Cost prediction and budgeting utilities', functions: ['forecastCosts(usage, period)', 'calculateBudgetUtilization()'] },
    { name: 'exportAnalytics', path: 'src/utils/exportAnalytics.ts', description: 'Analytics data export to CSV/JSON', functions: ['exportToCSV(data)', 'exportToJSON(data)'] },
    { name: 'generateDocumentation', path: 'src/utils/generateDocumentation.ts', description: 'Generates app documentation data', functions: ['generateDocumentation()'] },
    { name: 'exportDocumentationPdf', path: 'src/utils/exportDocumentationPdf.ts', description: 'Exports documentation to PDF', functions: ['exportToPdf(elementId)'] },
  ];
}

function getDependencies(): DependencyDoc[] {
  return [
    // Core
    { name: 'react', version: '^18.3.1', description: 'UI component library for building user interfaces', category: 'Core' },
    { name: 'react-dom', version: '^18.3.1', description: 'React DOM rendering', category: 'Core' },
    { name: 'react-router-dom', version: '^6.26.2', description: 'Client-side routing and navigation', category: 'Core' },
    
    // State Management
    { name: '@tanstack/react-query', version: '^5.56.2', description: 'Server state management, caching, and data fetching', category: 'State Management' },
    
    // Backend
    { name: '@supabase/supabase-js', version: '^2.84.0', description: 'Supabase client for database, auth, storage, and edge functions', category: 'Backend' },
    
    // UI Components
    { name: 'lucide-react', version: '^0.462.0', description: 'Icon library with 1000+ icons', category: 'UI' },
    { name: 'class-variance-authority', version: '^0.7.1', description: 'Component variant management for Tailwind', category: 'UI' },
    { name: 'clsx', version: '^2.1.1', description: 'Conditional class name utility', category: 'UI' },
    { name: 'tailwind-merge', version: '^2.5.2', description: 'Tailwind class merging without conflicts', category: 'UI' },
    { name: 'tailwindcss-animate', version: '^1.0.7', description: 'Tailwind animation utilities', category: 'UI' },
    
    // Radix UI Primitives
    { name: '@radix-ui/react-dialog', version: '^1.1.2', description: 'Accessible dialog/modal component', category: 'Radix UI' },
    { name: '@radix-ui/react-dropdown-menu', version: '^2.1.1', description: 'Accessible dropdown menu', category: 'Radix UI' },
    { name: '@radix-ui/react-tabs', version: '^1.1.0', description: 'Accessible tabs component', category: 'Radix UI' },
    { name: '@radix-ui/react-select', version: '^2.1.1', description: 'Accessible select/dropdown', category: 'Radix UI' },
    { name: '@radix-ui/react-popover', version: '^1.1.1', description: 'Accessible popover component', category: 'Radix UI' },
    { name: '@radix-ui/react-toast', version: '^2.1.1', description: 'Accessible toast notifications', category: 'Radix UI' },
    { name: '@radix-ui/react-tooltip', version: '^1.1.4', description: 'Accessible tooltips', category: 'Radix UI' },
    { name: '@radix-ui/react-accordion', version: '^1.2.0', description: 'Accessible accordion component', category: 'Radix UI' },
    { name: '@radix-ui/react-collapsible', version: '^1.1.0', description: 'Accessible collapsible sections', category: 'Radix UI' },
    { name: '@radix-ui/react-switch', version: '^1.1.0', description: 'Accessible toggle switch', category: 'Radix UI' },
    { name: '@radix-ui/react-checkbox', version: '^1.1.4', description: 'Accessible checkbox', category: 'Radix UI' },
    { name: '@radix-ui/react-avatar', version: '^1.1.0', description: 'User avatar component', category: 'Radix UI' },
    { name: '@radix-ui/react-scroll-area', version: '^1.1.0', description: 'Custom scrollbar component', category: 'Radix UI' },
    { name: '@radix-ui/react-separator', version: '^1.1.0', description: 'Visual separator', category: 'Radix UI' },
    { name: '@radix-ui/react-slider', version: '^1.2.0', description: 'Accessible range slider', category: 'Radix UI' },
    { name: '@radix-ui/react-progress', version: '^1.1.0', description: 'Progress indicator', category: 'Radix UI' },
    { name: '@radix-ui/react-hover-card', version: '^1.1.1', description: 'Hover-triggered card', category: 'Radix UI' },
    { name: '@radix-ui/react-context-menu', version: '^2.2.1', description: 'Right-click context menu', category: 'Radix UI' },
    { name: '@radix-ui/react-alert-dialog', version: '^1.1.1', description: 'Confirmation dialogs', category: 'Radix UI' },
    
    // Forms
    { name: 'react-hook-form', version: '^7.53.0', description: 'Form state management and validation', category: 'Forms' },
    { name: '@hookform/resolvers', version: '^4.1.3', description: 'Form validation resolvers (Zod integration)', category: 'Forms' },
    { name: 'zod', version: '^3.23.8', description: 'TypeScript-first schema validation', category: 'Forms' },
    
    // Data Visualization
    { name: 'recharts', version: '^2.12.7', description: 'React charting library for analytics', category: 'Data Viz' },
    
    // Date/Time
    { name: 'date-fns', version: '^4.1.0', description: 'Date manipulation and formatting', category: 'Utilities' },
    { name: 'react-day-picker', version: '^8.10.1', description: 'Date picker component', category: 'Utilities' },
    
    // Theming
    { name: 'next-themes', version: '^0.3.0', description: 'Dark/light theme management', category: 'Theming' },
    
    // Content
    { name: 'react-markdown', version: '^10.1.0', description: 'Markdown rendering for chat messages', category: 'Content' },
    
    // Drag & Drop
    { name: '@dnd-kit/core', version: '^6.3.1', description: 'Drag and drop functionality', category: 'Interactions' },
    { name: '@dnd-kit/sortable', version: '^10.0.0', description: 'Sortable lists with drag and drop', category: 'Interactions' },
    
    // Layout
    { name: 'react-resizable-panels', version: '^2.1.3', description: 'Resizable panel layouts', category: 'Layout' },
    { name: 'vaul', version: '^0.9.3', description: 'Drawer/sheet component', category: 'Layout' },
    { name: 'embla-carousel-react', version: '^8.3.0', description: 'Carousel/slider component', category: 'Layout' },
    
    // Notifications
    { name: 'sonner', version: '^1.5.0', description: 'Toast notification system', category: 'Notifications' },
    
    // PDF
    { name: 'jspdf', version: 'latest', description: 'PDF generation library', category: 'Export' },
    { name: 'html2canvas', version: 'latest', description: 'HTML to canvas conversion for PDF export', category: 'Export' },
    
    // Utilities
    { name: 'cmdk', version: '^1.0.0', description: 'Command palette component', category: 'Utilities' },
    { name: 'input-otp', version: '^1.2.4', description: 'OTP input component', category: 'Utilities' },
  ];
}

function getRoutes(): RouteDoc[] {
  return [
    // Public Routes
    { path: '/', page: '→ /dashboard', protected: false, adminOnly: false, description: 'Redirect to dashboard' },
    { path: '/auth', page: 'Auth', protected: false, adminOnly: false, description: 'Login and signup page' },
    { path: '/accept-invite', page: 'AcceptInvite', protected: false, adminOnly: false, description: 'Workspace invitation acceptance' },
    
    // Protected User Routes
    { path: '/dashboard', page: 'Dashboard', protected: true, adminOnly: false, description: 'Main dashboard with recent activity, spaces, and stats' },
    { path: '/chat', page: 'Chat', protected: true, adminOnly: false, description: 'AI chat interface with model/persona selection' },
    { path: '/files', page: 'Files', protected: true, adminOnly: false, description: 'File management with folders and categories' },
    { path: '/knowledge-base', page: 'KnowledgeBase', protected: true, adminOnly: false, description: 'Document upload and AI querying' },
    { path: '/settings', page: 'Settings', protected: true, adminOnly: false, description: 'User profile and preferences' },
    { path: '/billing', page: 'Billing', protected: true, adminOnly: false, description: 'Usage, subscription, and billing management' },
    { path: '/workspace', page: 'Spaces', protected: true, adminOnly: false, description: 'Workspace list with favorites, all, archived tabs' },
    { path: '/workspace/:id', page: 'SpaceView', protected: true, adminOnly: false, description: 'Individual workspace with tabs (Overview, Chats, Files, Members, AI Config, Knowledge Base, Settings)' },
    { path: '/discover', page: 'Discover', protected: true, adminOnly: false, description: 'Template discovery for Spaces, Prompts, Personas' },
    
    // Admin Routes
    { path: '/admin/analytics', page: 'AdminAnalytics', protected: true, adminOnly: true, description: 'Platform analytics dashboard' },
    { path: '/admin/users', page: 'AdminUsers', protected: true, adminOnly: true, description: 'User management' },
    { path: '/admin/usage', page: 'AdminUsage', protected: true, adminOnly: true, description: 'Usage monitoring and quotas' },
    { path: '/admin/config', page: 'AdminConfig', protected: true, adminOnly: true, description: 'System configuration' },
    { path: '/admin/models', page: 'AdminModels', protected: true, adminOnly: true, description: 'AI model management' },
    { path: '/admin/prompts', page: 'AdminPrompts', protected: true, adminOnly: true, description: 'Prompt template management' },
    { path: '/admin/personas', page: 'AdminPersonas', protected: true, adminOnly: true, description: 'Persona template management' },
    { path: '/admin/spaces', page: 'AdminSpaces', protected: true, adminOnly: true, description: 'Workspace administration' },
    { path: '/admin/billing', page: 'AdminBilling', protected: true, adminOnly: true, description: 'Subscription tiers, payments, discounts' },
    { path: '/admin/email', page: 'AdminEmail', protected: true, adminOnly: true, description: 'Email providers, templates, rules' },
    { path: '/admin/email-logs', page: 'AdminEmailLogs', protected: true, adminOnly: true, description: 'Email sending logs' },
    { path: '/admin/files', page: 'AdminFiles', protected: true, adminOnly: true, description: 'Storage quotas management' },
    { path: '/admin/docs', page: 'AdminDocs', protected: true, adminOnly: true, description: 'Application documentation' },
    
    // Catch-all
    { path: '*', page: 'NotFound', protected: false, adminOnly: false, description: '404 page' },
  ];
}

function getContexts(): ContextDoc[] {
  return [
    {
      name: 'AuthContext',
      path: 'src/contexts/AuthContext.tsx',
      description: 'Manages user authentication state, session persistence, and inactivity timeout (20 min). Handles login, logout, signup, and session refresh.',
      provides: ['user', 'session', 'isLoading', 'signIn', 'signOut', 'signUp'],
    },
    {
      name: 'ChatContext',
      path: 'src/contexts/ChatContext.tsx',
      description: 'Manages chat state including selected AI model, selected persona, and pending prompt from sidebar. Fetches default model from system settings.',
      provides: ['selectedModel', 'setSelectedModel', 'selectedPersona', 'setSelectedPersona', 'pendingPrompt', 'setPendingPrompt', 'currentSpace', 'setCurrentSpace'],
    },
    {
      name: 'MarketContext',
      path: 'src/contexts/MarketContext.tsx',
      description: 'Manages market/region context for localization and regional features.',
      provides: ['market', 'setMarket'],
    },
  ];
}
