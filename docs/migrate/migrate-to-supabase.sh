#!/bin/bash
# =====================================================
# SPORK MIGRATION SCRIPT: Lovable to Supabase
# =====================================================
# This script automates the migration process from Lovable to Supabase
# Usage: ./docs/migrate/migrate-to-supabase.sh [OPTIONS]
#
# Options:
#   --skip-schema      Skip database schema (assumes already applied)
#   --skip-rls         Skip RLS policies
#   --skip-triggers    Skip triggers
#   --skip-storage     Skip storage buckets
#   --skip-seed        Skip seed data
#   --skip-functions   Skip edge functions
#   --verify-only      Only run verification, don't apply changes
#   --help             Show this help message
# =====================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATE_DIR="$SCRIPT_DIR"

# Options
SKIP_SCHEMA=false
SKIP_RLS=false
SKIP_TRIGGERS=false
SKIP_STORAGE=false
SKIP_SEED=false
SKIP_FUNCTIONS=false
VERIFY_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-schema)
            SKIP_SCHEMA=true
            shift
            ;;
        --skip-rls)
            SKIP_RLS=true
            shift
            ;;
        --skip-triggers)
            SKIP_TRIGGERS=true
            shift
            ;;
        --skip-storage)
            SKIP_STORAGE=true
            shift
            ;;
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        --skip-functions)
            SKIP_FUNCTIONS=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-schema      Skip database schema"
            echo "  --skip-rls         Skip RLS policies"
            echo "  --skip-triggers    Skip triggers"
            echo "  --skip-storage     Skip storage buckets"
            echo "  --skip-seed        Skip seed data"
            echo "  --skip-functions   Skip edge functions"
            echo "  --verify-only      Only run verification"
            echo "  --help             Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Helper functions
print_step() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking Prerequisites"
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed"
        print_info "Install with: npm install -g supabase"
        exit 1
    fi
    print_success "Supabase CLI is installed"
    
    # Check if SQL files exist
    local files=(
        "$MIGRATE_DIR/apply-rls-policies.sql"
        "$MIGRATE_DIR/apply-triggers.sql"
        "$MIGRATE_DIR/apply-storage-buckets.sql"
        "$MIGRATE_DIR/seed-system-data.sql"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file not found: $file"
            exit 1
        fi
    done
    print_success "All required SQL files found"
    
    # Check if verification scripts exist
    if [ -f "$MIGRATE_DIR/verify-rls.sh" ]; then
        chmod +x "$MIGRATE_DIR/verify-rls.sh"
        print_success "RLS verification script found"
    fi
    
    if [ -f "$MIGRATE_DIR/verify-secrets.sh" ]; then
        chmod +x "$MIGRATE_DIR/verify-secrets.sh"
        print_success "Secrets verification script found"
    fi
}

# Apply RLS policies
apply_rls() {
    if [ "$SKIP_RLS" = true ]; then
        print_warning "Skipping RLS policies"
        return
    fi
    
    print_step "Applying RLS Policies"
    print_info "This will set up Row-Level Security for all tables"
    print_warning "Make sure you have the service role key configured"
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipped RLS policies"
        return
    fi
    
    print_info "To apply RLS policies:"
    print_info "1. Open Supabase SQL Editor"
    print_info "2. Copy contents of: $MIGRATE_DIR/apply-rls-policies.sql"
    print_info "3. Execute the script"
    print_info "4. Or use the Supabase Admin panel > Database tab"
    
    read -p "Have you applied the RLS policies? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_success "RLS policies applied"
    else
        print_warning "Please apply RLS policies before continuing"
    fi
}

# Apply triggers
apply_triggers() {
    if [ "$SKIP_TRIGGERS" = true ]; then
        print_warning "Skipping triggers"
        return
    fi
    
    print_step "Applying Database Triggers"
    print_info "This will create all database triggers and functions"
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipped triggers"
        return
    fi
    
    print_info "To apply triggers:"
    print_info "1. Open Supabase SQL Editor"
    print_info "2. Copy contents of: $MIGRATE_DIR/apply-triggers.sql"
    print_info "3. Execute the script"
    
    read -p "Have you applied the triggers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_success "Triggers applied"
    else
        print_warning "Please apply triggers before continuing"
    fi
}

# Apply storage buckets
apply_storage() {
    if [ "$SKIP_STORAGE" = true ]; then
        print_warning "Skipping storage buckets"
        return
    fi
    
    print_step "Setting Up Storage Buckets"
    print_info "This will create all required storage buckets"
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipped storage buckets"
        return
    fi
    
    print_info "To apply storage buckets:"
    print_info "1. Open Supabase SQL Editor"
    print_info "2. Copy contents of: $MIGRATE_DIR/apply-storage-buckets.sql"
    print_info "3. Execute the script"
    print_info "4. Or use the Supabase Admin panel > Storage tab"
    
    read -p "Have you set up storage buckets? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_success "Storage buckets set up"
    else
        print_warning "Please set up storage buckets before continuing"
    fi
}

# Seed system data
apply_seed() {
    if [ "$SKIP_SEED" = true ]; then
        print_warning "Skipping seed data"
        return
    fi
    
    print_step "Seeding System Data"
    print_info "This will populate initial system data (categories, templates, etc.)"
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipped seed data"
        return
    fi
    
    print_info "To seed system data:"
    print_info "1. Open Supabase SQL Editor"
    print_info "2. Copy contents of: $MIGRATE_DIR/seed-system-data.sql"
    print_info "3. Execute the script"
    
    read -p "Have you seeded the system data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_success "System data seeded"
    else
        print_warning "Please seed system data before continuing"
    fi
}

# Deploy edge functions
deploy_functions() {
    if [ "$SKIP_FUNCTIONS" = true ]; then
        print_warning "Skipping edge functions"
        return
    fi
    
    print_step "Deploying Edge Functions"
    print_info "This will deploy all edge functions to Supabase"
    
    # Check if deploy script exists
    if [ ! -f "$MIGRATE_DIR/deploy-edge-functions.sh" ]; then
        print_error "deploy-edge-functions.sh not found"
        return
    fi
    
    chmod +x "$MIGRATE_DIR/deploy-edge-functions.sh"
    
    print_info "To deploy edge functions:"
    print_info "1. Ensure Supabase CLI is linked to your project"
    print_info "2. Run: $MIGRATE_DIR/deploy-edge-functions.sh --all"
    print_info "3. Or use the Supabase Admin panel > Edge Functions tab"
    
    read -p "Deploy edge functions now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Running deploy script..."
        "$MIGRATE_DIR/deploy-edge-functions.sh" --all || {
            print_error "Edge function deployment failed"
            print_info "You can deploy manually later"
        }
    else
        print_warning "Skipped edge function deployment"
    fi
}

# Verify migration
verify_migration() {
    print_step "Verifying Migration"
    
    # Verify RLS
    if [ -f "$MIGRATE_DIR/verify-rls.sh" ] && [ "$SKIP_RLS" = false ]; then
        print_info "Verifying RLS policies..."
        "$MIGRATE_DIR/verify-rls.sh" || print_warning "RLS verification had warnings"
    fi
    
    # Verify secrets
    if [ -f "$MIGRATE_DIR/verify-secrets.sh" ]; then
        print_info "Verifying secrets..."
        "$MIGRATE_DIR/verify-secrets.sh" || print_warning "Some secrets may be missing"
    fi
    
    print_success "Verification complete"
}

# Main execution
main() {
    echo -e "${CYAN}"
    echo "=========================================="
    echo "  SPORK MIGRATION: Lovable to Supabase"
    echo "=========================================="
    echo -e "${NC}"
    
    if [ "$VERIFY_ONLY" = true ]; then
        verify_migration
        exit 0
    fi
    
    check_prerequisites
    
    if [ "$SKIP_SCHEMA" = false ]; then
        print_step "Database Schema"
        print_info "Ensure all migrations in supabase/migrations/ are applied"
        print_info "Check in Supabase Dashboard > Database > Migrations"
        read -p "Are all migrations applied? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Please apply all migrations first"
            exit 1
        fi
        print_success "Database schema verified"
    fi
    
    apply_rls
    apply_triggers
    apply_storage
    apply_seed
    deploy_functions
    verify_migration
    
    print_step "Migration Complete!"
    print_success "Your Supabase instance is ready"
    print_info "Next steps:"
    print_info "1. Update your application configuration"
    print_info "2. Test all functionality"
    print_info "3. Migrate data if needed"
    print_info "4. Set up monitoring"
}

# Run main
main



