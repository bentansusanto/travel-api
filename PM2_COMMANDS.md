# PM2 Deployment Commands

## Quick Start

### Initial Setup

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup auto-start on reboot
pm2 startup
```

## Management Commands

### Start/Stop/Restart

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop travel-api

# Restart
pm2 restart travel-api

# Reload (zero-downtime)
pm2 reload travel-api

# Delete from PM2
pm2 delete travel-api
```

### Monitoring

```bash
# List all processes
pm2 list
pm2 status

# Real-time monitoring
pm2 monit

# Show detailed info
pm2 show travel-api

# Dashboard (web interface)
pm2 plus
```

### Logs

```bash
# View logs (real-time)
pm2 logs travel-api

# View only errors
pm2 logs travel-api --err

# View last 100 lines
pm2 logs travel-api --lines 100

# Clear logs
pm2 flush

# Rotate logs
pm2 install pm2-logrotate
```

### Memory Management

```bash
# Check memory usage
pm2 status

# Restart if high memory
pm2 restart travel-api

# Update memory limit
# Edit ecosystem.config.js
max_memory_restart: '300M'

# Then reload
pm2 reload travel-api
```

### Scaling

```bash
# Scale to 4 instances
pm2 scale travel-api 4

# Scale to max CPU cores
pm2 scale travel-api max

# Scale down to 1
pm2 scale travel-api 1
```

## Deployment

### Update Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install --prod

# Build
pnpm build

# Reload PM2 (zero-downtime)
pm2 reload travel-api

# Or restart
pm2 restart travel-api
```

### Environment Variables

```bash
# Update .env
nano .env

# Restart to apply changes
pm2 restart travel-api

# Or reload
pm2 reload travel-api
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs travel-api --err

# Delete and restart
pm2 delete travel-api
pm2 start ecosystem.config.js

# Check if port is in use
netstat -tulpn | grep 8082
```

### High Memory Usage

```bash
# Check current usage
pm2 status

# Restart
pm2 restart travel-api

# Lower memory limit
# Edit ecosystem.config.js
max_memory_restart: '300M'
```

### Process Keeps Restarting

```bash
# Check error logs
pm2 logs travel-api --err --lines 50

# Check if database is accessible
# Check .env configuration
# Check if port is available
```

## Advanced

### Custom Startup Script

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# Unstartup (remove from startup)
pm2 unstartup
```

### PM2 Ecosystem File

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Start specific app
pm2 start ecosystem.config.js --only travel-api

# Start with different env
pm2 start ecosystem.config.js --env production
```

### Monitoring & Metrics

```bash
# Install PM2 Plus (free tier)
pm2 plus

# Or use built-in monitoring
pm2 monit

# Export metrics
pm2 describe travel-api
```

## Backup & Restore

### Save PM2 Configuration

```bash
# Save current processes
pm2 save

# Dump to file
pm2 dump

# Restore from dump
pm2 resurrect
```

### Backup Logs

```bash
# Logs location
~/.pm2/logs/

# Backup
tar -czf pm2-logs-backup.tar.gz ~/.pm2/logs/

# Restore
tar -xzf pm2-logs-backup.tar.gz -C ~/
```

## Performance Tuning

### Cluster Mode

```bash
# Use all CPU cores
instances: 'max'

# Or specific number
instances: 4
```

### Memory Optimization

```bash
# Set memory limit
max_memory_restart: '400M'

# Set Node.js heap limit
node_args: '--max-old-space-size=384'
```

### Log Rotation

```bash
# Install log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Health Checks

### Manual Health Check

```bash
# Check if running
pm2 list | grep travel-api

# Check endpoint
curl http://localhost:8082/health

# Check memory
pm2 status
```

### Automated Health Check

```bash
# Add to crontab
*/5 * * * * pm2 status | grep -q "travel-api.*online" || pm2 restart travel-api
```
