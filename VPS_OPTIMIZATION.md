# VPS Optimization Guide - Travel API

## 🖥️ VPS Specifications

- **CPU:** 4 vCPU cores
- **RAM:** 16 GB (50% used by 4 WordPress sites)
- **Disk:** 200 GB
- **Available RAM:** ~8 GB

## 📊 Memory Allocation Strategy

### Current Setup:

```
WordPress Sites (4):     8 GB (50%)
Available:               8 GB (50%)
```

### After Travel API Deployment:

```
WordPress Sites:         8.0 GB  (50%)
Travel API Container:    0.4 GB  (2.5%)
MySQL Container:         0.6 GB  (3.75%)
Docker Overhead:         0.2 GB  (1.25%)
OS Buffer/Cache:         2.5 GB  (15.6%)
─────────────────────────────────────
Total Used:             11.7 GB  (73%)
Available Buffer:        4.3 GB  (27%) ✅
```

## 🎯 Optimizations Applied

### 1. **MySQL Memory Tuning**

```yaml
command:
  - --innodb_buffer_pool_size=512M # Default: 128M, Optimal for shared VPS
  - --max_connections=100 # Limit concurrent connections
  - --query_cache_size=32M # Cache frequent queries
  - --tmp_table_size=32M # Temporary table size
  - --innodb_flush_log_at_trx_commit=2 # Better performance, acceptable durability
```

**Memory Saved:** ~200-300 MB vs default config

### 2. **Container Resource Limits**

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 768M
    reservations:
      cpus: '0.5'
      memory: 512M
```

**Benefit:**

- Prevents containers from consuming all available resources
- Guarantees minimum resources (reservations)
- Protects WordPress sites from resource starvation

### 3. **Node.js Memory Optimization**

```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=384
```

**Benefit:**

- Limits V8 heap to 384MB
- Prevents memory leaks from growing indefinitely
- Forces garbage collection at reasonable threshold

### 4. **Port Binding Security**

```yaml
ports:
  - '127.0.0.1:8082:8082' # Localhost only!
```

**Benefit:**

- API not directly accessible from internet
- Must go through reverse proxy (Nginx/aaPanel)
- Additional security layer

### 5. **Security Hardening**

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE
```

**Benefit:**

- Prevents privilege escalation
- Minimal capabilities (principle of least privilege)
- Reduces attack surface

## 📈 Monitoring Commands

### Check Memory Usage

```bash
# Overall system memory
free -h

# Docker container memory
docker stats --no-stream

# Detailed container stats
docker stats travel_api_prod travel_mysql_prod

# Check if limits are being hit
docker inspect travel_api_prod | grep -A 10 "Memory"
```

### Check CPU Usage

```bash
# System CPU
top -bn1 | head -20

# Docker CPU usage
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Check Disk Usage

```bash
# Overall disk
df -h

# Docker disk usage
docker system df

# Volume sizes
docker volume ls -q | xargs docker volume inspect | grep -A 5 Mountpoint
```

## ⚠️ Warning Signs to Monitor

### Memory Pressure

```bash
# If you see this, you need to optimize
free -h
              total        used        free      shared  buff/cache   available
Mem:           16Gi        14Gi        500Mi       100Mi        1.5Gi        1.2Gi
                                                                              ⬆️ < 2GB = WARNING!
```

**Actions if memory < 2GB available:**

1. Restart containers: `docker-compose restart`
2. Clear cache: `sync; echo 3 > /proc/sys/vm/drop_caches`
3. Check for memory leaks: `docker stats`
4. Consider reducing WordPress cache plugins

### High Swap Usage

```bash
# Check swap
swapon --show

# If swap usage > 2GB, investigate
htop  # Press F5 to see tree view, look for high memory processes
```

## 🔧 Additional Optimizations

### 1. Enable Swap (if not already)

```bash
# Check current swap
swapon --show

# Create 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Set swappiness (how aggressively to use swap)
sudo sysctl vm.swappiness=10  # Low value = prefer RAM
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 2. WordPress Optimization

Since you have 4 WordPress sites, optimize them:

```bash
# In each WordPress site, limit PHP memory
# Edit wp-config.php
define('WP_MEMORY_LIMIT', '128M');  # Default is 256M
define('WP_MAX_MEMORY_LIMIT', '256M');

# Optimize PHP-FPM (in aaPanel)
pm.max_children = 20           # Reduce if needed
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 10
```

### 3. MySQL Query Cache (for WordPress)

```bash
# If WordPress shares MySQL with travel-api, optimize
# Add to MySQL config (/etc/mysql/my.cnf or via aaPanel)

[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
```

### 4. Enable OPcache (PHP)

```bash
# In aaPanel PHP settings, enable OPcache
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

## 📊 Expected Performance

### Response Times:

- **API Endpoints:** 50-200ms (depending on query complexity)
- **Database Queries:** 10-50ms (with proper indexing)
- **Docker Overhead:** ~5% performance penalty (negligible)

### Concurrent Users:

- **Estimated Capacity:** 500-1000 concurrent users
- **Bottleneck:** Database connections (max 100)
- **Scaling:** Can increase max_connections if needed

## 🚨 Troubleshooting

### Problem: Container keeps restarting

```bash
# Check logs
docker logs travel_api_prod --tail 100

# Common causes:
# 1. Out of memory (check limits)
# 2. Database connection failed (check MySQL health)
# 3. Port already in use (check with: netstat -tulpn | grep 8082)
```

### Problem: Slow API responses

```bash
# Check if hitting memory limit
docker stats travel_api_prod

# If memory at limit, increase:
# Edit docker-compose.prod.yaml
limits:
  memory: 768M  # Increase from 512M

# Then restart
docker-compose -f docker-compose.prod.yaml up -d
```

### Problem: MySQL connection errors

```bash
# Check MySQL health
docker exec travel_mysql_prod mysqladmin ping -h localhost -u root -p

# Check max connections
docker exec travel_mysql_prod mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"

# Check current connections
docker exec travel_mysql_prod mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

## 📅 Maintenance Schedule

### Daily (Automated via Cron)

```bash
# Backup database
0 3 * * * docker exec travel_mysql_prod mysqldump -u root -p${MYSQL_ROOT_PASSWORD} sql_travelindo > /backup/travel_db_$(date +\%Y\%m\%d).sql
```

### Weekly

```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yaml logs --tail 1000 | grep -i error

# Check disk usage
docker system df

# Prune unused images
docker image prune -a -f
```

### Monthly

```bash
# Update base images
docker pull node:20-alpine
docker pull mysql:8.0

# Rebuild and redeploy
cd /www/wwwroot/travel-api
docker-compose -f docker-compose.prod.yaml build --no-cache
docker-compose -f docker-compose.prod.yaml up -d

# Rotate old backups (keep last 30 days)
find /backup -name "travel_db_*.sql" -mtime +30 -delete
```

## ✅ Deployment Checklist for Your VPS

- [ ] Swap enabled (4GB recommended)
- [ ] WordPress sites optimized (PHP memory limits)
- [ ] Docker resource limits configured
- [ ] Reverse proxy setup in aaPanel
- [ ] SSL certificate installed
- [ ] Firewall configured (only 80, 443, 22, 7800)
- [ ] Backup cron job scheduled
- [ ] Monitoring alerts setup (optional: UptimeRobot, Pingdom)
- [ ] Log rotation configured
- [ ] Emergency rollback plan documented

## 🎯 Conclusion

With your VPS specs (16GB RAM, 4 vCPU), you have **more than enough resources** for:

- 4 WordPress sites (current)
- Travel API + MySQL (Docker)
- Future growth (2-3 more small apps)

The optimizations ensure:

- ✅ Containers won't starve WordPress sites
- ✅ Memory usage stays under 75%
- ✅ CPU distributed fairly
- ✅ Security hardened
- ✅ Easy to monitor and maintain

**You're good to go! 🚀**
