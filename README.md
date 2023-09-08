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

[Bun](https://bun.sh/)は、Zig という言語 で書かれたランタイムです。
とても早くて、Typescript を動かすのに前準備なしで使えます。
brew でインストール出来ます。

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

最低限必要なファイルを作成します。

```sh
bun init
```

```sh
bun run index.ts
```

## 3. update index.ts

`index.ts`をサーバーに書き換えて、起動します。
3000 番ポートでサーバーが起動します。

```typescript:index.ts
import { serve } from 'bun';

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    return new Response('hi mom');
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
```

```sh
bun run --watch index.ts
```

## 4. dockernize

立ち上げ完了したら、docker で立ち上げるように準備します。
ECS で デプロイするための準備です。

```sh
touch dockerfile
```

```dockerfile:dockerfile
FROM oven/bun

EXPOSE 3000

WORKDIR /usr/src

COPY . .

RUN bun install
```

```sh
touch .dockerignore
```

```.dockerignore:.dockerignore
node_modules
.gitignore
dockerfile
LICENSE.md
README.md
cdk
```

## 5. docker build

```sh
docker build -t server .
```

## 6. docker run

docker で立ち上げます。

```sh
docker run --rm --init --ulimit memlock=-1:-1 -w /usr/src  -p 3000:3000 server:latest --watch run index.ts
```

vscode で コンテナ に アタッチしてみて、`index.ts`を編集した後メッセージがかわるかブラウザで確認してみてください。

## 5 cdk install

cdk cli をインストールします。

```sh
brew install aws-cdk
```

```sh
cdk --version
```

## 6. cdk init

まずはフォルダを作成し、cdk を初期化します。

```sh
mkdir -p cdk && cd $_
```

```sh
cdk init app --language typescript
```
