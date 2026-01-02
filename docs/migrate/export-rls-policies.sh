#!/bin/bash
# =============================================================================
# Spork RLS Policy Export Script
# =============================================================================
# Exports all Row-Level Security policies from the Supabase database
# Usage: ./scripts/export-rls-policies.sh [OPTIONS]
#
# Options:
#   --by-table      Export to separate files per table
#   --single-file   Export to single comprehensive file (default)
#   --json          Export as JSON format
#   --verify        Also run verification after export
#   --help          Show this help message
# =============================================================================

set -e

# Configuration
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-mfoeucdqopqivjzenlrt}"
SUPABASE_URL="${SUPABASE_URL:-https://${SUPABASE_PROJECT_ID}.supabase.co}"
OUTPUT_DIR="./exports/rls"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
EXPORT_MODE="single-file"
OUTPUT_FORMAT="sql"
RUN_VERIFY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --by-table)
            EXPORT_MODE="by-table"
            shift
            ;;
        --single-file)
            EXPORT_MODE="single-file"
            shift
            ;;
        --json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --verify)
            RUN_VERIFY=true
            shift
            ;;
        --help)
            echo "Usage: ./scripts/export-rls-policies.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --by-table      Export to separate files per table"
            echo "  --single-file   Export to single comprehensive file (default)"
            echo "  --json          Export as JSON format"
            echo "  --verify        Also run verification after export"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Spork RLS Policy Export Tool${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Export Mode:${NC} $EXPORT_MODE"
echo -e "${YELLOW}Output Format:${NC} $OUTPUT_FORMAT"
echo -e "${YELLOW}Output Directory:${NC} $OUTPUT_DIR"
echo ""

# Function to call export-database edge function
export_via_edge_function() {
    echo -e "${BLUE}Calling export-database edge function...${NC}"
    
    local response=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/export-database" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -d '{"action": "list-rls-policies"}')
    
    echo "$response"
}

# Function to generate SQL from policies
generate_sql_header() {
    cat << 'EOF'
-- =============================================================================
-- Spork RLS Policy Migration Script
-- =============================================================================
-- Generated: $(date)
-- Project: Spork AI Platform
-- 
-- This script contains all Row-Level Security policies for the Spork database.
-- Run this script to apply RLS policies to a new or migrated database.
--
-- Prerequisites:
-- 1. All tables must exist before running this script
-- 2. Security definer functions must be created first (see apply-rls-policies.sql)
-- 3. User roles table and has_role function must exist
-- =============================================================================

-- Ensure we're in the public schema
SET search_path TO public;

EOF
}

# Tables that require RLS (from manifest)
TABLES=(
    "activity_log"
    "admin_documentation"
    "ai_methodology_docs"
    "ai_models"
    "ai_prompt_library"
    "app_item_integrations"
    "budget_alerts"
    "chat_actors"
    "chat_containers"
    "chat_folders"
    "chat_functions"
    "chats"
    "cleanup_job_results"
    "cosmo_action_mappings"
    "cosmo_cost_tracking"
    "cosmo_debug_logs"
    "cosmo_function_chains"
    "cosmo_intents"
    "cosmo_request_batches"
    "cosmo_request_queue"
    "credit_packages"
    "credit_purchases"
    "discount_codes"
    "email_logs"
    "email_providers"
    "email_rule_logs"
    "email_rules"
    "email_system_event_types"
    "email_templates"
    "external_providers"
    "fallback_models"
    "file_folders"
    "folders"
    "generated_content"
    "integration_usage_log"
    "knowledge_base"
    "messages"
    "oauth_states"
    "payment_processors"
    "persona_categories"
    "persona_templates"
    "personas"
    "pricing_tiers"
    "profiles"
    "project_analysis_reports"
    "prompt_templates"
    "prompts"
    "space_chat_messages"
    "space_chats"
    "space_personas"
    "space_prompts"
    "spork_projects"
    "spork_tool_categories"
    "spork_tool_installations"
    "spork_tools"
    "system_audit_log"
    "system_settings"
    "system_user_sessions"
    "system_users"
    "usage_stats"
    "user_integrations"
    "user_roles"
    "user_settings"
    "user_space_assignments"
    "user_subscriptions"
    "workspace_activity"
    "workspace_files"
    "workspace_integrations"
    "workspace_invitations"
    "workspace_members"
    "workspaces"
)

echo -e "${BLUE}Found ${#TABLES[@]} tables to process${NC}"
echo ""

if [ "$EXPORT_MODE" == "single-file" ]; then
    OUTPUT_FILE="${OUTPUT_DIR}/rls_policies_${TIMESTAMP}.sql"
    echo -e "${YELLOW}Exporting to: ${OUTPUT_FILE}${NC}"
    
    # Generate header
    generate_sql_header > "$OUTPUT_FILE"
    
    echo "-- Total tables: ${#TABLES[@]}" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo -e "${GREEN}✓ Export complete: ${OUTPUT_FILE}${NC}"
    
elif [ "$EXPORT_MODE" == "by-table" ]; then
    TABLE_DIR="${OUTPUT_DIR}/tables_${TIMESTAMP}"
    mkdir -p "$TABLE_DIR"
    
    echo -e "${YELLOW}Exporting to: ${TABLE_DIR}/${NC}"
    
    for table in "${TABLES[@]}"; do
        echo "-- RLS Policies for: ${table}" > "${TABLE_DIR}/${table}.sql"
        echo "-- Generated: $(date)" >> "${TABLE_DIR}/${table}.sql"
        echo "" >> "${TABLE_DIR}/${table}.sql"
        echo "ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;" >> "${TABLE_DIR}/${table}.sql"
        echo "" >> "${TABLE_DIR}/${table}.sql"
    done
    
    echo -e "${GREEN}✓ Export complete: ${TABLE_DIR}/${NC}"
fi

# Run verification if requested
if [ "$RUN_VERIFY" = true ]; then
    echo ""
    echo -e "${BLUE}Running verification...${NC}"
    ./scripts/verify-rls.sh
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Export Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review exported policies in ${OUTPUT_DIR}"
echo "  2. Run ./scripts/verify-rls.sh to verify policies"
echo "  3. Use apply-rls-policies.sql for migration"
echo ""
