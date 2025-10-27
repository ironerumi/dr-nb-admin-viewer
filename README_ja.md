# DataRobot Notebook Admin Viewer 簡易ガイド

DataRobot カスタムアプリとして本プロジェクトを利用する際の要点をまとめた日本語版 README です。

## 主な機能

- `/account/profile` からの管理者モード検知
- TanStack Table ベースのページング／ソート／CSV エクスポート
- コードスペース／非アクティブ／稼働中フィルタ
- 5 分キャッシュ付きバックエンド

## クイックスタート

### 前提

- Bun 1.3 以上（ローカル開発・確認用）
- DataRobot API トークン（ユースケースとノートブック参照権限付き）

### セットアップ

```bash
git clone https://github.com/ironerumi/dr-nb-admin-viewer.git
cd dr-nb-admin-viewer
```

ルートに `.env` を作成し、少なくとも以下を記載します。
```bash
cp .env.template .env
```
カスタムアプリに自動でセットされるAPIキーは権限不足しているため`DATAROBOT_API_TOKEN`の設定は必須です。

```bash
DATAROBOT_API_TOKEN=...
# Endpoint はローカル時のみ必要
# DATAROBOT_ENDPOINT=https://app.datarobot.com/api/v2
```

## DataRobot へのデプロイ

DataRobot のカスタムアプリ実行環境には Python と Pulumi CLI がプリインストール済みのため、追加セットアップは不要です。Pulumi スタック名を指定して実行してください。

```bash
python quickstart.py <stack-name>
```

完了後に表示されるアプリ URL へアクセスし、データが表示されるか確認します。再デプロイは同じコマンドを再実行、削除は `--action destroy` を付けて実行します。

### ローカル開発
```
# bun をインストール
# パッケージインストール
bun install

# 開発モード
bun run dev

# 本番ビルド & サーブ
bun run start
```

## トラブルシューティング

- **データ未表示**: `.env` のトークン権限を再確認
- **静的ファイルの 404**: `bun run build` が成功したかチェック
- 追加ログや詳細なワークフローは `docs/DEPLOYMENT.md` を参照

## ドキュメント

- 英語版詳細ガイド: `docs/DEPLOYMENT.md`
- 実装メモ: `docs/IMPLEMENTATION.md`
- DataRobot 公式ドキュメント: https://docs.datarobot.com/



