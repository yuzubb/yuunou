// ============================================================
//  commands/lending/list.js - 貸し出し一覧コマンド
// ============================================================

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db     = require('../../utils/database');
const embeds = require('../../utils/embeds');
const { toDiscordTimestamp, daysUntil } = require('../../utils/dateHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('現在の貸し出し一覧を表示')
    .addUserOption(opt =>
      opt.setName('user').setDescription('特定ユーザーの貸し出しだけ表示'))
    .addBooleanOption(opt =>
      opt.setName('overdue').setDescription('延滞中のみ表示')),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId     = interaction.guildId;
    const filterUser  = interaction.options.getUser('user');
    const overdueOnly = interaction.options.getBoolean('overdue') ?? false;

    // 延滞ステータス更新
    db.loans.updateOverdueStatus(guildId);

    let loans = filterUser
      ? db.loans.getByBorrower(guildId, filterUser.id)
      : db.loans.getActive(guildId);

    if (overdueOnly) {
      loans = loans.filter(l => l.status === 'overdue');
    }

    if (loans.length === 0) {
      const msg = overdueOnly
        ? '延滞中の貸し出しはありません 🎉'
        : filterUser
          ? `<@${filterUser.id}> の貸し出しはありません。`
          : '現在の貸し出しはありません。';
      return interaction.editReply({ embeds: [embeds.info('貸し出し一覧', msg)] });
    }

    // 10件ごとにページ分割
    const PAGE_SIZE = 10;
    const page      = 1;
    const paginated = loans.slice(0, PAGE_SIZE);

    const lines = paginated.map(loan => {
      const status  = loan.status === 'overdue' ? '🔴' : '🟢';
      const due     = loan.due_date ? `期限: ${daysUntil(loan.due_date)}` : '期限なし';
      return `${status} **#${loan.id}** \`${loan.item_name}\` × ${loan.quantity} → <@${loan.borrower_id}> | ${due}`;
    });

    const totalOverdue = loans.filter(l => l.status === 'overdue').length;

    const embed = new EmbedBuilder()
      .setColor(totalOverdue > 0 ? embeds.COLORS.warning : embeds.COLORS.info)
      .setTitle(`📋 貸し出し一覧 (${loans.length}件)`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `🔴 延滞: ${totalOverdue}件 | /return <ID> で返却 | /loan-detail <ID> で詳細` })
      .setTimestamp();

    if (loans.length > PAGE_SIZE) {
      embed.setFooter({ text: `${PAGE_SIZE}件表示 / 全${loans.length}件 | 🔴 延滞: ${totalOverdue}件` });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
