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

### チェックポイント

- [ ] bun のバージョンが表示された

## 2. bun init

最低限必要なファイルを作成します。

```sh
bun init
```

```sh
bun run index.ts
```

### チェックポイント

- [ ] index.ts が実行できた

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

### チェックポイント

- [ ] ブラウザで`http://localhost:3000`にアクセスして`hi mom`が表示された
- [ ] bun run --watch index.ts が実行できた
- [ ] watch モード で、index.ts を編集すると、自動で再起動された

## 4. dockernize

立ち上げ完了したら、docker で立ち上げるように準備します。
ECS で デプロイするための準備です。

```sh
touch dockerfile
```

```dockerfile
# dockerfile

FROM oven/bun

EXPOSE 3000

WORKDIR /usr/src

COPY . .

RUN bun install
```

```sh
touch .dockerignore
```

```.dockerignore
# .dockerignore

node_modules
.gitignore
dockerfile
LICENSE.md
README.md
cdk
```

### チェックポイント

- [ ] dockerfile を作成した
- [ ] .dockerignore を作成した

## 5. docker build

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

## 6. docker run

docker run コマンドで `bun-server` 立ち上げます。

```sh
docker run --rm --init --ulimit memlock=-1:-1 -w /usr/src -p 3000:3000 bun-server
```

vscode で コンテナ に アタッチしてみて、`index.ts`を編集した後メッセージがかわるかブラウザで確認してみてください。

### チェックポイント

- [ ] docker run が実行できた
- [ ] vscode でアタッチして、`index.ts` を編集した後、ブラウザで確認できた

## 6. cdk install

cdk cli をインストールします。

```sh
brew install aws-cdk
```

```sh
cdk --version
```

### チェックポイント

- [ ] cdk --version を実行すると、2.xx.xx が表示された(2 系であれば OK です)

## 7. cdk init

まずはフォルダを作成します。

```sh
mkdir -p cdk && cd $_
```

typescript で cdk のファイルが生成されます。

```sh
cdk init app --language typescript
```

[言語は、Typescript, Javascript, Python, Java, C#, Go が選べます](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/hello_world.html#hello_world_tutorial_create_app)

最後はコミットしておきましょう。

### チェックポイント

- [ ] cdk init app --language typescript が実行できた
- [ ] git commit 完了

## 8. cdk の説明

cdk で使用するファイルを説明します。

- `bin/cdk.ts` : 初期状態は`CdkStack`がインスタンス化（new）されています。ここでインスタンス化されたスタックが新規作成されます。
- `lib/cdk-stack.ts` : cdk のスタックを定義します。ここでデプロイするリソースを定義します。

まとめると、`lib/cdk-stack.ts`で定義したスタックを`bin/cdk.ts`でインスタンス化して、デプロイします。

cdk には大きくわけて 4 つ概念があります。

- `App` : [スタックの集合体](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/apps.html)(基本さわらない)
- `Stack` : [リソースの集合体](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/stacks.html)(環境変数・リージョン・アカウントを分ける単位)
- `Construct` : [リソースの単体](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/constructs.html)

### チェックポイント

- [ ] 使うファイルは、`bin/cdk.ts`と`lib/cdk-stack.ts`の 2 つということがわかった

## 9. cdk bootstrap(スキップしてください)

cdk でデプロイするために、[cdk bootstrap](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/bootstrapping.html) します。

リソース作成実行するための、リソースを作成します。

**通常は、1 リージョンにつき 1 回だけ実行します。**

今回は、先に実行しておいたので不要です。

ブートストラップされているかは、cloudformation のページで`CDKToolkit`というスタックがあるか確認してください。

### チェックポイント

- [ ] cdk bootstrap は 1 リージョンにつき 1 回のため、今回はスキップした

## 10. first cdk deploy

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
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { CpuArchitecture, EcrImage, OperatingSystemFamily } from 'aws-cdk-lib/aws-ecs'; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { join } from 'path';

const vpcIdParameterName = 'VpcStackOfVpcId';

export interface CdkStackProps extends StackProps {}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const localDockerfile = join(__dirname, '../../');

    const image = EcrImage.fromAsset(localDockerfile);

    const vpcId = StringParameter.valueFromLookup(this, vpcIdParameterName); // ハンズオンのため、VpcStackがないためのワークアラウンド
    const vpc = Vpc.fromLookup(this, Vpc.name, { vpcId }); // vpc上限にひっかかるため、ひとつのvpcを使いまわす

    const { targetGroup } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        vpc,
        taskImageOptions: { image, containerPort: 3000 },
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
      port: '3000',
      path: '/',
    });
  }
}
```

これで、ALB + ECS + TargetGroup + SecurityGroup がデプロイ完了しました。

出力された URL にアクセスしてみてください。

### チェックポイント

- [ ] cdk deploy が実行できた
- [ ] ターミナルに出力された URL にアクセスして、`hi mom` が表示された

## 11. デプロイしたコンテナに VSCode でアクセスしてみる

VSCode で、コンテナにアクセスしてみます。

AWS 公式の拡張機能をインストールします。

- [AWS ToolKit](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-toolkit-vscode)
- [vscode remote extensionpack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)

US East > ECS > Cluster > Service > web
右クリック > Open Terminal...

```sh
bash
```

ただ、このままでは、ターミナル越しで vim もなく、コードを編集することができません。
vscode tunnel を使って、ローカルの vscode で編集できるようにします。

### Intel Mac の場合

```sh
wget -O vscode_cli.tar.gz 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64'
```

```sh
tar -xzf vscode_cli.tar.gz
```

### Apple Silicon Mac の場合

```sh
wget -O vscode_cli.tar.gz 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-arm64'
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
- [ ] アタッチしたコンテナの`index.ts`を編集できた

## 12. Postgres コンテナ を追加する

## 13. Drizzle ORM を追加する

## 14. データ追加・参照 API を追加する

## 15. CDK に RDS を追加する

```

```
