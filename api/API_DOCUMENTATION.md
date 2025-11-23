# spotDL API ドキュメント

このドキュメントでは、spotDL APIサーバーの使用方法について詳しく説明します。

## 目次

- [基本情報](#基本情報)
- [エンドポイント一覧](#エンドポイント一覧)
- [エンドポイント詳細](#エンドポイント詳細)
- [レスポンス形式](#レスポンス形式)
- [エラーハンドリング](#エラーハンドリング)
- [使用例](#使用例)
- [よくある質問](#よくある質問)

## 基本情報

### ベースURL

デフォルトでは、APIサーバーは以下のURLで起動します：

```
http://127.0.0.1:5000
```

設定で変更可能です（GUI設定画面または`config.json`で変更）。

### リクエスト形式

- **Content-Type**: `application/json`（POSTリクエストの場合
- **メソッド**: GET, POST
- **エンコーディング**: UTF-8

### レスポンス形式

すべてのレスポンスはJSON形式で返されます。

## エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| POST | `/download` | SpotifyのURLを送信してダウンロードを開始 |
| GET | `/status` | ダウンロードの進行状況を取得 |
| POST | `/cancel` | ダウンロードをキャンセル |
| GET | `/health` | サーバーのヘルスチェック |

## エンドポイント詳細

### POST /download

SpotifyのURLを受け取り、ダウンロードを開始します。

#### リクエスト

**URL**: `http://127.0.0.1:5000/download`

**メソッド**: `POST`

**ヘッダー**:
```
Content-Type: application/json
```

**ボディ**:
```json
{
  "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
}
```

**パラメータ**:
- `url` (string, 必須): SpotifyのURL
  - 対応形式:
    - トラック: `https://open.spotify.com/track/{track_id}`
    - アルバム: `https://open.spotify.com/album/{album_id}`
    - プレイリスト: `https://open.spotify.com/playlist/{playlist_id}`
    - アーティスト: `https://open.spotify.com/artist/{artist_id}`

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "success": true,
  "download_id": "dl_20240101_120000_123456",
  "message": "Download started"
}
```

**エラー時 (400 Bad Request)**:
```json
{
  "error": "Missing 'url' parameter"
}
```

または

```json
{
  "error": "Invalid Spotify URL format"
}
```

**エラー時 (500 Internal Server Error)**:
```json
{
  "error": "Error message here"
}
```

#### 使用例

**cURL**:
```bash
curl -X POST http://127.0.0.1:5000/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}'
```

**Python (requests)**:
```python
import requests

url = "http://127.0.0.1:5000/download"
payload = {
    "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
}
response = requests.post(url, json=payload)
print(response.json())
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5000/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

### GET /status

ダウンロードの進行状況を取得します。

#### リクエスト

**URL**: `http://127.0.0.1:5000/status`

**メソッド**: `GET`

**クエリパラメータ**:
- `id` (string, オプション): 特定のダウンロードIDを指定。省略するとすべてのダウンロードの状態を返します。

#### レスポンス

**特定のダウンロードを取得 (200 OK)**:
```json
{
  "id": "dl_20240101_120000_123456",
  "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
  "status": "downloading",
  "progress": 45,
  "message": "Downloading...",
  "started_at": "2024-01-01T12:00:00.123456",
  "completed_at": null,
  "error": null
}
```

**すべてのダウンロードを取得 (200 OK)**:
```json
{
  "downloads": [
    {
      "id": "dl_20240101_120000_123456",
      "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      "status": "completed",
      "progress": 100,
      "message": "Download completed successfully",
      "started_at": "2024-01-01T12:00:00.123456",
      "completed_at": "2024-01-01T12:05:30.654321",
      "error": null
    },
    {
      "id": "dl_20240101_120100_789012",
      "url": "https://open.spotify.com/album/...",
      "status": "downloading",
      "progress": 30,
      "message": "Downloading...",
      "started_at": "2024-01-01T12:01:00.789012",
      "completed_at": null,
      "error": null
    }
  ],
  "total": 2
}
```

**ダウンロードが見つからない場合 (200 OK)**:
```json
{
  "error": "Download not found"
}
```

#### ステータス値

- `starting`: ダウンロードを開始中
- `downloading`: ダウンロード中
- `completed`: ダウンロード完了
- `failed`: ダウンロード失敗
- `cancelled`: ダウンロードがキャンセルされた

#### 使用例

**cURL**:
```bash
# すべてのダウンロードの状態を取得
curl http://127.0.0.1:5000/status

# 特定のダウンロードの状態を取得
curl "http://127.0.0.1:5000/status?id=dl_20240101_120000_123456"
```

**Python (requests)**:
```python
import requests
import time

# ダウンロードを開始
download_response = requests.post(
    "http://127.0.0.1:5000/download",
    json={"url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}
)
download_id = download_response.json()["download_id"]

# 進行状況をポーリング
while True:
    status_response = requests.get(
        f"http://127.0.0.1:5000/status?id={download_id}"
    )
    status = status_response.json()
    
    print(f"Status: {status['status']}, Progress: {status['progress']}%")
    
    if status['status'] in ['completed', 'failed', 'cancelled']:
        break
    
    time.sleep(2)  # 2秒待機
```

**JavaScript (fetch)**:
```javascript
// すべてのダウンロードの状態を取得
fetch('http://127.0.0.1:5000/status')
  .then(response => response.json())
  .then(data => {
    console.log(`Total downloads: ${data.total}`);
    data.downloads.forEach(dl => {
      console.log(`${dl.id}: ${dl.status} (${dl.progress}%)`);
    });
  });

// 特定のダウンロードの状態を取得
const downloadId = 'dl_20240101_120000_123456';
fetch(`http://127.0.0.1:5000/status?id=${downloadId}`)
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### POST /cancel

実行中のダウンロードをキャンセルします。

#### リクエスト

**URL**: `http://127.0.0.1:5000/cancel`

**メソッド**: `POST`

**ヘッダー**:
```
Content-Type: application/json
```

**ボディ**:
```json
{
  "id": "dl_20240101_120000_123456"
}
```

**パラメータ**:
- `id` (string, 必須): キャンセルするダウンロードのID

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "success": true,
  "message": "Download cancelled"
}
```

**エラー時 (400 Bad Request)**:
```json
{
  "error": "Missing 'id' parameter"
}
```

**エラー時 (404 Not Found)**:
```json
{
  "error": "Download not found or cannot be cancelled"
}
```

#### 使用例

**cURL**:
```bash
curl -X POST http://127.0.0.1:5000/cancel \
  -H "Content-Type: application/json" \
  -d '{"id": "dl_20240101_120000_123456"}'
```

**Python (requests)**:
```python
import requests

response = requests.post(
    "http://127.0.0.1:5000/cancel",
    json={"id": "dl_20240101_120000_123456"}
)
print(response.json())
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5000/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'dl_20240101_120000_123456'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

### GET /health

サーバーのヘルスチェックを行います。サーバーが正常に動作しているか確認するために使用します。

#### リクエスト

**URL**: `http://127.0.0.1:5000/health`

**メソッド**: `GET`

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "status": "ok"
}
```

#### 使用例

**cURL**:
```bash
curl http://127.0.0.1:5000/health
```

**Python (requests)**:
```python
import requests

response = requests.get("http://127.0.0.1:5000/health")
print(response.json())  # {"status": "ok"}
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5000/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

## レスポンス形式

### 成功レスポンス

すべての成功レスポンスはHTTPステータスコード `200` を返します。

### エラーレスポンス

エラーレスポンスは以下の形式です：

```json
{
  "error": "Error message here"
}
```

**HTTPステータスコード**:
- `400`: リクエストが不正（パラメータ不足、形式エラーなど）
- `404`: リソースが見つからない（ダウンロードIDが存在しないなど）
- `500`: サーバー内部エラー

## エラーハンドリング

### よくあるエラー

#### 1. "Missing 'url' parameter"
- **原因**: `/download`エンドポイントで`url`パラメータが送信されていない
- **解決方法**: リクエストボディに`url`フィールドを含める

#### 2. "Invalid Spotify URL format"
- **原因**: 送信されたURLがSpotifyのURL形式ではない
- **解決方法**: 正しいSpotifyのURLを送信する（`https://open.spotify.com/...`で始まる必要がある）

#### 3. "Download not found"
- **原因**: 指定されたダウンロードIDが存在しない
- **解決方法**: 正しいダウンロードIDを使用する

#### 4. "Download not found or cannot be cancelled"
- **原因**: ダウンロードが存在しない、または既に完了/失敗/キャンセル済み
- **解決方法**: 実行中のダウンロードのみキャンセル可能

## 使用例

### 完全なワークフロー例（Python）

```python
import requests
import time

BASE_URL = "http://127.0.0.1:5000"

# 1. ヘルスチェック
health = requests.get(f"{BASE_URL}/health")
print("Server status:", health.json())

# 2. ダウンロードを開始
spotify_url = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
download_response = requests.post(
    f"{BASE_URL}/download",
    json={"url": spotify_url}
)

if download_response.status_code == 200:
    download_id = download_response.json()["download_id"]
    print(f"Download started: {download_id}")
    
    # 3. 進行状況を監視
    while True:
        status_response = requests.get(
            f"{BASE_URL}/status",
            params={"id": download_id}
        )
        status = status_response.json()
        
        print(f"Status: {status['status']}, Progress: {status['progress']}%")
        print(f"Message: {status['message']}")
        
        if status['status'] == 'completed':
            print("Download completed successfully!")
            break
        elif status['status'] == 'failed':
            print(f"Download failed: {status.get('error', 'Unknown error')}")
            break
        elif status['status'] == 'cancelled':
            print("Download was cancelled")
            break
        
        time.sleep(2)  # 2秒待機してから再チェック
else:
    print(f"Failed to start download: {download_response.json()}")
```

### 複数のダウンロードを管理（JavaScript）

```javascript
const BASE_URL = 'http://127.0.0.1:5000';

// ダウンロードを開始する関数
async function startDownload(url) {
  const response = await fetch(`${BASE_URL}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url })
  });
  
  const data = await response.json();
  return data.download_id;
}

// 進行状況を取得する関数
async function getStatus(downloadId) {
  const response = await fetch(`${BASE_URL}/status?id=${downloadId}`);
  return await response.json();
}

// すべてのダウンロードの状態を取得
async function getAllStatuses() {
  const response = await fetch(`${BASE_URL}/status`);
  return await response.json();
}

// 使用例
async function downloadMultipleTracks() {
  const urls = [
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    'https://open.spotify.com/track/5Z9KJZvQzH6PFmb8SNkxuk',
    'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6'
  ];
  
  // すべてのダウンロードを開始
  const downloadIds = await Promise.all(
    urls.map(url => startDownload(url))
  );
  
  console.log('Downloads started:', downloadIds);
  
  // 定期的に状態をチェック
  const interval = setInterval(async () => {
    const statuses = await getAllStatuses();
    console.log(`Total: ${statuses.total} downloads`);
    
    statuses.downloads.forEach(dl => {
      console.log(`${dl.id}: ${dl.status} (${dl.progress}%)`);
    });
    
    // すべて完了したら停止
    const allDone = statuses.downloads.every(
      dl => ['completed', 'failed', 'cancelled'].includes(dl.status)
    );
    
    if (allDone) {
      clearInterval(interval);
      console.log('All downloads finished');
    }
  }, 3000);  // 3秒ごとにチェック
}

// 実行
downloadMultipleTracks();
```

## よくある質問

### Q: 同時に複数のダウンロードを開始できますか？

A: はい、可能です。複数の`/download`リクエストを送信することで、同時に複数のダウンロードを実行できます。

### Q: ダウンロードの進行状況はどのくらいの頻度で更新されますか？

A: spotDLの出力に基づいて更新されます。`/status`エンドポイントをポーリングして最新の状態を取得できます。推奨ポーリング間隔は2-5秒です。

### Q: ダウンロードされたファイルはどこに保存されますか？

A: 設定で指定したダウンロード先フォルダに保存されます。デフォルトは`~/Music/spotDL`です。GUI設定画面または`config.json`で変更できます。

### Q: サーバーを再起動すると、進行中のダウンロードはどうなりますか？

A: サーバーを再起動すると、進行中のダウンロード情報は失われます。ダウンロード自体はspotDLプロセスが継続する場合がありますが、API経由で状態を追跡することはできなくなります。

### Q: どのようなSpotifyのURL形式に対応していますか？

A: 以下の形式に対応しています：
- トラック: `https://open.spotify.com/track/{id}`
- アルバム: `https://open.spotify.com/album/{id}`
- プレイリスト: `https://open.spotify.com/playlist/{id}`
- アーティスト: `https://open.spotify.com/artist/{id}`

### Q: エラーが発生した場合、どのようにデバッグすればよいですか？

A: ダウンロードが失敗した場合、`/status`エンドポイントのレスポンスに`error`フィールドが含まれます。このフィールドにはエラーの詳細が含まれています。また、サーバーのコンソール出力も確認してください。

### Q: APIサーバーのポートを変更できますか？

A: はい、GUI設定画面から変更できます。または`config.json`ファイルを直接編集することもできます。

### Q: リモートからAPIにアクセスできますか？

A: デフォルトでは`127.0.0.1`（localhost）でのみリッスンしています。リモートアクセスを許可するには、設定で`host`を`0.0.0.0`に変更してください。ただし、セキュリティに注意してください。

---

## サポート

問題が発生した場合や質問がある場合は、プロジェクトのGitHubリポジトリのIssuesセクションで報告してください。


