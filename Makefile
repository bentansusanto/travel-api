# Docker Commands
up:
	docker compose up

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f


# Help
help:
	@echo "Available commands:"
	@echo "  make up           - Start docker containers"
	@echo "  make down         - Stop docker containers"
	@echo "  make restart      - Restart docker containers"
	@echo "  make logs          - View docker logs"
