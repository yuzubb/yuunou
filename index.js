// ============================================================
//  Discord 貸し出し管理Bot - メインエントリーポイント
//  commands/ フォルダにファイルを置くだけでコマンド自動登録！
// ============================================================

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const db   = require('./utils/database');
require('dotenv').config();

// ── クライアント初期化 ──────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// ── コマンド自動読み込み ────────────────────────────────────
// commands/ 以下のサブフォルダを再帰的にスキャン
function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath); // サブフォルダも再帰的に読み込み
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data?.name) {
        client.commands.set(command.data.name, command);
        console.log(`✅ コマンド読み込み: /${command.data.name}`);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'commands'));

// ── イベント自動読み込み ────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`📡 イベント登録: ${event.name}`);
}

// ── スラッシュコマンド登録 ──────────────────────────────────
async function registerSlashCommands() {
  const commands = [...client.commands.values()].map(c => c.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 スラッシュコマンドを登録中...');
    if (process.env.GUILD_ID) {
      // 開発中: ギルド限定で即時反映
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✨ ギルドコマンド登録完了 (${commands.length}個)`);
    } else {
      // 本番: グローバル登録（反映まで最大1時間）
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✨ グローバルコマンド登録完了 (${commands.length}個)`);
    }
  } catch (err) {
    console.error('❌ コマンド登録エラー:', err);
  }
}

// ── 起動 ──────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`\n🤖 ${client.user.tag} としてログイン完了！`);
  await db.init();
  await registerSlashCommands();
  console.log('🚀 Botが起動しました！\n');
});

client.login(process.env.DISCORD_TOKEN);
