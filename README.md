# cdk-handson

1. cdk を使って下記構成を作成
2. aws に デプロイ

```sh
ALB + ECS + RDS
```

- IaC ツール: [AWS CDK](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/home.html)
- 言語： [Typescript](https://www.typescriptlang.org/ja/)
- ランタイム： [Bun](https://bun.sh/)
- DB: [Postgres](https://www.postgresql.org/)
- ORM: [Drizzle ORM](https://orm.drizzle.team/)

# 1. brew で bun をインストール

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

### チェックポイント

- [ ] bun のバージョンが表示された

# 2. workspace(フォルダ) を作成

ハンズオンを進めるためのフォルダを作成します。

```sh
mkdir -p cdk-handson && cd $_
```

git init もしておきます。差分がわかりやすくなります

```sh
git init
```

### チェックポイント

- [ ] フォルダ作成した

# 3. bun init

最低限必要なファイルを作成します。

```sh
bun init
```

→ すべて Yes

`src フォルダ`作成し、`index.ts`を移動する

```sh
bun run ./src/index.ts
```

### チェックポイント

- [ ] index.ts が実行できた

# 4. start server

`index.ts`をサーバーに書き換えて、起動します。
3000 番ポートでサーバーが起動します。

```typescript
// index.ts
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
bun run --watch ./src/index.ts
```

### チェックポイント

- [ ] ブラウザで`http://localhost:3000`にアクセスして`hi mom`が表示された

# 5. package.json に scripts を追加

```json
// package.json
{
  "name": "cdk-handson-preview",
  "module": "index.ts",
  "type": "module",
  "scripts": {
    "start": "bun run --watch ./src/index.ts"
  },
  "devDependencies": {
    "bun-types": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  }
}
```

```sh
bun run start
```

`return new Response('hi mom');`

↓

`return new Response('hi dad');`

に変更して、ブラウザで確認してみてください。

### チェックポイント

- [ ] bun run start が実行できた
- [ ] watch モード で、index.ts を編集すると、自動で再起動された

# 6. dockernize

立ち上げ完了したら、docker で立ち上げるように準備します。
ECS で デプロイするための準備です。

## dockerfile 作成

```sh
touch dockerfile
```

```dockerfile
# dockerfile

FROM oven/bun

EXPOSE 3000

WORKDIR /usr/src

RUN apt-get update && apt-get install wget -y

COPY . .

RUN bun install
```

## .dockerignore 作成

```sh
touch .dockerignore
```

```.dockerignore
# .dockerignore

node_modules
.gitignore
docker-compose.yml
dockerfile
*.md
cdk
```

### チェックポイント

- [ ] dockerfile を作成した
- [ ] .dockerignore を作成した

# 7. Docker build

docker build します。

```sh
docker build -t bun-server .
```

無事、image が作成されたか確認します。

```sh
docker images | grep bun-server
```

### チェックポイント

- [ ] docker build が実行できた
- [ ] docker images で bun-server が表示された

# 8. docker run

docker run コマンドで `bun-server` 立ち上げます。

```sh
docker run --rm --init --ulimit memlock=-1:-1 -w /usr/src -p 3000:3000 bun-server bun run start
```

vscode で コンテナ に アタッチしてみて、`index.ts`を編集した後メッセージがかわるかブラウザで確認してみてください。

### チェックポイント

- [ ] docker run が実行できた
- [ ] vscode でアタッチして、`index.ts` を編集した後、ブラウザで確認できた

# 9. cdk init

```sh
mkdir -p cdk && cd $_
```

```sh
bunx cdk --version
```

```sh
bunx cdk init app --language typescript
```

### チェックポイント

- [ ] cdk フォルダで cdk init が実行できた
- [ ] bunx cdk --version を実行すると、2.xx.xx が表示された(2 系であれば OK です)

### 💡Tips

[言語は、Typescript, Javascript, Python, Java, C#, Go が選べます](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/hello_world.html#hello_world_tutorial_create_app)

# 10. cdk の説明

今回`cdk` で使うファイルは 2 つだけです。

- `/cdk/bin/cdk.ts` : 初期状態は`CdkStack`がインスタンス化（new）されています。ここでインスタンス化されたスタックが新規作成されます。
- `/cdk/lib/cdk-stack.ts` : cdk のスタックを定義します。ここでデプロイするリソースを定義します。

`lib/cdk-stack.ts`で定義したスタックを`bin/cdk.ts`でインスタンス化して、デプロイします。

`cdk` には大きくわけて 4 つ概念があります。

- `App` : [スタックの集合体](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/apps.html)(基本さわらない)
- `Stack` : [リソースの集合体](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/stacks.html)(環境変数・リージョン・アカウントを分ける単位)
- `Construct` : [リソースの単体](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/constructs.html)

### チェックポイント

- [ ] 使うファイルは、`cdk/bin/cdk.ts`と`cdk/lib/cdk-stack.ts`の 2 つということがわかった

# 11. cdk bootstrap(スキップしてください)

cdk でデプロイするために、[cdk bootstrap](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/bootstrapping.html) します。

リソース作成実行するための、リソースを作成します。

**通常は、1 リージョンにつき 1 回だけ実行します。**

今回は、先に実行しておいたので不要です。

ブートストラップされているかは、cloudformation のページで`CDKToolkit`というスタックがあるか確認してください。

### チェックポイント

- [ ] cdk bootstrap は 1 リージョンにつき 1 回のため、今回はスキップした

# 12. Create Stack

※事前に PERMAN で CLI 用トークン発行をしてください

bun で作成したサーバーをデプロイします。

下記ファイルを書き換えてください

- `/cdk/bin/cdk.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

const user = process.env.USER?.toUpperCase();

new CdkStack(app, `${CdkStack.name}Of${user}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

`process.env`はローカルで、`env` コマンドを打った時の変数が定義されています。

```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Vpc } from "aws-cdk-lib/aws-ec2"; // prettier-ignore
import { CpuArchitecture, EcrImage, OperatingSystemFamily } from "aws-cdk-lib/aws-ecs"; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { join } from 'path';

export interface CdkStackProps extends StackProps {}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const image = EcrImage.fromAsset(join(__dirname, '../../'));

    const vpcId = process.env.VPC_ID ?? new Error('VPC_ID is not defined');
    const subDomain = process.env.USER?.toLowerCase() ?? new Error('USER is not defined');
    const domainName = process.env.DOMAIN_NAME ?? new Error('DOMAIN_NAME is not defined');
    const certificateArn = process.env.CERTIFICATE_ARN ?? new Error('CERTIFICATE_ARN is not defined');

    if (vpcId instanceof Error) throw vpcId;
    if (subDomain instanceof Error) throw subDomain;
    if (domainName instanceof Error) throw domainName;
    if (certificateArn instanceof Error) throw certificateArn;

    const { targetGroup, taskDefinition } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        vpc: Vpc.fromLookup(this, Vpc.name, { vpcId }),
        taskImageOptions: {
          image,
          command: ['bun', 'run', 'start'],
          containerPort: 3000,
        },
        domainName: `${subDomain}.${domainName}`,
        domainZone: HostedZone.fromLookup(this, 'HostedZone', { domainName }),
        certificate: Certificate.fromCertificateArn(this, Certificate.name, certificateArn),
        redirectHTTP: true,
        circuitBreaker: { rollback: true },
        enableExecuteCommand: true,
        // apple silicon mac　で docker build の方は下記を追加
        runtimePlatform: {
          cpuArchitecture: CpuArchitecture.ARM64,
          operatingSystemFamily: OperatingSystemFamily.LINUX,
        },
      }
    );

    targetGroup.configureHealthCheck({
      port: `${taskDefinition.defaultContainer?.containerPort}`,
      path: '/',
    });
  }
}
```

`.env` を作成します。

```sh
touch .env
```

```.env
# /cdk/.env

VPC_ID=当日共有します
DOMAIN_NAME=当日共有します
CERTIFICATE_ARN=当日共有します
```

```sh
bunx cdk diff
```

`cdk diff`は dryRun です。実際にデプロイする前に、どのようなリソースが作成されるか確認できます。

### チェックポイント

- [ ] `bunx cdk diff` が実行できた

# 13. CDK Deploy

```sh
bunx cdk deploy
```

これで、ALB + ECS がデプロイ完了しました。

出力された URL にアクセスしてみてください。

### チェックポイント

- [ ] cdk deploy が実行できた
- [ ] ターミナルに出力された URL にアクセスして、`hi mom` が表示された

# 14. デプロイしたコンテナに VSCode でアクセスしてみる

VSCode で、コンテナにアクセスしてみます。

AWS 公式の拡張機能をインストールします。

- [AWS ToolKit](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-toolkit-vscode)
- [vscode remote extensionpack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)

US East > ECS > Cluster > Service > web
右クリック > Open Terminal...

```sh
bash
```

## SetUp VSCode Tunnel

### M1 Mac の場合

```sh
wget -O vscode_cli.tar.gz 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-arm64'
```

```sh
tar -xzf vscode_cli.tar.gz
```

### Intel Mac の場合

```sh
wget -O vscode_cli.tar.gz 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64'
```

```sh
tar -xzf vscode_cli.tar.gz
```

### 共通

```sh
./code tunnel
```

- `https://github.com/login/device` にアクセスして、ターミナルに出力された コード を入力してください。
- What would you like to call this machine? → なんでも OK です（bun-server）
- リモートエクスプローラー > bun-server > 新しいウィンドウで接続
- `index.ts`の`hi mom`を`hi dad`に変更して保存してください。
- 出力が変わったかブラウザで確認してみてください。

実はブラウザでもアクセスできます →
https://vscode.dev/tunnel/bun-server/usr/src

ただ、ブラウザのショートカットキーと vscode のショートカットキーがかぶっているので、vscode で編集した方が楽です。

### チェックポイント

- [ ] aws toolkit をインストールした
- [ ] vscode remote extensionpack をインストールした
- [ ] アタッチしたコンテナの`index.ts`を編集し、ブラウザで確認できた

# 15. ローカル で DB を追加

今回はよくある構成として、`ALB + ECS + RDS`を作成していきます。

次に追加するのは、DB です。

ローカル（Docker）で開発できる状態にして、DB を操作していきます。

常に、ローカル → AWS の状態にしておくと、開発がスムーズに進みます。

## DrizzleORM

今回は ORM に、[DrizzleORM](https://orm.drizzle.team/) を使うので、パッケージを追加します。

- [Overview](https://orm.drizzle.team/docs/overview) から抜粋して翻訳 ↓

```
Drizzle を使用すると、typescript でデータベース スキーマを定義および管理でき、SQL のような方法またはリレーショナルな方法でデータにアクセスでき、多種多様なオプトイン ツールが備わっているため、Drizzle は SQL データを管理およびアクセスするための究極のツールになります。
```

## Add Package

```sh
bun add drizzle-orm pg
bun add -D drizzle-kit @types/pg
```

- [参考](https://orm.drizzle.team/docs/quick-postgresql/node-postgres)

## Add Postgres In Docker Compose

- [postgresql とは](https://www.postgresql.org/) → ChatGPT に聞いてみて

```sh
touch docker-compose.yml
```

```yml
# docker-compose.yml
version: '3.9'
services:
  psql:
    container_name: postgres
    image: postgres
    restart: always
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: zon100
    ports:
      - 5432:5432

  server:
    container_name: server
    build:
      context: .
    ports:
      - 3000:3000
    volumes:
      - ./:/usr/src/
      - ignore:/usr/src/cdk
    depends_on:
      - psql
    init: true
    environment:
      DB_HOST: psql
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASS: postgres
      DB_NAME: zon100
    command: ['bun', 'run', 'start']

volumes:
  ignore:
```

docker compose を立ち上げます

```sh
docker compose up
```

# 16. Drizzle Setup

Drizzle で DB の設定を操作するためのファイルを追加します。

## drizzle.config.ts 追加

どこに`schema.ts`を作成するかを定義します。

マイグレーションを実行すると、マイグレーションファイルがアウトプットされる場所も定義します。

- [config reference](https://orm.drizzle.team/kit-docs/config-reference#configuration)

```sh
touch drizzle.config.ts
```

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/**/schema.ts',
  driver: 'pg',
  out: './src/db/migrations',
  verbose: true,
} satisfies Config;
```

## schema.ts 追加

schema の定義方法は、フォルダでわけたり、schema.ts にまとめたり方法はいろいろあるようです。

今回は`schema.ts`にまとめて定義します。

- [schema reference](https://orm.drizzle.team/docs/sql-schema-declaration)

```sh
mkdir -p ./src/db && touch ./src/db/schema.ts
```

今回は簡単な todo アプリを想定したテーブル構造です。

```typescript
// ./src/db/schema.ts
import { boolean, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 140 }).default(''),
  description: text('description').default(''),
  completed: boolean('completed').default(false),
});
```

## client.ts 追加

DB に接続するためのクライアントを作成します。

```sh
touch ./src/db/client.ts
```

```typescript
// ./src/db/client.ts
import { sleep } from 'bun';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) ?? 5432,
  database: process.env.DB_NAME ?? 'zon100',
});

export const db = drizzle(pool);

pool.once('connect', async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('First migration complete');
});

export const retryConnect = async (maxRetries = 10): Promise<void> => {
  let isConnected = false;
  let retries = 0;

  while (!isConnected && retries < maxRetries) {
    console.error('db connecting...');
    await pool
      .connect()
      .then(() => {
        isConnected = true;
        retries = 0;
        console.log('db connected successfully');
      })
      .catch(async () => {
        console.error('db connection error. retry db connection...');
        await sleep(2000);
        isConnected = false;
        retries++;
      });
  }
};
```

## index.ts を 追記

```typescript
// ./src/index.ts
import { serve } from 'bun';
import { eq } from 'drizzle-orm';
import { db, retryConnect } from './db/client';
import { todos } from './db/schema';

await retryConnect();

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Create a todo
    if (url.pathname === '/todos' && req.method === 'POST') {
      const body = await req.json();
      const created = await db.insert(todos).values({ title: body.title }).returning();
      return new Response(JSON.stringify(created));
    }

    // Update a todo
    if (url.pathname === '/todos' && req.method === 'PUT') {
      const body = await req.json();
      if (!body.id) return new Response(JSON.stringify({ update: false }));
      const updated = await db.update(todos).set(body).where(eq(todos.id, body.id)).returning();
      return new Response(JSON.stringify(updated));
    }

    // Delete a todo
    if (url.pathname === '/todos' && req.method === 'DELETE') {
      const body = await req.json();
      if (!body.id) return new Response(JSON.stringify({ delete: false }));
      const deleted = await db.delete(todos).where(eq(todos.id, body.id)).returning();
      return new Response(JSON.stringify(deleted));
    }

    // Get all todos
    if (url.pathname === '/todos' && req.method === 'GET') {
      const res = await db.select().from(todos);
      return new Response(JSON.stringify(res));
    }

    return new Response('hi mom');
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
```

## ローカルで確認

```sh
docker compose up
```

### チェックポイント

- [ ] docker compose で DB に接続できた

```sh
open http://localhost:3000/todos
```

# 17. マイグレーション実行

上記だけではまだ、マイグレーションファイルが作成されていないので、スキーマが存在しないエラーがでます。

drizzle でマイグレーションファイルを作成します。
そのためのコマンドを追加します。

```json
// package.json
{
  "name": "cdk-handson",
  "module": "index.ts",
  "type": "module",
  "scripts": {
    "start": "bun run --watch ./src/index.ts",
    "migrate": "drizzle-kit generate:pg"
  },
  "devDependencies": {
    "@types/pg": "^8.10.2",
    "bun-types": "latest",
    "drizzle-kit": "^0.19.13"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "drizzle-orm": "^0.28.6",
    "pg": "^8.11.3"
  }
}
```

```sh
bun run migrate
```

`./src/db/migrations`にマイグレーションファイルが作成されます。

再度、`docker compose up` し、`http://localhost:3000/todos`にアクセスしてみてください。

アクセスできたら、下記コマンドを投げてレスポンスが返ってくるか確認してみてください。

## GET /todos

```sh
curl --location 'http://localhost:3000/todos'
```

## POST /todos

```sh
curl --location 'http://localhost:3000/todos' \
--header 'Content-Type: application/json' \
--data '{ "title": "test5" }'
```

## PUT /todos

```sh
curl --location --request PUT 'http://localhost:3000/todos' \
--header 'Content-Type: application/json' \
--data '上記のPOSTした返却値を入れて編集してみてください'
```

## DELETE /todos

```sh
curl --location --request DELETE 'http://localhost:3000/todos' \
--header 'Content-Type: application/json' \
--data '上記のPOSTした返却値を入れてください'
```

### チェックポイント

- [ ] docker compose で DB に接続できた
- [ ] マイグレーションファイルが作成できた
- [ ] ブラウザで`http://localhost:3000/todos`にアクセスして、レスポンスが返ってきた
- [ ] ターミナルで `CRUD` ができた

# 18. CDK に RDS を追加する

CDK で RDS を追加します。

```typescript
// cdk/lib/cdk-stack.ts
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { InstanceClass, InstanceSize, InstanceType, Port, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2"; // prettier-ignore
import { CpuArchitecture, EcrImage, OperatingSystemFamily, Secret } from "aws-cdk-lib/aws-ecs"; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { AuroraPostgresEngineVersion, ClusterInstance, DatabaseCluster, DatabaseClusterEngine, InstanceUpdateBehaviour, } from 'aws-cdk-lib/aws-rds'; // prettier-ignore
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { join } from 'path';

export interface CdkStackProps extends StackProps {}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const image = EcrImage.fromAsset(join(__dirname, '../../'));

    const vpcId = process.env.VPC_ID ?? new Error('VPC_ID is not defined');
    const subDomain = process.env.USER?.toLowerCase() ?? new Error('USER is not defined');
    const domainName = process.env.DOMAIN_NAME ?? new Error('DOMAIN_NAME is not defined');
    const certificateArn = process.env.CERTIFICATE_ARN ?? new Error('CERTIFICATE_ARN is not defined');

    if (vpcId instanceof Error) throw vpcId;
    if (subDomain instanceof Error) throw subDomain;
    if (domainName instanceof Error) throw domainName;
    if (certificateArn instanceof Error) throw certificateArn;

    const rds = new DatabaseCluster(this, DatabaseCluster.name, {
      vpc: Vpc.fromLookup(this, Vpc.name, { vpcId }),
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_3,
      }),
      instanceUpdateBehaviour: InstanceUpdateBehaviour.ROLLING,
      writer: ClusterInstance.provisioned('WriterInstanceT3Medium', {
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
        enablePerformanceInsights: true,
      }),
      readers: [
        ClusterInstance.provisioned('ReaderInstanceT3Medium', {
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
          enablePerformanceInsights: true,
        }),
      ],
      defaultDatabaseName: 'zon100',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    if (!rds.secret) return;

    const { targetGroup, service, taskDefinition } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        vpc: rds.vpc,
        taskImageOptions: {
          image,
          command: ['bun', 'run', 'start'],
          containerPort: 3000,
          secrets: {
            DB_HOST: Secret.fromSecretsManager(rds.secret, 'host'),
            DB_PORT: Secret.fromSecretsManager(rds.secret, 'port'),
            DB_USER: Secret.fromSecretsManager(rds.secret, 'username'),
            DB_PASS: Secret.fromSecretsManager(rds.secret, 'password'),
            DB_NAME: Secret.fromSecretsManager(rds.secret, 'dbname'),
          },
        },
        domainName: `${subDomain}.${domainName}`,
        domainZone: HostedZone.fromLookup(this, 'HostedZone', { domainName }),
        certificate: Certificate.fromCertificateArn(this, Certificate.name, certificateArn),
        redirectHTTP: true,
        circuitBreaker: { rollback: true },
        enableExecuteCommand: true,
        // apple silicon mac　で docker build の方は下記を追加
        runtimePlatform: {
          cpuArchitecture: CpuArchitecture.ARM64,
          operatingSystemFamily: OperatingSystemFamily.LINUX,
        },
      }
    );

    targetGroup.configureHealthCheck({
      port: `${taskDefinition.defaultContainer?.containerPort}`,
      path: '/',
    });

    rds.connections.allowFrom(service, Port.tcp(rds.clusterEndpoint.port));
  }
}
```

差分を確認しましょう

```sh
bunx cdk diff
```

差分を確認して、RDS とセキュリティグループが追加されそうな雰囲気があればデプロイしてください

```sh
bunx cdk deploy
```

デプロイが完了したら、デプロイされた URL から、`/todos`にアクセスしてみてください。

### チェックポイント

- [ ] cdk で RDS が追加できた
- [ ] ブラウザで`/todos`にアクセスして、レスポンスが返ってきた
- [ ] ターミナルで `CRUD` ができた

# 19. 時間があれば試してみてください

1. ALB で `/hello` で `hello` という文字列だけを返す Action を追加(ヒント)
2. RDS のライターインスタンスを AuroraServelessV2 に変更([ヒント](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.ClusterInstance.html))

# 20. お掃除

今回作成したリソースを削除します。

```sh
bunx cdk destroy
```

# まとめ

今回のハンズオンでは、下記を学びました。

- bun で サーバーを作成
- docker で bun を立ち上げ
- drizzle で DB を操作
- cdk で ALB + ECS + RDS を作成

ローカルファーストな開発で、再現性と開発スピードの両方を追求できたらいいですね。

# 参考

- [Bun](https://bun.sh/)
- [DrizzleORM](https://orm.drizzle.team/docs/sql-schema-declaration)
- [AWS Cloud Development Kit (AWS CDK API)](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
  - [AWS CDK とは](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
  - [AWS CDK で始めるアプリケーション開発](https://docs.aws.amazon.com/ja_jp/cdk/latest/guide/getting_started.html)
- [AWS CDK 概要 (Basic #1)【AWS Black Belt】](https://www.youtube.com/watch?v=BmCpa44rAXI)
