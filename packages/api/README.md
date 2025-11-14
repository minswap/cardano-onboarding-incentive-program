# Minswap Trading Competition Event API 📈

The `packages/api` directory contains the core backend infrastructure for the Minswap Trading Competition Event. This service handles real-time trading data ingestion, leaderboard calculation and anti-bot detection systems.

## 1. Key Components

- **REST API Server**: Fastify-based endpoints for leaderboard data, user rankings, and event statistics
- **Point Aggregation System**: An automated cron job that
  calculate competition points, allocate rewards and detect bots every 30s
- **Data Pipeline**: Real-time ingestion from Minswap DEX (V1, V2, Stableswap) with Redis

### 1.1. Features

<input type="checkbox" disabled checked /> Point aggregation<br>
<input type="checkbox" disabled checked /> Ranking allocation<br>
<input type="checkbox" disabled checked /> Filter trading bots<br>

## 2. Quick Start

### 2.1. Installation

```bash
# Clone repository
git clone https://github.com/minswap/mcdo-incentive-program.git

cd mcdo-incentive-program

# Install dependencies
pnpm install
```

### 2.2. Environment Variables setup
```bash
# Event Configuration
EVENT_START_TIME=2025-01-01T00:00:00Z
EVENT_END_TIME=2025-02-01T00:00:00Z
INTERVAL=30  # Update interval in seconds (30 seconds)

# Database Connections
POSTGRES_URL=postgresql://user:pass@host:5432/db # Minswap mainnet database with similar DDL structure
REDIS_URL=redis://localhost:6379

# API Configuration
API_PORT=80 # API port for your trading_point_api service
MINSWAP_MINSWAP_THIRD_PARTY_API=https://minswap.org/something
```

### 2.3. Run the services
```bash
docker compose -f packages/dev/docker-compose.dev-trading-event.yaml up --build 
```
Note: this command will run both the cron and the api service.