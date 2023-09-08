# cdk-handson

1. cdk を使って下記構成を作成
2. aws に デプロイ

```sh
ALB + ECS + RDS
```

IaC ツール: [AWS CDK](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/home.html)
言語： [Typescript](https://www.typescriptlang.org/ja/)
ランタイム： [Bun](https://bun.sh/)
DB: [Postgres](https://www.postgresql.org/)
ORM: [Drizzle ORM](https://orm.drizzle.team/)

## 1. brew で bun をインストール

```sh
brew tap oven-sh/bun
```

```sh
brew install bun
```

```sh
bun -v
```

## 2. bun init

```sh
bun init
```

```sh
bun run index.ts
```

## 3. update index.ts

```typescript:index.ts
import { serve } from 'bun';

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    return new Response(process.env.MESSAGE);
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
console.log(`env: ${Bun.env.MESSAGE}`);
```

```sh
bun run index.ts
```
