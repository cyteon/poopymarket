# Poopymarket
A prediction market (no real money involved), using LMSR for calculating prices and chances.

## Running locally

1. Clone the repository
```bash
$ git clone https://github.com/cyteon/poopymarket && cd poopymarket
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
