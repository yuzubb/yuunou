// ============================================================
//  commands/utility/help.js - ヘルプコマンド
// ============================================================

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const COMMANDS = {
  '📦 貸し出し管理': [
    { name: '/lend',        desc: 'アイテムを貸し出す' },
    { name: '/return',      desc: 'アイテムを返却する' },
    { name: '/list',        desc: '貸し出し中一覧を表示' },
    { name: '/loan-detail', desc: '特定の貸し出し詳細を確認' },
    { name: '/history',     desc: '貸し出し履歴を表示' },
  ],
  '🗂️ アイテム管理（管理者）': [
    { name: '/item-add',    desc: 'アイテムを追加' },
    { name: '/item-list',   desc: 'アイテム一覧を表示' },
    { name: '/item-delete', desc: 'アイテムを削除' },
  ],
  '⚙️ 管理（管理者）': [
    { name: '/settings',    desc: 'ログチャンネル・ロール等の設定' },
    { name: '/remind',      desc: '延滞者に一括リマインドDM送信' },
  ],
  '🔧 ユーティリティ': [
    { name: '/ping',        desc: 'Bot応答速度確認' },
    { name: '/help',        desc: 'このヘルプを表示' },
  ],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('使い方とコマンド一覧を表示'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(embeds.COLORS.info)
      .setTitle('📖 貸し出し管理Bot — コマンド一覧')
      .setDescription('アイテムの貸し出し・返却・管理ができるBotです。')
      .setTimestamp();

    for (const [category, commands] of Object.entries(COMMANDS)) {
      embed.addFields({
        name: category,
        value: commands.map(c => `\`${c.name}\` — ${c.desc}`).join('\n'),
      });
    }

    embed.setFooter({ text: '💡 /lend でアイテム名の一部を入力するだけで検索できます' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
