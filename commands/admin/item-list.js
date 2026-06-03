// ============================================================
//  commands/admin/item-list.js - アイテム一覧コマンド
// ============================================================

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db     = require('../../utils/database');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item-list')
    .setDescription('登録されているアイテム一覧を表示'),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const items   = db.items.getAll(guildId);

    if (items.length === 0) {
      return interaction.editReply({
        embeds: [embeds.info('アイテム一覧', 'アイテムがまだ登録されていません。\n`/item-add` でアイテムを追加してください。')],
      });
    }

    // カテゴリごとにグループ化
    const byCategory = {};
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    }

    const embed = new EmbedBuilder()
      .setColor(embeds.COLORS.info)
      .setTitle(`📦 アイテム一覧 (${items.length}件)`)
      .setTimestamp();

    for (const [cat, catItems] of Object.entries(byCategory)) {
      const lines = catItems.map(item => {
        const borrowed   = db.items.borrowedCount(item.id);
        const available  = item.quantity - borrowed;
        const avIcon     = available > 0 ? '✅' : '❌';
        return `${avIcon} **#${item.id}** ${item.name} (${available}/${item.quantity}個)`;
      });
      embed.addFields({ name: `📂 ${cat}`, value: lines.join('\n') });
    }

    embed.setFooter({ text: '✅ 在庫あり | ❌ 貸出中 | /lend <name> で貸し出し' });

    await interaction.editReply({ embeds: [embed] });
  },
};
