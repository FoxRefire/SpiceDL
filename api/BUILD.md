# ビルドガイド

このディレクトリには、spiceDL2 APIを様々なプラットフォーム向けにビルドするためのスクリプトが含まれています。

## サポートされているビルド形式

- **DEB**: Debian/Ubuntu向けパッケージ（FPM使用）
- **RPM**: Red Hat/CentOS/Fedora向けパッケージ（FPM使用）
- **EXE**: Windows向け実行ファイル（Nuitka使用）
- **APP**: macOS向けアプリケーションバンドル（Py2App使用）

## 前提条件

### 全プラットフォーム共通
- Python 3.11以上
- pip

### DEB/RPMビルド（Linux）
```bash
# FPMのインストール
sudo apt-get install ruby ruby-dev build-essential
sudo gem install fpm
```

### EXEビルド（Windows）
```bash
# Nuitkaのインストール
pip install nuitka
```

### APPビルド（macOS）
```bash
# Py2Appのインストール
pip install py2app
```

## ビルド方法

### DEB/RPMパッケージのビルド

```bash
cd api
chmod +x build_fpm.sh
./build_fpm.sh
```

環境変数でバージョンとアーキテクチャを指定できます：

```bash
VERSION=1.0.0 ARCH=amd64 ./build_fpm.sh
```

ビルドされたパッケージは `build/fpm/` ディレクトリに生成されます。

### Windows EXEのビルド

```bash
cd api
python nuitka_build.py
```

ビルドされたEXEは `build/nuitka/dist/` ディレクトリに生成されます。

### macOS Appバンドルのビルド

```bash
cd api
chmod +x build_py2app.sh
./build_py2app.sh
```

ビルドされたAppバンドルは `build/py2app/dist/` ディレクトリに生成されます。

## GitHub Actionsでの自動ビルド

`.github/workflows/build.yml` が設定されており、以下のトリガーで自動ビルドが実行されます：

1. **タグプッシュ**: `v*` 形式のタグをプッシュすると、全プラットフォーム向けにビルドされます
2. **手動実行**: GitHub ActionsのUIから手動でワークフローを実行できます

### リリースの作成

タグをプッシュすると、自動的にGitHubリリースが作成され、ビルドされたパッケージがアップロードされます：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## トラブルシューティング

### FPMビルドエラー

- RubyとFPMが正しくインストールされているか確認してください
- 依存関係が不足している場合は、エラーメッセージに従ってインストールしてください

### Nuitkaビルドエラー

- Nuitkaが最新バージョンであることを確認してください: `pip install --upgrade nuitka`
- 必要なモジュールがすべて含まれているか確認してください
- Windowsでは、Visual C++ Build Toolsが必要な場合があります

### Py2Appビルドエラー

- macOSでのみ実行可能です
- PySide6の依存関係が正しくインストールされているか確認してください
- アイコンファイル（.icns）を追加する場合は、`setup.py`の`iconfile`オプションを更新してください

## カスタマイズ

### バージョン情報の変更

各ビルドスクリプトでバージョン情報を変更できます：

- **FPM**: `build_fpm.sh`の`VERSION`変数
- **Nuitka**: `nuitka_build.py`内で直接指定
- **Py2App**: `setup.py`の`version`と`CFBundleVersion`

### アイコンの追加

- **Windows**: `icon.ico`ファイルを`api/`ディレクトリに配置
- **macOS**: `icon.icns`ファイルを`api/`ディレクトリに配置し、`setup.py`の`iconfile`を更新

