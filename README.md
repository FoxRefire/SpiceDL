# spiceDL2

Spotifyから音楽をダウンロードするためのSpicetify拡張機能とAPIサーバー

## 機能

### Spicetify拡張機能
- 曲とアルバムのコンテキストメニューに「Download with SpiceDL」ボタンを追加
- ダウンロード状況を確認するページ（プロフィールメニューからアクセス可能）
- SpiceDL APIサーバーと連携してダウンロードを管理

### APIサーバー
- REST APIでSpotifyのURLを受け取り、spotDLを使ってダウンロード
- ダウンロード進行状況の取得
- GUI設定画面（ダウンロード先フォルダ、ポート設定など）
- タスクバーにアイコンを常駐（マルチプラットフォーム対応）

## セットアップ

### 1. APIサーバーのセットアップ

詳細は [api/README.md](./api/README.md) を参照してください。

```bash
cd api
pip install -r requirements.txt
pip install spotdl
python app.py
```

### 2. Spicetify拡張機能のビルド

```bash
npm install
npm run build
```

### 3. Spicetifyへの適用

```bash
spicetify apply
```

## 使用方法

### APIサーバーの起動

1. `api`ディレクトリで`python app.py`を実行
2. タスクバーにアイコンが表示されます
3. アイコンを右クリックして「Settings」から設定を変更できます

### Spicetify拡張機能の使用

1. Spotifyで曲やアルバムを右クリック
2. 「Download with spotDL」を選択
3. ダウンロードが開始されます
4. プロフィールメニューから「Download Status」を選択して進行状況を確認

## ドキュメント

- [APIドキュメント](./api/API_DOCUMENTATION.md) - APIの詳細な使用方法
- [API README](./api/README.md) - APIサーバーのセットアップと使用方法

## 技術スタック

- **Spicetify Creator** - Spicetify拡張機能の開発
- **TypeScript/React** - 拡張機能のUI
- **Python/Flask** - REST APIサーバー
- **spotDL** - Spotifyからの音楽ダウンロード
- **pystray** - システムトレイアイコン
- **tkinter** - 設定GUI

## 開発

### 拡張機能の開発

```bash
npm run watch  # ファイル変更を監視して自動ビルド
```

### APIサーバーの開発

```bash
cd api
python main.py  # 開発モードで起動（GUIなし）
```

## ライセンス

MIT