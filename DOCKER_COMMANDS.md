# Travel API - Quick Deployment Commands

## Production Deployment

### Build and Start

```bash
docker-compose -f docker-compose.prod.yaml build
docker-compose -f docker-compose.prod.yaml up -d
```

### Check Status

```bash
docker-compose -f docker-compose.prod.yaml ps
docker-compose -f docker-compose.prod.yaml logs -f
```

### Stop and Remove

```bash
docker-compose -f docker-compose.prod.yaml down
```

### Restart

```bash
docker-compose -f docker-compose.prod.yaml restart
```

### Update Application

```bash
git pull origin main
docker-compose -f docker-compose.prod.yaml down
docker-compose -f docker-compose.prod.yaml build --no-cache
docker-compose -f docker-compose.prod.yaml up -d
```

## Development

### Build and Start

```bash
docker-compose up -d
```

### Check Logs

```bash
docker-compose logs -f travel_api
```

## Database Backup

### Backup

```bash
docker exec travel_mysql_prod mysqldump -u root -p${MYSQL_ROOT_PASSWORD} sql_travelindo > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
docker exec -i travel_mysql_prod mysql -u root -p${MYSQL_ROOT_PASSWORD} sql_travelindo < backup_20260119.sql
```

## Troubleshooting

### View Container Logs

```bash
docker-compose -f docker-compose.prod.yaml logs travel_api
docker-compose -f docker-compose.prod.yaml logs travel_mysql
```

### Access Container Shell

```bash
docker exec -it travel_api_prod sh
docker exec -it travel_mysql_prod bash
```

### Check Network

```bash
docker network ls
docker network inspect travel-network
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune
```
