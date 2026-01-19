#!/bin/bash

# Travel API - Environment Security Check
# Usage: ./check-env-security.sh

echo "🔐 Environment Security Audit"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ISSUES=0

# 1. Check .env file exists
echo "1️⃣  Checking .env file existence..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Fix: cp .env.example .env"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 2. Check .env permissions
echo "2️⃣  Checking .env file permissions..."
if [ -f .env ]; then
    # Get permissions (works on both Linux and macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        PERMS=$(stat -f %A .env)
    else
        PERMS=$(stat -c %a .env)
    fi

    if [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✅ .env permissions: $PERMS (secure)${NC}"
    else
        echo -e "${RED}❌ .env permissions: $PERMS (INSECURE!)${NC}"
        echo "   Current: $PERMS"
        echo "   Required: 600 (owner read/write only)"
        echo "   Fix: chmod 600 .env"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Skipped (no .env file)${NC}"
fi
echo ""

# 3. Check if .env is tracked by git
echo "3️⃣  Checking if .env is in git..."
if [ -d .git ]; then
    if git ls-files --error-unmatch .env 2>/dev/null; then
        echo -e "${RED}❌ .env is tracked by git (DANGEROUS!)${NC}"
        echo "   This means your secrets are in git history!"
        echo "   Fix: git rm --cached .env"
        echo "        git commit -m 'Remove .env from git'"
        ISSUES=$((ISSUES + 1))
    else
        echo -e "${GREEN}✅ .env not tracked by git${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
fi
echo ""

# 4. Check .gitignore
echo "4️⃣  Checking .gitignore configuration..."
if [ -f .gitignore ]; then
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ .env in .gitignore${NC}"
    else
        echo -e "${RED}❌ .env not in .gitignore${NC}"
        echo "   Fix: echo '.env' >> .gitignore"
        ISSUES=$((ISSUES + 1))
    fi

    # Check for .env.* patterns
    if grep -q "^\.env\.\*" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ .env.* pattern in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.* pattern not in .gitignore${NC}"
        echo "   Recommended: echo '.env.*' >> .gitignore"
    fi
else
    echo -e "${RED}❌ .gitignore not found${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 5. Check for hardcoded secrets in code
echo "5️⃣  Scanning for hardcoded secrets in code..."
FOUND_SECRETS=0

if [ -d src ]; then
    # Check for hardcoded passwords
    if grep -r "password.*=.*['\"]" src/ 2>/dev/null | grep -v "process.env" | grep -v "PASSWORD" | grep -q .; then
        echo -e "${RED}⚠️  Possible hardcoded passwords found:${NC}"
        grep -rn "password.*=.*['\"]" src/ 2>/dev/null | grep -v "process.env" | grep -v "PASSWORD" | head -3
        FOUND_SECRETS=1
    fi

    # Check for hardcoded API keys
    if grep -r "api.*key.*=.*['\"][a-zA-Z0-9]\{20,\}" src/ 2>/dev/null | grep -v "process.env" | grep -q .; then
        echo -e "${RED}⚠️  Possible hardcoded API keys found:${NC}"
        grep -rn "api.*key.*=.*['\"][a-zA-Z0-9]\{20,\}" src/ 2>/dev/null | grep -v "process.env" | head -3
        FOUND_SECRETS=1
    fi

    # Check for hardcoded tokens
    if grep -r "token.*=.*['\"][a-zA-Z0-9]\{20,\}" src/ 2>/dev/null | grep -v "process.env" | grep -v "TOKEN" | grep -q .; then
        echo -e "${RED}⚠️  Possible hardcoded tokens found:${NC}"
        grep -rn "token.*=.*['\"][a-zA-Z0-9]\{20,\}" src/ 2>/dev/null | grep -v "process.env" | grep -v "TOKEN" | head -3
        FOUND_SECRETS=1
    fi

    if [ $FOUND_SECRETS -eq 0 ]; then
        echo -e "${GREEN}✅ No obvious hardcoded secrets detected${NC}"
    else
        echo -e "${YELLOW}   Review these findings and move secrets to .env${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${YELLOW}⚠️  src/ directory not found${NC}"
fi
echo ""

# 6. Check .env.example exists
echo "6️⃣  Checking .env.example template..."
if [ -f .env.example ]; then
    echo -e "${GREEN}✅ .env.example found${NC}"

    # Compare keys
    if [ -f .env ]; then
        ENV_KEYS=$(grep -v '^#' .env | grep '=' | cut -d '=' -f 1 | sort)
        EXAMPLE_KEYS=$(grep -v '^#' .env.example | grep '=' | cut -d '=' -f 1 | sort)

        MISSING=$(comm -23 <(echo "$ENV_KEYS") <(echo "$EXAMPLE_KEYS"))
        if [ -n "$MISSING" ]; then
            echo -e "${YELLOW}⚠️  Keys in .env but not in .env.example:${NC}"
            echo "$MISSING" | sed 's/^/   - /'
        fi

        EXTRA=$(comm -13 <(echo "$ENV_KEYS") <(echo "$EXAMPLE_KEYS"))
        if [ -n "$EXTRA" ]; then
            echo -e "${YELLOW}⚠️  Keys in .env.example but not in .env:${NC}"
            echo "$EXTRA" | sed 's/^/   - /'
        fi
    fi
else
    echo -e "${YELLOW}⚠️  .env.example not found${NC}"
    echo "   Recommended: Create .env.example as template"
fi
echo ""

# 7. Check for exposed .env in public directories
echo "7️⃣  Checking for .env in public directories..."
EXPOSED=0
if [ -d public ] && [ -f public/.env ]; then
    echo -e "${RED}❌ .env found in public/ directory!${NC}"
    EXPOSED=1
    ISSUES=$((ISSUES + 1))
fi
if [ -d dist ] && [ -f dist/.env ]; then
    echo -e "${RED}❌ .env found in dist/ directory!${NC}"
    EXPOSED=1
    ISSUES=$((ISSUES + 1))
fi
if [ $EXPOSED -eq 0 ]; then
    echo -e "${GREEN}✅ No .env in public directories${NC}"
fi
echo ""

# 8. Check environment variable usage
echo "8️⃣  Checking environment variable usage..."
if [ -f .env ]; then
    # Count variables
    VAR_COUNT=$(grep -v '^#' .env | grep '=' | wc -l | tr -d ' ')
    echo "   Found $VAR_COUNT environment variables"

    # Check for empty values
    EMPTY_VARS=$(grep -v '^#' .env | grep '=$' | cut -d '=' -f 1)
    if [ -n "$EMPTY_VARS" ]; then
        echo -e "${YELLOW}⚠️  Variables with empty values:${NC}"
        echo "$EMPTY_VARS" | sed 's/^/   - /'
    else
        echo -e "${GREEN}✅ All variables have values${NC}"
    fi
fi
echo ""

# 9. Check file ownership
echo "9️⃣  Checking file ownership..."
if [ -f .env ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OWNER=$(stat -f %Su .env)
    else
        OWNER=$(stat -c %U .env)
    fi
    echo "   .env owner: $OWNER"

    if [ "$OWNER" = "root" ] || [ "$OWNER" = "www-data" ] || [ "$OWNER" = "$USER" ]; then
        echo -e "${GREEN}✅ Ownership looks good${NC}"
    else
        echo -e "${YELLOW}⚠️  Unusual ownership, verify this is correct${NC}"
    fi
fi
echo ""

# Summary
echo "================================================"
echo "  Security Audit Summary"
echo "================================================"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo ""
    echo "Your environment configuration is secure."
else
    echo -e "${RED}⚠️  Found $ISSUES security issue(s)${NC}"
    echo ""
    echo "Please review and fix the issues mentioned above."
fi

echo ""
echo "Last checked: $(date)"
echo "================================================"

# Exit with error code if issues found
exit $ISSUES
