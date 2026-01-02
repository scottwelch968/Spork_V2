#!/bin/bash
# =====================================================
# SPORK EDGE FUNCTION DEPLOYMENT SCRIPT
# =====================================================
# Usage:
#   ./scripts/deploy-edge-functions.sh --all              Deploy all functions
#   ./scripts/deploy-edge-functions.sh chat generate-image Deploy specific functions
#   ./scripts/deploy-edge-functions.sh --list             List all functions
#   ./scripts/deploy-edge-functions.sh --verify           Verify secrets before deploy
# =====================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# All 64 edge functions
FUNCTIONS=(
  "accept-workspace-invitation"
  "admin-content"
  "admin-data"
  "billing-webhooks"
  "bootstrap-admin"
  "chat-messages"
  "chat"
  "check-file-quota"
  "check-quota"
  "cleanup-expired-images"
  "cleanup-files"
  "cleanup-orphaned-files"
  "codesandbox-create"
  "cosmo-agent"
  "cosmo-enqueue"
  "cosmo-queue-processor"
  "cosmo-task"
  "cosmo-webhook"
  "create-user"
  "enhance-prompt"
  "export-database"
  "external-integration-call"
  "external-integration-status"
  "external-oauth-callback"
  "external-oauth-init"
  "file-operations"
  "folder-operations"
  "generate-docs"
  "generate-image"
  "github-sync"
  "manage-email-provider"
  "manage-email-rule"
  "manage-email-template"
  "manage-subscription"
  "manage-system-user"
  "migrate-template-images"
  "persona-operations"
  "process-document"
  "process-system-event"
  "project-files"
  "prompt-operations"
  "purchase-credits"
  "query-knowledge-base"
  "report-test-results"
  "save-image-to-media"
  "save-response-to-file"
  "send-email"
  "send-workspace-invitation"
  "settings-operations"
  "space-content"
  "space-management"
  "space-operations"
  "spork-edit"
  "spork-tool-api"
  "supabase-sync"
  "sync-openrouter-models"
  "system-auth"
  "task-operations"
  "template-operations"
  "tool-operations"
  "track-usage"
  "update-user-password"
  "update-user"
)

# Required secrets for deployment
REQUIRED_SECRETS=(
  "OPENROUTER_API_KEY"
)

# Optional secrets (warnings only)
OPTIONAL_SECRETS=(
  "RESEND_API_KEY"
  "REPLICATE_API_KEY"
  "LOVABLE_API_KEY"
  "TEST_WEBHOOK_SECRET"
)

# Print header
print_header() {
  echo ""
  echo -e "${BLUE}=====================================================${NC}"
  echo -e "${BLUE}  SPORK Edge Function Deployment${NC}"
  echo -e "${BLUE}=====================================================${NC}"
  echo ""
}

# Print usage
print_usage() {
  echo "Usage: $0 [OPTIONS] [FUNCTIONS...]"
  echo ""
  echo "Options:"
  echo "  --all         Deploy all ${#FUNCTIONS[@]} edge functions"
  echo "  --list        List all available functions"
  echo "  --verify      Verify secrets are configured (no deployment)"
  echo "  --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --all                        # Deploy all functions"
  echo "  $0 chat generate-image          # Deploy specific functions"
  echo "  $0 --verify                     # Check secrets before deploy"
  echo ""
}

# List all functions
list_functions() {
  echo -e "${BLUE}Available Edge Functions (${#FUNCTIONS[@]} total):${NC}"
  echo ""
  local count=1
  for fn in "${FUNCTIONS[@]}"; do
    printf "%3d. %s\n" $count "$fn"
    ((count++))
  done
  echo ""
}

# Verify a single secret exists
verify_secret() {
  local secret_name=$1
  local result=$(supabase secrets list 2>/dev/null | grep -c "$secret_name" || echo "0")
  if [ "$result" -gt 0 ]; then
    return 0
  else
    return 1
  fi
}

# Verify all secrets
verify_secrets() {
  echo -e "${BLUE}Verifying Supabase Secrets...${NC}"
  echo ""
  
  local missing_required=0
  local missing_optional=0
  
  echo "Required Secrets:"
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if verify_secret "$secret"; then
      echo -e "  ${GREEN}✓${NC} $secret"
    else
      echo -e "  ${RED}✗${NC} $secret (MISSING - REQUIRED)"
      ((missing_required++))
    fi
  done
  
  echo ""
  echo "Optional Secrets:"
  for secret in "${OPTIONAL_SECRETS[@]}"; do
    if verify_secret "$secret"; then
      echo -e "  ${GREEN}✓${NC} $secret"
    else
      echo -e "  ${YELLOW}○${NC} $secret (not set)"
      ((missing_optional++))
    fi
  done
  
  echo ""
  
  if [ $missing_required -gt 0 ]; then
    echo -e "${RED}ERROR: $missing_required required secret(s) missing!${NC}"
    echo ""
    echo "Set missing secrets with:"
    echo "  supabase secrets set SECRET_NAME=value"
    echo ""
    return 1
  fi
  
  if [ $missing_optional -gt 0 ]; then
    echo -e "${YELLOW}WARNING: $missing_optional optional secret(s) not set.${NC}"
    echo "Some features may not work without these secrets."
  fi
  
  echo -e "${GREEN}Secret verification passed!${NC}"
  return 0
}

# Deploy a single function
deploy_function() {
  local fn=$1
  echo -e "${BLUE}Deploying:${NC} $fn"
  
  if supabase functions deploy "$fn" --no-verify-jwt 2>&1; then
    echo -e "${GREEN}  ✓ Success${NC}"
    return 0
  else
    echo -e "${RED}  ✗ Failed${NC}"
    return 1
  fi
}

# Deploy multiple functions
deploy_functions() {
  local functions_to_deploy=("$@")
  local total=${#functions_to_deploy[@]}
  local success=0
  local failed=0
  
  echo -e "${BLUE}Deploying $total function(s)...${NC}"
  echo ""
  
  for fn in "${functions_to_deploy[@]}"; do
    if deploy_function "$fn"; then
      ((success++))
    else
      ((failed++))
    fi
  done
  
  echo ""
  echo -e "${BLUE}=====================================================${NC}"
  echo -e "Deployment Complete"
  echo -e "  ${GREEN}Success:${NC} $success"
  echo -e "  ${RED}Failed:${NC}  $failed"
  echo -e "${BLUE}=====================================================${NC}"
  
  if [ $failed -gt 0 ]; then
    return 1
  fi
  return 0
}

# Check if function exists in list
function_exists() {
  local fn=$1
  for valid_fn in "${FUNCTIONS[@]}"; do
    if [ "$valid_fn" == "$fn" ]; then
      return 0
    fi
  done
  return 1
}

# Main script
main() {
  print_header
  
  # Check for Supabase CLI
  if ! command -v supabase &> /dev/null; then
    echo -e "${RED}ERROR: Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
  fi
  
  # Parse arguments
  if [ $# -eq 0 ]; then
    print_usage
    exit 0
  fi
  
  case "$1" in
    --help|-h)
      print_usage
      exit 0
      ;;
    --list|-l)
      list_functions
      exit 0
      ;;
    --verify|-v)
      verify_secrets
      exit $?
      ;;
    --all|-a)
      echo "Verifying secrets before deployment..."
      if ! verify_secrets; then
        echo ""
        echo -e "${RED}Aborting deployment due to missing secrets.${NC}"
        exit 1
      fi
      echo ""
      deploy_functions "${FUNCTIONS[@]}"
      exit $?
      ;;
    *)
      # Deploy specific functions
      local selected_functions=()
      for fn in "$@"; do
        if function_exists "$fn"; then
          selected_functions+=("$fn")
        else
          echo -e "${RED}ERROR: Unknown function '$fn'${NC}"
          echo "Use --list to see available functions"
          exit 1
        fi
      done
      
      if [ ${#selected_functions[@]} -eq 0 ]; then
        echo -e "${RED}ERROR: No valid functions specified${NC}"
        exit 1
      fi
      
      deploy_functions "${selected_functions[@]}"
      exit $?
      ;;
  esac
}

main "$@"
