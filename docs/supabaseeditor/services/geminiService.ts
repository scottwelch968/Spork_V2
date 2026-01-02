import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { SupabaseCredentials } from "../types";
import { supabaseService } from "./supabaseService";
import { authClient } from "./authClient";
import { storageClient } from "./storageClient";
import { realtimeService } from "./realtimeService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---

// 1. Edge Functions
const listFunctionsTool: FunctionDeclaration = {
  name: 'list_edge_functions',
  description: 'List all deployed Supabase Edge Functions.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const deployFunctionTool: FunctionDeclaration = {
  name: 'deploy_edge_function',
  description: 'Create or update a Supabase Edge Function. Requires valid Deno/TypeScript code.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Name of the function" },
        slug: { type: Type.STRING, description: "URL slug for the function" },
        verify_jwt: { type: Type.BOOLEAN, description: "Whether to verify JWT (default true)" },
        body: { type: Type.STRING, description: "The Deno source code" }
    },
    required: ['name', 'slug', 'body']
  }
};

const deleteFunctionTool: FunctionDeclaration = {
  name: 'delete_edge_function',
  description: 'Delete an Edge Function by its slug.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        slug: { type: Type.STRING, description: "The function slug to delete" }
    },
    required: ['slug']
  }
};

// 2. Auth Config & Users
const getAuthConfigTool: FunctionDeclaration = {
  name: 'get_auth_config',
  description: 'Get current Auth configuration (providers, email settings).',
  parameters: { type: Type.OBJECT, properties: {} }
};

const updateAuthConfigTool: FunctionDeclaration = {
  name: 'update_auth_config',
  description: 'Update Auth configuration settings.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        external_google_enabled: { type: Type.BOOLEAN },
        external_github_enabled: { type: Type.BOOLEAN },
        disable_signup: { type: Type.BOOLEAN },
        site_url: { type: Type.STRING }
    }
  }
};

const listUsersTool: FunctionDeclaration = {
  name: 'list_users',
  description: 'List recent users.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        limit: { type: Type.NUMBER }
    }
  }
};

const inviteUserTool: FunctionDeclaration = {
  name: 'invite_user',
  description: 'Invite a new user by email.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        email: { type: Type.STRING }
    },
    required: ['email']
  }
};

const deleteUserTool: FunctionDeclaration = {
  name: 'delete_user',
  description: 'Delete a user by their User ID (UUID).',
  parameters: {
    type: Type.OBJECT,
    properties: {
        userId: { type: Type.STRING }
    },
    required: ['userId']
  }
};

// 3. Database
const executeSqlTool: FunctionDeclaration = {
  name: 'execute_sql',
  description: 'Execute SQL query. Can perform SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE, etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        query: { type: Type.STRING, description: "The SQL statement to execute." }
    },
    required: ['query']
  }
};

const getTableSchemaTool: FunctionDeclaration = {
  name: 'get_table_schema',
  description: 'Get column details (name, type, nullable) for a specific table. Use this before INSERT/UPDATE to ensure correctness.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        tableName: { type: Type.STRING }
    },
    required: ['tableName']
  }
};

const getTableConstraintsTool: FunctionDeclaration = {
  name: 'get_table_constraints',
  description: 'Get Foreign Keys, Primary Keys, and Unique constraints for a table. Essential for understanding relationships.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        tableName: { type: Type.STRING }
    },
    required: ['tableName']
  }
};

const getRlsPoliciesTool: FunctionDeclaration = {
  name: 'get_rls_policies',
  description: 'List Row Level Security (RLS) policies for a specific table or all tables.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        tableName: { type: Type.STRING, description: "Optional. If omitted, lists policies for all tables." }
    }
  }
};

// 4. Storage
const listBucketsTool: FunctionDeclaration = {
  name: 'list_buckets',
  description: 'List all storage buckets.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const createBucketTool: FunctionDeclaration = {
  name: 'create_bucket',
  description: 'Create a new storage bucket.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        public: { type: Type.BOOLEAN, description: "Is the bucket public?" }
    },
    required: ['name']
  }
};

const updateBucketTool: FunctionDeclaration = {
  name: 'update_bucket',
  description: 'Update a storage bucket properties (e.g. make public/private).',
  parameters: {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "The bucket ID" },
        public: { type: Type.BOOLEAN }
    },
    required: ['id', 'public']
  }
};

const deleteBucketTool: FunctionDeclaration = {
  name: 'delete_bucket',
  description: 'Delete a storage bucket by ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "The bucket ID" }
    },
    required: ['id']
  }
};

const listFilesTool: FunctionDeclaration = {
  name: 'list_files',
  description: 'List files in a storage bucket.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        bucketName: { type: Type.STRING },
        path: { type: Type.STRING, description: "Optional folder path (default root)" }
    },
    required: ['bucketName']
  }
};

const uploadFileTool: FunctionDeclaration = {
  name: 'upload_file',
  description: 'Upload a text file (config, code, html) to a storage bucket.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        bucketName: { type: Type.STRING },
        fileName: { type: Type.STRING, description: "Full path/name of the file (e.g. 'folder/script.js')" },
        content: { type: Type.STRING, description: "The text content of the file." },
        contentType: { type: Type.STRING, description: "MIME type (default text/plain)" }
    },
    required: ['bucketName', 'fileName', 'content']
  }
};

const deleteFileTool: FunctionDeclaration = {
  name: 'delete_file',
  description: 'Delete a specific file from a bucket.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        bucketName: { type: Type.STRING },
        fileName: { type: Type.STRING, description: "Full path/name of the file" }
    },
    required: ['bucketName', 'fileName']
  }
};

// 5. Realtime
const sendBroadcastTool: FunctionDeclaration = {
  name: 'send_broadcast',
  description: 'Send a Realtime broadcast message to a specific channel.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        channel: { type: Type.STRING, description: "Channel name (e.g. 'room-1')" },
        event: { type: Type.STRING, description: "Event name (e.g. 'notification')" },
        payload: { type: Type.STRING, description: "JSON string of the message payload" }
    },
    required: ['channel', 'event', 'payload']
  }
};

const allTools = [
    listFunctionsTool, deployFunctionTool, deleteFunctionTool,
    getAuthConfigTool, updateAuthConfigTool,
    listUsersTool, inviteUserTool, deleteUserTool,
    executeSqlTool, getTableSchemaTool, getTableConstraintsTool, getRlsPoliciesTool,
    listBucketsTool, createBucketTool, updateBucketTool, deleteBucketTool, 
    listFilesTool, uploadFileTool, deleteFileTool,
    sendBroadcastTool
];

// --- Service ---

export const geminiService = {
  async askAssistant(prompt: string, creds: SupabaseCredentials, context?: string): Promise<string> {
    try {
      // Using Pro model for complex reasoning and tool use
      const modelId = 'gemini-3-pro-preview';
      const model = ai.models;
      
      const chatContext = `
        Context: You are "Antigravity Bridge", an expert Admin AI for Supabase.
        Project Ref: ${creds.projectRef}
        Current Page: ${context || 'General'}
        
        Capabilities:
        - **Database**: Run SQL, View Schemas, Inspect Constraints (FKs), Inspect RLS Policies. Supports creating tables with constraints.
        - **Functions**: Deploy, Update, Delete Edge Functions.
        - **Auth**: Manage Users, Configure Providers.
        - **Storage**: Manage Buckets, List Files, Upload Text Files, Delete Files.
        - **Realtime**: Enable tables via SQL, Send Broadcast messages.
        
        Instructions:
        - Use 'execute_sql' for robust database tasks.
        - Use 'get_table_constraints' to understand relationships before writing JOIN queries.
        - Use 'get_rls_policies' to audit security before modifying tables.
        - When creating tables, always consider adding appropriate data constraints (PK, FK, UNIQUE, CHECK) for data integrity.
        - You can enable extensions (like vector, pg_cron) using 'execute_sql' with 'CREATE EXTENSION IF NOT EXISTS ...'.
        - Use 'upload_file' to create configuration or script files in storage.
        - Use 'send_broadcast' to trigger Realtime events.
        - Be concise.
      `;

      // 1. Initial Request
      const result = await model.generateContent({
        model: modelId,
        contents: `${chatContext}\nUser Query: ${prompt}`,
        config: {
          tools: [{ functionDeclarations: allTools }],
        }
      });

      const response = result;
      const functionCalls = response.functionCalls;

      // 2. Return text if no tools called
      if (!functionCalls || functionCalls.length === 0) {
          return response.text || "I couldn't process that request.";
      }

      // 3. Execute Tools
      const functionResponses = [];
      
      // Initialize clients with current creds
      if (!authClient.isInitialized()) authClient.init(creds);
      if (!storageClient.isInitialized()) storageClient.init(creds);

      for (const call of functionCalls) {
          let toolResult: any = { error: "Unknown tool" };
          const args = call.args as any;
          
          try {
              console.log(`Executing tool: ${call.name}`, args);

              // --- Functions ---
              if (call.name === 'list_edge_functions') {
                  toolResult = await supabaseService.listFunctions(creds);
              } else if (call.name === 'deploy_edge_function') {
                  try {
                      await supabaseService.getFunction(creds, args.slug);
                      toolResult = await supabaseService.updateFunction(creds, args.slug, {
                          name: args.name,
                          verify_jwt: args.verify_jwt,
                          body: args.body
                      });
                      toolResult = { message: "Function updated successfully", details: toolResult };
                  } catch (e) {
                      toolResult = await supabaseService.createFunction(creds, args);
                      toolResult = { message: "Function created successfully", details: toolResult };
                  }
              } else if (call.name === 'delete_edge_function') {
                  await supabaseService.deleteFunction(creds, args.slug);
                  toolResult = { success: true, message: `Function ${args.slug} deleted.` };
              }
              
              // --- Auth ---
              else if (call.name === 'get_auth_config') {
                  toolResult = await supabaseService.getAuthConfig(creds);
              } else if (call.name === 'update_auth_config') {
                  toolResult = await supabaseService.updateAuthConfig(creds, args);
              } else if (call.name === 'list_users') {
                  toolResult = await authClient.listUsers(1, args.limit || 10);
              } else if (call.name === 'invite_user') {
                  toolResult = await authClient.inviteUser(args.email);
              } else if (call.name === 'delete_user') {
                  await authClient.deleteUser(args.userId);
                  toolResult = { success: true, message: "User deleted." };
              }

              // --- Database ---
              else if (call.name === 'execute_sql') {
                  toolResult = await supabaseService.executeSql(creds, args.query);
                  if (Array.isArray(toolResult) && toolResult.length === 0) {
                      toolResult = { message: "Query executed successfully. No rows returned." };
                  }
              } else if (call.name === 'get_table_schema') {
                  // SQL to fetch schema info
                  const query = `
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = '${args.tableName}';
                  `;
                  toolResult = await supabaseService.executeSql(creds, query);
              } else if (call.name === 'get_table_constraints') {
                  const query = `
                    SELECT conname as constraint_name, contype as constraint_type, pg_get_constraintdef(oid) as definition
                    FROM pg_constraint
                    WHERE conrelid = 'public.${args.tableName}'::regclass;
                  `;
                  toolResult = await supabaseService.executeSql(creds, query);
              } else if (call.name === 'get_rls_policies') {
                  let query = `
                    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
                    FROM pg_policies
                  `;
                  if (args.tableName) {
                      query += ` WHERE tablename = '${args.tableName}'`;
                  }
                  toolResult = await supabaseService.executeSql(creds, query);
              }

              // --- Storage ---
              else if (call.name === 'list_buckets') {
                  toolResult = await storageClient.listBuckets();
              } else if (call.name === 'create_bucket') {
                  toolResult = await storageClient.createBucket(args.name, args.public);
              } else if (call.name === 'update_bucket') {
                  toolResult = await storageClient.updateBucket(args.id, args.public);
              } else if (call.name === 'delete_bucket') {
                  await storageClient.deleteBucket(args.id);
                  toolResult = { success: true, message: "Bucket deleted." };
              } else if (call.name === 'list_files') {
                  toolResult = await storageClient.listFiles(args.bucketName, args.path || '');
              } else if (call.name === 'upload_file') {
                  toolResult = await storageClient.uploadFileText(args.bucketName, args.fileName, args.content, args.contentType);
              } else if (call.name === 'delete_file') {
                  await storageClient.deleteFile(args.bucketName, args.fileName);
                  toolResult = { success: true, message: `File ${args.fileName} deleted.` };
              }

              // --- Realtime ---
              else if (call.name === 'send_broadcast') {
                  let payload = {};
                  try { payload = JSON.parse(args.payload); } catch(e) { payload = { text: args.payload }; }
                  toolResult = await realtimeService.sendBroadcast(creds, args.channel, args.event, payload);
              }

          } catch (e: any) {
              console.error(`Tool error (${call.name}):`, e);
              toolResult = { error: e.message || "Action failed." };
          }

          functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result: toolResult }
          });
      }

      // 4. Send Results back to AI
      const finalResult = await model.generateContent({
          model: modelId,
          contents: [
              { role: 'user', parts: [{ text: `${chatContext}\nUser Query: ${prompt}` }] },
              { role: 'model', parts: result.candidates![0].content.parts },
              { role: 'user', parts: functionResponses.map(r => ({ functionResponse: r })) }
          ]
      });

      return finalResult.text || "Action completed.";

    } catch (error) {
      console.error("Gemini Error:", error);
      return "I encountered a critical error communicating with the AI service.";
    }
  },

  // Helper generators
  async generateSql(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            // Upgrade to Pro for better SQL generation
            model: 'gemini-3-pro-preview',
            contents: `Generate valid PostgreSQL SQL code. Return ONLY raw SQL.\nRequest: ${prompt}`,
        });
        let text = response.text?.trim() || "";
        text = text.replace(/^```sql\n?/, '').replace(/```$/, '');
        return text;
    } catch (error) { return "-- Error generating SQL"; }
  },

  async generateFunctionCode(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            // Upgrade to Pro for better Code generation
            model: 'gemini-3-pro-preview',
            contents: `Write a Supabase Edge Function (Deno/TypeScript) for: ${prompt}. Return ONLY raw code.`,
        });
        let text = response.text?.trim() || "";
        text = text.replace(/^```typescript\n?/, '').replace(/^```ts\n?/, '').replace(/```$/, '');
        return text;
    } catch (error) { return "// Error generating code."; }
  },

  async generateRealtimeCode(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
             // Upgrade to Pro for better Code generation
            model: 'gemini-3-pro-preview',
            contents: `Write Supabase Realtime client code (JS/v2) for: ${prompt}. Return ONLY raw code.`,
        });
        let text = response.text?.trim() || "";
        text = text.replace(/^```javascript\n?/, '').replace(/^```js\n?/, '').replace(/```$/, '');
        return text;
    } catch (error) { return "// Error generating code."; }
  }
};