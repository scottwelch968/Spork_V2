#!/bin/bash
# =====================================================
# SPORK SECRET VERIFICATION SCRIPT
# =====================================================
# Verifies all required and optional secrets are configured
# before deploying edge functions
# =====================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =====================================================
# SECRET DEFINITIONS
# =====================================================

# Required secrets - deployment will fail without these
declare -A REQUIRED_SECRETS=(
  ["OPENROUTER_API_KEY"]="Primary AI model access via OpenRouter. Required for chat functionality."
)

# Conditionally required - needed for specific features
declare -A FEATURE_SECRETS=(
  ["RESEND_API_KEY"]="Email sending via Resend. Required for: send-email, process-system-event, email rules."
  ["REPLICATE_API_KEY"]="Image/video generation via Replicate. Required for: generate-image (when not using DALL-E)."
)

# Optional secrets - enhance functionality
declare -A OPTIONAL_SECRETS=(
  ["LOVABLE_API_KEY"]="Lovable AI gateway fallback. Provides backup AI access if OpenRouter fails."
  ["TEST_WEBHOOK_SECRET"]="Webhook signature verification. Used in: billing-webhooks for testing."
)

# Auto-provided by Supabase (informational only)
declare -A AUTO_SECRETS=(
  ["SUPABASE_URL"]="Supabase project URL. Auto-configured by Supabase."
  ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase service role key. Auto-configured by Supabase."
  ["SUPABASE_ANON_KEY"]="Supabase anonymous key. Auto-configured by Supabase."
  ["SUPABASE_DB_URL"]="Database connection URL. Auto-configured by Supabase."
)

# =====================================================
# FUNCTION MAPPINGS
# =====================================================

# Map functions to their required secrets
declare -A FUNCTION_SECRETS=(
  # AI Functions
  ["chat"]="OPENROUTER_API_KEY"
  ["cosmo-agent"]="OPENROUTER_API_KEY"
  ["cosmo-queue-processor"]="OPENROUTER_API_KEY"
  ["enhance-prompt"]="OPENROUTER_API_KEY"
  ["generate-docs"]="OPENROUTER_API_KEY"
  ["query-knowledge-base"]="OPENROUTER_API_KEY"
  ["process-document"]="OPENROUTER_API_KEY"
  
  # Image Generation
  ["generate-image"]="REPLICATE_API_KEY"
  
  # Email Functions
  ["send-email"]="RESEND_API_KEY"
  ["process-system-event"]="RESEND_API_KEY"
  ["manage-email-provider"]="RESEND_API_KEY"
  ["manage-email-rule"]="RESEND_API_KEY"
  ["manage-email-template"]="RESEND_API_KEY"
  ["send-workspace-invitation"]="RESEND_API_KEY"
  
  # Billing
  ["billing-webhooks"]="TEST_WEBHOOK_SECRET"
)

# =====================================================
# HELPER FUNCTIONS
# =====================================================

print_header() {
  echo ""
  echo -e "${BLUE}=====================================================${NC}"
  echo -e "${BLUE}  SPORK Secret Verification${NC}"
  echo -e "${BLUE}=====================================================${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${CYAN}$1${NC}"
  echo "-----------------------------------------------------"
}

# Check if secret exists in Supabase
check_secret() {
  local secret_name=$1
  # Try to list secrets and grep for the name
  if supabase secrets list 2>/dev/null | grep -q "^$secret_name"; then
    return 0
  else
    return 1
  fi
}

# Verify secrets from an associative array
verify_secret_group() {
  local -n secrets=$1
  local group_name=$2
  local is_required=$3
  local missing=0
  
  for secret in "${!secrets[@]}"; do
    local description="${secrets[$secret]}"
    if check_secret "$secret"; then
      echo -e "  ${GREEN}✓${NC} $secret"
      echo -e "    ${CYAN}$description${NC}"
    else
      if [ "$is_required" = true ]; then
        echo -e "  ${RED}✗${NC} $secret ${RED}(MISSING - REQUIRED)${NC}"
        echo -e "    ${CYAN}$description${NC}"
        ((missing++))
      else
        echo -e "  ${YELLOW}○${NC} $secret ${YELLOW}(not set)${NC}"
        echo -e "    ${CYAN}$description${NC}"
      fi
    fi
  done
  
  return $missing
}

# =====================================================
# MAIN VERIFICATION
# =====================================================

main() {
  print_header
  
  # Check for Supabase CLI
  if ! command -v supabase &> /dev/null; then
    echo -e "${RED}ERROR: Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    echo ""
    echo "If already installed, ensure you're linked to your project:"
    echo "  supabase login"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
  fi
  
  local total_missing_required=0
  local total_missing_optional=0
  
  # Auto-provided secrets (informational)
  print_section "Auto-Provided Secrets (by Supabase)"
  echo -e "  ${BLUE}ℹ${NC} These are automatically configured:"
  for secret in "${!AUTO_SECRETS[@]}"; do
    echo -e "    • $secret"
  done
  
  # Required secrets
  print_section "Required Secrets"
  verify_secret_group REQUIRED_SECRETS "Required" true
  total_missing_required=$?
  
  # Feature-specific secrets
  print_section "Feature-Specific Secrets"
  verify_secret_group FEATURE_SECRETS "Feature" false
  total_missing_optional=$?
  
  # Optional secrets
  print_section "Optional Secrets"
  verify_secret_group OPTIONAL_SECRETS "Optional" false
  ((total_missing_optional+=$?))
  
  # Summary
  echo ""
  echo -e "${BLUE}=====================================================${NC}"
  echo -e "${BLUE}  Summary${NC}"
  echo -e "${BLUE}=====================================================${NC}"
  
  if [ $total_missing_required -gt 0 ]; then
    echo ""
    echo -e "${RED}FAIL: $total_missing_required required secret(s) missing!${NC}"
    echo ""
    echo "To set missing secrets:"
    echo -e "  ${CYAN}supabase secrets set SECRET_NAME=your_value${NC}"
    echo ""
    echo "Or set multiple:"
    echo -e "  ${CYAN}supabase secrets set OPENROUTER_API_KEY=sk-xxx RESEND_API_KEY=re_xxx${NC}"
    echo ""
    exit 1
  fi
  
  if [ $total_missing_optional -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}WARNING: $total_missing_optional optional secret(s) not configured.${NC}"
    echo "Some features may be limited without these secrets."
    echo ""
  fi
  
  echo -e "${GREEN}✓ All required secrets are configured!${NC}"
  echo ""
  echo "You can now deploy edge functions:"
  echo -e "  ${CYAN}./scripts/deploy-edge-functions.sh --all${NC}"
  echo ""
  
  exit 0
}

# Function-specific verification
verify_function_secrets() {
  local function_name=$1
  
  echo -e "${BLUE}Checking secrets for: $function_name${NC}"
  
  if [ -n "${FUNCTION_SECRETS[$function_name]}" ]; then
    local required_secret="${FUNCTION_SECRETS[$function_name]}"
    if check_secret "$required_secret"; then
      echo -e "  ${GREEN}✓${NC} $required_secret"
      return 0
    else
      echo -e "  ${RED}✗${NC} $required_secret (MISSING)"
      return 1
    fi
  else
    echo -e "  ${GREEN}✓${NC} No additional secrets required"
    return 0
  fi
}

# Parse arguments
case "${1:-}" in
  --function|-f)
    if [ -z "$2" ]; then
      echo "Usage: $0 --function FUNCTION_NAME"
      exit 1
    fi
    verify_function_secrets "$2"
    exit $?
    ;;
  --help|-h)
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  (no args)        Verify all secrets"
    echo "  --function NAME  Verify secrets for specific function"
    echo "  --help           Show this help"
    echo ""
    exit 0
    ;;
  *)
    main
    ;;
esac
