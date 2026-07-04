# Kalshit
A prediction market (no real money involved), using LMSR for calculating prices and chances. \
Users are given 1k credits on signup, and can claim 100 credits daily. Market creation costs 500 credits. \
Kalshit also features an admin dash, where admins can view users, markets, trades and ledger entries. \
Admins can also add/remove credits from users.

## Running locally

1. Clone the repository
```bash
$ git clone https://github.com/cyteon/kalshit && cd kalshit
```

2. Install dependencies
```bash
$ bun install
```

3. Copy .env.example to .env
```bash
$ cp .env.example .env
```

4. Fill .env

5. Migrate the DB
```bash
$ bunx drizzle-kit migrate
```

6. Run in dev
```bash
$ bun run dev
```
