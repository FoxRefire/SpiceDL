# spotDL API Server

マルチプラットフォーム対応のSpotifyダウンロードAPIサーバー

## 機能

- REST APIでSpotifyのURLを受け取り、spotDLを使ってダウンロード
- ダウンロード進行状況の取得
- GUI設定画面（ダウンロード先フォルダ、ポート設定など）
- タスクバーにアイコンを常駐

## セットアップ

### 1. spotDLのインストール

まず、spotDLをインストールする必要があります：

```bash
# pipでインストール
pip install spotdl

# または、最新版をインストール
pip install git+https://github.com/spotDL/spotify-downloader.git
```

### 2. Python依存関係のインストール

```bash
cd api
pip install -r requirements.txt
```

## 使用方法

詳細なAPIドキュメントについては、[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)を参照してください。

### 起動

```bash
python app.py
```

起動すると：
- タスクバーにアイコンが表示されます
- アイコンを右クリックして「Settings」から設定を変更できます
- デフォルトで `http://127.0.0.1:5000` でAPIサーバーが起動します

### APIエンドポイント

#### POST /download
SpotifyのURLを送信してダウンロードを開始

```bash
curl -X POST http://127.0.0.1:5000/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/track/..."}'
```

レスポンス:
```json
{
  "success": true,
  "download_id": "dl_20240101_120000_123456",
  "message": "Download started"
}
```

#### GET /status
ダウンロードの進行状況を取得

```bash
# すべてのダウンロードの状態を取得
curl http://127.0.0.1:5000/status

# 特定のダウンロードの状態を取得
curl http://127.0.0.1:5000/status?id=dl_20240101_120000_123456
```

レスポンス:
```json
{
  "id": "dl_20240101_120000_123456",
  "url": "https://open.spotify.com/track/...",
  "status": "downloading",
  "progress": 45,
  "message": "Downloading...",
  "started_at": "2024-01-01T12:00:00",
  "completed_at": null,
  "error": null
}
```

#### POST /cancel
ダウンロードをキャンセル

```bash
curl -X POST http://127.0.0.1:5000/cancel \
  -H "Content-Type: application/json" \
  -d '{"id": "dl_20240101_120000_123456"}'
```

#### GET /health
ヘルスチェック

```bash
curl http://127.0.0.1:5000/health
```

## 設定

設定は `config.json` ファイルに保存されます。GUIから変更するか、直接編集することもできます。

```json
{
  "download_folder": "/path/to/downloads",
  "port": 5000,
  "host": "127.0.0.1"
}
```

## 対応プラットフォーム

- Windows
- macOS
- Linux

## 注意事項

- spotDLが正しくインストールされている必要があります
- ダウンロード先フォルダへの書き込み権限が必要です
- 初回起動時は設定ウィンドウが表示される場合があります

