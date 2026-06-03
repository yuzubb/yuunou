// ============================================================
//  commands/_TEMPLATE.js
//  👆 このファイルをコピーして commands/ 以下の好きな場所に置けばOK！
//     Botを再起動するだけで自動登録されます。
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db      = require('../utils/database');     // DB操作
const embeds  = require('../utils/embeds');       // キレイなEmbed
const { requireAdmin } = require('../utils/permissions'); // 権限チェック
const { parseDuration, toDiscordTimestamp } = require('../utils/dateHelper');

module.exports = {
  // ────────────────────────────────────────────────────────
  //  コマンド定義
  // ────────────────────────────────────────────────────────
  data: new SlashCommandBuilder()
    .setName('コマンド名')          // ← スラッシュコマンド名（英小文字・ハイフンのみ）
    .setDescription('コマンドの説明文')

    // ── よく使うオプションの例 ──
    .addStringOption(opt =>
      opt.setName('text')
        .setDescription('テキストを入力')
        .setRequired(true))

    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('ユーザーを選択'))

    .addIntegerOption(opt =>
      opt.setName('number')
        .setDescription('数値を入力')
        .setMinValue(1)
        .setMaxValue(100))

    .addBooleanOption(opt =>
      opt.setName('flag')
        .setDescription('ON/OFF'))

    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('ロールを選択'))

    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('チャンネルを選択')),

  // ────────────────────────────────────────────────────────
  //  コマンド実行
  // ────────────────────────────────────────────────────────
  async execute(interaction) {
    // 管理者のみにしたい場合はこの行を追加:
    // if (!await requireAdmin(interaction)) return;

    // 処理に時間がかかる場合は必ず deferReply() する
    await interaction.deferReply();
    // ephemeral: true にすると自分だけに見えるレスポンスになる
    // await interaction.deferReply({ ephemeral: true });

    // ── オプションの取得 ──
    const text    = interaction.options.getString('text');
    const user    = interaction.options.getUser('user');
    const number  = interaction.options.getInteger('number');
    const guildId = interaction.guildId;

    // ── 処理 ──
    // ここに処理を書く

    // ── 返信 ──
    await interaction.editReply({
      embeds: [
        // embeds.success(タイトル, 説明, フィールド配列)
        embeds.success('完了', `${text} の処理が完了しました！`, [
          { name: 'フィールド1', value: '値1', inline: true },
          { name: 'フィールド2', value: '値2', inline: true },
        ]),
        // 他にも: embeds.error / embeds.warning / embeds.info
      ],
    });
  },
};
