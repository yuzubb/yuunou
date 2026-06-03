# 📦 Discord 貸し出し管理Bot

アイテムの貸し出し・返却・延滞管理ができる多機能Discord Botです。

---

## 🚀 セットアップ

### 1. 依存パッケージをインストール

```bash
npm install
```

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env` を開いて以下を入力：

| 変数名 | 取得場所 |
|--------|---------|
| `DISCORD_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token |
| `CLIENT_ID` | Developer Portal → General Information → Application ID |
| `GUILD_ID` | Discordサーバーを右クリック → IDをコピー（開発時のみ） |

### 3. 起動

```bash
npm start
# または開発時（自動再起動）
npm run dev
```

---

## 📁 ファイル構成

```
discord-bot/
├── index.js                   # ← Botのメイン（起動ファイル）
├── .env                       # ← トークン等の設定
│
├── commands/                  # ← コマンドフォルダ（ここにJSを置くだけ！）
│   ├── lending/               # 貸し出し関連コマンド
│   │   ├── lend.js            # /lend       貸し出す
│   │   ├── return.js          # /return     返却する
│   │   ├── list.js            # /list       一覧表示
│   │   ├── loan-detail.js     # /loan-detail 詳細確認
│   │   └── history.js         # /history    履歴表示
│   │
│   ├── admin/                 # 管理者コマンド
│   │   ├── item-add.js        # /item-add   アイテム追加
│   │   ├── item-list.js       # /item-list  アイテム一覧
│   │   ├── item-delete.js     # /item-delete アイテム削除
│   │   ├── settings.js        # /settings   Bot設定
│   │   └── remind.js          # /remind     延滞リマインド
│   │
│   └── utility/               # ユーティリティコマンド
│       ├── ping.js            # /ping       応答確認
│       └── help.js            # /help       ヘルプ表示
│
├── events/                    # Discordイベントハンドラ
│   ├── ready.js               # Bot起動時
│   └── interactionCreate.js   # コマンド受信時
│
├── utils/                     # 共通ユーティリティ
│   ├── database.js            # SQLiteデータベース
│   ├── embeds.js              # Embed作成ヘルパー
│   ├── permissions.js         # 権限チェック
│   ├── dateHelper.js          # 日付変換
│   └── logger.js              # ログチャンネル送信
│
└── data/
    └── lending.db             # SQLiteデータ（自動生成）
```

---

## ✨ コマンドの追加方法

**`commands/` フォルダにJSファイルを置くだけで自動登録されます！**

### コマンドテンプレート

```js
// commands/カテゴリ名/コマンド名.js

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('コマンド名')        // ← スラッシュコマンドの名前
    .setDescription('説明文')
    // オプションの追加例:
    .addStringOption(opt =>
      opt.setName('text').setDescription('テキストを入力').setRequired(true))
    .addUserOption(opt =>
      opt.setName('user').setDescription('ユーザーを選択')),

  async execute(interaction) {
    // オプションの取得
    const text = interaction.options.getString('text');
    const user = interaction.options.getUser('user');

    // 返信
    await interaction.reply({
      embeds: [embeds.success('タイトル', `${text} が入力されました`)],
    });
  },
};
```

### ポイント
- ファイルを保存してBotを再起動するだけ → **自動でコマンド登録完了！**
- サブフォルダは何階層でも OK（再帰的にスキャン）
- `embeds.success/error/warning/info` でキレイなメッセージが簡単に作れる

---

## 🗒️ コマンド一覧

### 貸し出し管理

| コマンド | 説明 |
|---------|------|
| `/lend` | アイテムを貸し出す。名前の一部でも検索できる |
| `/return` | 貸し出しIDを指定して返却 |
| `/list` | 貸し出し中一覧。ユーザー絞り込み・延滞のみ表示も可 |
| `/loan-detail` | 特定の貸し出し詳細を表示 |
| `/history` | 貸し出し履歴（最大50件） |

### アイテム管理（管理者のみ）

| コマンド | 説明 |
|---------|------|
| `/item-add` | アイテムを追加（名前・カテゴリ・在庫数・説明） |
| `/item-list` | カテゴリ別アイテム一覧・在庫確認 |
| `/item-delete` | アイテムを削除（貸出中は不可） |

### Bot設定（管理者のみ）

| コマンド | 説明 |
|---------|------|
| `/settings view` | 現在の設定確認 |
| `/settings log-channel` | ログチャンネル設定 |
| `/settings admin-role` | 管理者ロール設定 |
| `/settings reminder-dm` | 貸し出し時DM通知ON/OFF |
| `/remind` | 延滞者に一括リマインドDM送信 |

---

## 💡 使い方の例

```
# まずアイテムを登録
/item-add name:ゲームコントローラー category:ゲーム機材 quantity:3

# 貸し出す（名前の一部でOK）
/lend item:コントローラー borrower:@ユーザー due:7d note:大切に使ってね

# 一覧確認
/list

# 返却（IDは /list で確認）
/return loan_id:1
```

---

## ⚠️ 注意事項

- `data/lending.db` には貸し出しデータが保存されます。バックアップを忘れずに！
- Botに必要な権限: `Send Messages`, `Use Slash Commands`, `Embed Links`
- DM通知を使う場合、ユーザーのDM設定が有効である必要があります
