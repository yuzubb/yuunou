// ============================================================
//  commands/lending/history.js - 貸し出し履歴コマンド
// ============================================================

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db     = require('../../utils/database');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('貸し出し履歴を表示（直近20件）')
    .addIntegerOption(opt =>
      opt.setName('limit').setDescription('表示件数（最大50）').setMinValue(1).setMaxValue(50)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId;
    const limit   = interaction.options.getInteger('limit') ?? 20;

    const history = db.loans.history(guildId, limit);

    if (history.length === 0) {
      return interaction.editReply({
        embeds: [embeds.info('履歴', '貸し出し履歴はまだありません。')],
      });
    }

    const statusIcon = { active: '🟢', returned: '✅', overdue: '🔴' };

    const lines = history.map(loan => {
      const icon   = statusIcon[loan.status] ?? '❓';
      const date   = new Date(loan.created_at).toLocaleDateString('ja-JP');
      return `${icon} **#${loan.id}** \`${loan.item_name}\` → <@${loan.borrower_id}> (${date})`;
    });

    const embed = new EmbedBuilder()
      .setColor(embeds.COLORS.info)
      .setTitle(`📜 貸し出し履歴 (直近${history.length}件)`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: '✅ 返却済み | 🟢 貸出中 | 🔴 延滞' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
