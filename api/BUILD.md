# ビルドガイド

このドキュメントでは、spotDL APIを各プラットフォーム向けにビルドする方法を説明します。

## 前提条件

### 共通
- Python 3.11以上
- pip
- spotDLがインストールされていること（またはビルドスクリプトが自動インストールを試みます）

### Windows
- PyInstaller (`pip install pyinstaller`)

### macOS
- Py2App (`pip install py2app`)
- Xcode Command Line Tools

### Linux
- Ruby (`sudo apt-get install ruby ruby-dev`)
- FPM (`sudo gem install fpm`)
- rpm-build (RPMパッケージをビルドする場合)

## ビルド方法

### Windows (.exe)

1. 依存関係のインストール:
```bash
cd api
pip install -r requirements.txt
pip install pyinstaller
```

2. ビルド実行:
```bash
pyinstaller spotdl-api.spec --clean --noconfirm
```

または、バッチスクリプトを使用:
```bash
build_windows.bat 1.0.0
```

3. 成果物:
- `dist/spotdl-api.exe` - 実行可能ファイル

### macOS (.app)

1. 依存関係のインストール:
```bash
cd api
pip install -r requirements.txt
pip install py2app
```

2. ビルド実行:
```bash
python3 setup_macos.py py2app
```

または、シェルスクリプトを使用:
```bash
chmod +x build_macos.sh
./build_macos.sh
```

3. 成果物:
- `dist/spotdl-api.app` - アプリケーションバンドル
- `dist/spotdl-api.dmg` - DMGファイル（オプション）

### Linux (.deb / .rpm)

1. システム依存関係のインストール:
```bash
sudo apt-get update
sudo apt-get install -y ruby ruby-dev rubygems build-essential
sudo gem install fpm
```

2. ビルド実行:
```bash
cd api
chmod +x build_linux.sh
VERSION=1.0.0 ./build_linux.sh
```

3. 成果物:
- `dist/spotdl-api_1.0.0_amd64.deb` - Debian/Ubuntu用パッケージ
- `dist/spotdl-api-1.0.0-1.amd64.rpm` - RedHat/CentOS/Fedora用パッケージ

## GitHub Actions CI

### 自動ビルド

リリースタグをプッシュすると、GitHub Actionsが自動的に全プラットフォーム向けのビルドを実行します:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 手動実行

1. GitHubリポジトリの「Actions」タブに移動
2. 「Build Packages」ワークフローを選択
3. 「Run workflow」をクリック
4. バージョン番号を入力して実行

### 成果物の取得

ビルドが完了すると、各ジョブの「Artifacts」セクションから成果物をダウンロードできます。

リリースが作成されると、GitHub Releasesページからもダウンロードできます。

## トラブルシューティング

### Windows

- **エラー: "pyinstaller: command not found"**
  - `pip install pyinstaller` を実行してください

- **エラー: "ModuleNotFoundError"**
  - `hiddenimports` に不足しているモジュールを追加してください（`spotdl-api.spec`を編集）

### macOS

- **エラー: "py2app: command not found"**
  - `pip install py2app` を実行してください

- **エラー: "codesign" エラー**
  - 開発者証明書が必要な場合があります。`setup_macos.py`の`codesign_identity`を設定してください

### Linux

- **エラー: "fpm: command not found"**
  - `sudo gem install fpm` を実行してください

- **エラー: "rpm-build not found"**
  - `sudo apt-get install rpm` を実行してください（RPMパッケージをビルドする場合のみ）

## カスタマイズ

### アイコンの追加

各プラットフォームでアイコンを追加するには:

- **Windows**: `spotdl-api.spec`の`icon`パラメータに`.ico`ファイルのパスを指定
- **macOS**: `setup_macos.py`の`iconfile`パラメータに`.icns`ファイルのパスを指定
- **Linux**: `build_linux.sh`でアイコンファイルを`/usr/share/pixmaps/`にコピー

### バージョン番号の変更

ビルドスクリプトの`VERSION`環境変数を変更するか、GitHub Actionsのワークフローでバージョンを指定してください。

## 配布

ビルドされたパッケージは以下のように配布できます:

1. **GitHub Releases**: リリースタグをプッシュすると自動的にアップロードされます
2. **手動アップロード**: ビルド成果物をGitHub Releasesに手動でアップロード
3. **パッケージリポジトリ**: LinuxパッケージをPPAやRPMリポジトリに追加

