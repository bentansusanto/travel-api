#!/bin/bash

# Travel API - VPS Monitoring Script
# Usage: ./monitor.sh

echo "================================================"
echo "  Travel API - VPS Resource Monitor"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 1. System Memory
echo "📊 System Memory Usage:"
echo "─────────────────────────────────────────────"
free -h | awk 'NR==1{print $0} NR==2{
    total=$2; used=$3; free=$4; available=$7;
    used_pct=($3/$2)*100;
    printf "Total: %s | Used: %s (%.1f%%) | Free: %s | Available: %s\n", total, used, used_pct, free, available;
    if (used_pct > 85) printf "'${RED}'⚠️  WARNING: High memory usage!'${NC}'\n";
    else if (used_pct > 75) printf "'${YELLOW}'⚡ Caution: Memory usage elevated'${NC}'\n";
    else printf "'${GREEN}'✅ Memory usage healthy'${NC}'\n";
}'
echo ""

# 2. Swap Usage
echo "💾 Swap Usage:"
echo "─────────────────────────────────────────────"
if swapon --show &> /dev/null; then
    swapon --show --noheadings | awk '{
        printf "Swap: %s | Used: %s\n", $3, $4;
    }'
else
    echo "⚠️  No swap configured"
fi
echo ""

# 3. CPU Usage
echo "⚙️  CPU Usage:"
echo "─────────────────────────────────────────────"
top -bn1 | grep "Cpu(s)" | awk '{
    printf "CPU: %.1f%% used | %.1f%% idle\n", 100-$8, $8;
    if (100-$8 > 80) printf "'${RED}'⚠️  WARNING: High CPU usage!'${NC}'\n";
    else if (100-$8 > 60) printf "'${YELLOW}'⚡ Caution: CPU usage elevated'${NC}'\n";
    else printf "'${GREEN}'✅ CPU usage healthy'${NC}'\n";
}'
echo ""

# 4. Disk Usage
echo "💿 Disk Usage:"
echo "─────────────────────────────────────────────"
df -h / | awk 'NR==2{
    printf "Root: %s / %s used (%s)\n", $3, $2, $5;
    used_pct=$5+0;
    if (used_pct > 85) printf "'${RED}'⚠️  WARNING: Low disk space!'${NC}'\n";
    else if (used_pct > 75) printf "'${YELLOW}'⚡ Caution: Disk usage elevated'${NC}'\n";
    else printf "'${GREEN}'✅ Disk usage healthy'${NC}'\n";
}'
echo ""

# 5. Docker Container Status
echo "🐳 Docker Container Status:"
echo "─────────────────────────────────────────────"
if command -v docker &> /dev/null; then
    if docker ps --filter "name=travel" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q travel; then
        docker ps --filter "name=travel" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""

        # Container health
        api_health=$(docker inspect travel_api_prod --format='{{.State.Health.Status}}' 2>/dev/null)
        mysql_health=$(docker inspect travel_mysql_prod --format='{{.State.Health.Status}}' 2>/dev/null)

        if [ "$api_health" == "healthy" ]; then
            echo -e "${GREEN}✅ API Container: Healthy${NC}"
        else
            echo -e "${RED}❌ API Container: $api_health${NC}"
        fi

        if [ "$mysql_health" == "healthy" ]; then
            echo -e "${GREEN}✅ MySQL Container: Healthy${NC}"
        else
            echo -e "${RED}❌ MySQL Container: $mysql_health${NC}"
        fi
    else
        echo "⚠️  No travel containers running"
    fi
else
    echo "⚠️  Docker not installed"
fi
echo ""

# 6. Docker Resource Usage
echo "📈 Docker Container Resources:"
echo "─────────────────────────────────────────────"
if command -v docker &> /dev/null; then
    if docker ps --filter "name=travel" -q | grep -q .; then
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" \
            $(docker ps --filter "name=travel" -q)
    else
        echo "No containers to monitor"
    fi
else
    echo "Docker not available"
fi
echo ""

# 7. Recent Container Logs (Errors)
echo "📋 Recent Container Errors (last 50 lines):"
echo "─────────────────────────────────────────────"
if docker ps --filter "name=travel_api_prod" -q | grep -q .; then
    error_count=$(docker logs travel_api_prod --tail 50 2>&1 | grep -i "error" | wc -l)
    if [ "$error_count" -gt 0 ]; then
        echo -e "${RED}⚠️  Found $error_count error(s) in API logs:${NC}"
        docker logs travel_api_prod --tail 50 2>&1 | grep -i "error" | tail -5
    else
        echo -e "${GREEN}✅ No recent errors in API logs${NC}"
    fi
else
    echo "API container not running"
fi
echo ""

# 8. Network Connectivity
echo "🌐 Network Connectivity:"
echo "─────────────────────────────────────────────"
if docker ps --filter "name=travel_api_prod" -q | grep -q .; then
    if docker exec travel_api_prod wget --quiet --tries=1 --spider http://localhost:8082/health 2>/dev/null; then
        echo -e "${GREEN}✅ API health endpoint responding${NC}"
    else
        echo -e "${RED}❌ API health endpoint not responding${NC}"
    fi
else
    echo "API container not running"
fi
echo ""

# 9. Database Connections
echo "🗄️  MySQL Connection Status:"
echo "─────────────────────────────────────────────"
if docker ps --filter "name=travel_mysql_prod" -q | grep -q .; then
    connections=$(docker exec travel_mysql_prod mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null | awk 'NR==2{print $2}')
    max_connections=$(docker exec travel_mysql_prod mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW VARIABLES LIKE 'max_connections';" 2>/dev/null | awk 'NR==2{print $2}')

    if [ -n "$connections" ] && [ -n "$max_connections" ]; then
        usage_pct=$((connections * 100 / max_connections))
        echo "Active Connections: $connections / $max_connections ($usage_pct%)"

        if [ "$usage_pct" -gt 80 ]; then
            echo -e "${RED}⚠️  WARNING: High connection usage!${NC}"
        elif [ "$usage_pct" -gt 60 ]; then
            echo -e "${YELLOW}⚡ Caution: Connection usage elevated${NC}"
        else
            echo -e "${GREEN}✅ Connection usage healthy${NC}"
        fi
    else
        echo "Could not retrieve connection info"
    fi
else
    echo "MySQL container not running"
fi
echo ""

# 10. Summary
echo "================================================"
echo "  Summary & Recommendations"
echo "================================================"

# Check if any critical issues
critical=0

# Memory check
mem_used=$(free | awk 'NR==2{printf "%.0f", ($3/$2)*100}')
if [ "$mem_used" -gt 85 ]; then
    echo -e "${RED}🚨 CRITICAL: Memory usage > 85%${NC}"
    echo "   → Consider restarting containers or optimizing WordPress"
    critical=1
fi

# Disk check
disk_used=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$disk_used" -gt 85 ]; then
    echo -e "${RED}🚨 CRITICAL: Disk usage > 85%${NC}"
    echo "   → Run: docker system prune -a"
    critical=1
fi

# Container check
if ! docker ps --filter "name=travel_api_prod" -q | grep -q .; then
    echo -e "${RED}🚨 CRITICAL: API container not running${NC}"
    echo "   → Run: docker-compose -f docker-compose.prod.yaml up -d"
    critical=1
fi

if [ "$critical" -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
fi

echo ""
echo "Last updated: $(date)"
echo "================================================"
