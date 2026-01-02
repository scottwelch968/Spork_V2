import type { SchemaData, EdgeFunctionInfo, SecretInfo } from '@/hooks/useBackendDocs';

export function generateDatabaseSchemaMarkdown(data: SchemaData): string {
  let md = '# Database Schema\n\n';
  md += `> Generated at: ${new Date(data.generated_at).toLocaleString()}\n\n`;

  // Enums Section
  if (data.enums.length > 0) {
    md += '## Enums\n\n```sql\n';
    data.enums.forEach(e => {
      md += `CREATE TYPE public.${e.name} AS ENUM (\n`;
      md += e.values.map(v => `  '${v}'`).join(',\n');
      md += '\n);\n\n';
    });
    md += '```\n\n';
  }

  // Storage Buckets Section
  if (data.storage_buckets.length > 0) {
    md += '## Storage Buckets\n\n';
    md += '| Bucket Name | Public |\n|-------------|--------|\n';
    data.storage_buckets.forEach(b => {
      md += `| ${b.name} | ${b.is_public ? 'Yes' : 'No'} |\n`;
    });
    md += '\n';
  }

  // Database Functions Section
  if (data.functions.length > 0) {
    md += '## Database Functions\n\n';
    md += '| Function Name | Return Type | Language |\n|---------------|-------------|----------|\n';
    data.functions.forEach(f => {
      md += `| ${f.name} | ${f.return_type} | ${f.language} |\n`;
    });
    md += '\n';
  }

  // Tables Section
  md += '## Tables\n\n';
  data.tables.forEach(table => {
    md += `### ${table.name}\n\n`;
    
    // RLS Status
    md += `**RLS Enabled:** ${table.rls_enabled ? 'Yes ✓' : 'No ✗'}\n\n`;
    
    // Columns
    md += '#### Columns\n\n';
    md += '| Column | Type | Nullable | Default |\n|--------|------|----------|--------|\n';
    table.columns.forEach(col => {
      const defaultVal = col.default_value 
        ? col.default_value.length > 40 
          ? col.default_value.substring(0, 37) + '...'
          : col.default_value
        : '-';
      md += `| ${col.name} | ${col.type} | ${col.nullable ? 'Yes' : 'No'} | ${defaultVal} |\n`;
    });
    md += '\n';

    // Foreign Keys
    if (table.foreign_keys.length > 0) {
      md += '#### Foreign Keys\n\n';
      md += '| Column | References |\n|--------|------------|\n';
      table.foreign_keys.forEach(fk => {
        md += `| ${fk.column} | ${fk.references_table}.${fk.references_column} |\n`;
      });
      md += '\n';
    }

    // RLS Policies
    if (table.rls_policies.length > 0) {
      md += '#### RLS Policies\n\n';
      table.rls_policies.forEach(policy => {
        md += `**${policy.name}** (${policy.command})\n`;
        if (policy.using_expression) {
          md += `- USING: \`${policy.using_expression.substring(0, 100)}${policy.using_expression.length > 100 ? '...' : ''}\`\n`;
        }
        if (policy.with_check_expression) {
          md += `- WITH CHECK: \`${policy.with_check_expression.substring(0, 100)}${policy.with_check_expression.length > 100 ? '...' : ''}\`\n`;
        }
        md += '\n';
      });
    }

    md += '---\n\n';
  });

  return md;
}

export function generateEdgeFunctionsMarkdown(functions: EdgeFunctionInfo[]): string {
  let md = '# Edge Functions\n\n';
  md += `> Total: ${functions.length} functions\n\n`;
  
  md += '| Function Name | JWT Required |\n|---------------|-------------|\n';
  functions.forEach(fn => {
    md += `| ${fn.name} | ${fn.verify_jwt ? 'Yes' : 'No'} |\n`;
  });
  md += '\n';

  md += '## Function Details\n\n';
  functions.forEach(fn => {
    md += `### ${fn.name}\n\n`;
    md += `- **Endpoint:** \`/functions/v1/${fn.name}\`\n`;
    md += `- **JWT Verification:** ${fn.verify_jwt ? 'Required' : 'Not required (public)'}\n\n`;
  });

  return md;
}

export function generateSecretsMarkdown(secrets: SecretInfo[]): string {
  let md = '# Required Secrets\n\n';
  md += 'These environment variables must be configured for the application to function properly.\n\n';
  
  md += '| Secret Name | Status |\n|-------------|--------|\n';
  secrets.forEach(s => {
    md += `| ${s.name} | ${s.is_configured ? '✓ Configured' : '✗ Missing'} |\n`;
  });
  md += '\n';

  md += '## Secret Descriptions\n\n';
  
  const descriptions: Record<string, string> = {
    'OPENROUTER_API_KEY': 'API key for OpenRouter AI model access',
    'RESEND_API_KEY': 'API key for Resend email service',
    'LOVABLE_API_KEY': 'API key for Lovable AI Gateway (fallback models)',
    'SUPABASE_URL': 'Supabase project URL',
    'SUPABASE_ANON_KEY': 'Supabase anonymous/public key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (admin access)',
    'SUPABASE_PUBLISHABLE_KEY': 'Supabase publishable key',
    'REPLICATE_API_KEY': 'API key for Replicate AI services',
    'SUPABASE_DB_URL': 'Direct PostgreSQL database connection URL',
  };

  secrets.forEach(s => {
    md += `### ${s.name}\n\n`;
    md += `${descriptions[s.name] || 'No description available'}\n\n`;
  });

  return md;
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
