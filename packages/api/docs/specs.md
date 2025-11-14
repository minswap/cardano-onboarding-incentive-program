# Minswap Trading Competition Event 📈

## Overview

A month-long incentive program designed to encourage active trading on the Minswap decentralized exchange. Participants compete for rewards based on their trading volume, with advanced points for specific tokens, all tracked by a real-time trading calculation system while maintaining fairness through anti-bot measures.

**Event Duration:** 1 Month  
**Prize Pool:** 100,000+ ADA (dynamically adjusted based on trading fees)  
**Update Interval:** 30 seconds (optimized for resource efficiency)

## Specification

### 1. Point System Calculation ⚡

The point calculation system is the core component that tracks and scores user trading activity in real-time.

#### 1.1 Point Calculation Formula

```typescript
// Core point calculation based on trading volume
points = volume_in_ada × asset_multiplier
```

#### 1.2 Asset Multipliers

Different assets have varying point multipliers to encourage diverse trading:

- **MIN**: 5x multiplier
- **INDY, LQ, IAG, SNEK, WMTX, BODEGA, STRIKE, ROLL**: 2x multiplier
- **Others and Stable Assets**: 1x multiplier

#### 1.3 Final Push Bonus
To encourage participants to stay active until the very end, **in the last week of the event, all points generated are doubled**.

#### 1.4 Real-time Updates

- **Interval**: 30 second updates (configurable via environment variables).
- **Background Process**: Cron job runs continuously using `point-aggregator-cron.ts`.
- **Data Sources**: Minswap's mainnet data for DEX V1, DEX V2, and Stableswap. 
- **Storage**: Redis.

### 2. User Ranking & Leaderboard 🏆

- **Tier 1 (Top 20 users)**: proportional to points and get total 70% of prize pool  
- **Tier 2 (Positions 21-100)**: proportional to points and get total 30% of prize pool

### 3. Anti-Bot System 🛡️

The anti-bot system implements multiple detection mechanisms to ensure fair competition by calculating confidence points.

#### 3.1 Bot Detection Signals

**Efficiency Signals (Unusual Large Trades):**
Tracks disproportionately large single transactions

| Algorithmic | Confidence Points | 
|------------------|--------|
| >40k points/trade | 1 pts |
| >60k points/trade | 2 pts | 
| >100k points/trade | 3 pts | 

**Trading Frequency Analysis:**
Monitors trading patterns across multiple timeframes

| Trades/Day Range | Confidence Points | 
|------------------|--------|
| 1-5/day | 0 pts |
| 6-15/day | 2 pts | 
| 16-30/day | 4 pts | 
| 31-60/day | 6 pts | 
| 61-100/day | 8 pts | 
| 100+/day | 10 pts | 

**Whale Bot Detection**: 

| Algorithmic | Confidence Points | 
|------------------|--------|
| >$500k volume with <10 trades | 2 pts |
| >$1M volume with <20 trades | 3 pts | 

**Token Diversity Analysis:**
Examines trading token variety 

| Strategy | Confidence Points | 
|------------------|--------|
| Pure stablecoin arbitrage | 2 pts |
| Single token focus | 2 pts | 

**Coordination Pattern:**
Examines relations among wallets with same traded tokens

| Pattern | Confidence Points | 
|------------------|--------|
| 2 wallet cluster | 1 pts |
| 3-4 wallet cluster | 2 pts | 
| 5+ wallet cluster | 3 pts

#### 3.2 Bot Confidence Scoring

```typescript
Bot Confidence Levels:
- Level 0 (Human): <8 confidence points
- Level 1 (Suspicious): 8-11 confidence points  
- Level 2 (Likely Bot): 12-15 confidence points
- Level 3 (High Confidence Bot): 16+ confidence points
```

#### 3.3 Bot Filtering

- **Leaderboard Exclusion**: Bots can be excluded or exclusively selected from public rankings via `filter` parameter
- **Reward Eligibility**: High-confidence bots are excluded from final reward calculations
- **Manual Review**: Edge cases can be manually reviewed before final distribution

### 4. Reward Distribution System 💰

#### 4.1 Prize Pool Calculation

**Base Pool**: 100,000 ADA  
**Dynamic Adjustment**: Prize pool increases based on Minswap fee switch. 

#### 4.2 Distribution Tiers

```typescript
Tier 1 (Ranks 1-20): 70% of total prize pool
- Distributed proportionally based on points
- Minimum guaranteed amounts for top performers

Tier 2 (Ranks 21-100): 30% of total prize pool  
- Equal distribution among qualified participants
- Bot-filtered final rankings
```