// ============================================================
//  commands/admin/remind.js - 延滞リマインド送信コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db      = require('../../utils/database');
const embeds  = require('../../utils/embeds');
const { toDiscordTimestamp, daysUntil } = require('../../utils/dateHelper');
const { requireAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('延滞者にリマインドDMを一括送信（管理者のみ）'),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId;
    db.loans.updateOverdueStatus(guildId);

    const overdueLoans = db.loans.getOverdue(guildId);

    if (overdueLoans.length === 0) {
      return interaction.editReply({
        embeds: [embeds.success('延滞なし', '延滞中の貸し出しはありません 🎉')],
      });
    }

    let sentCount = 0;
    let failCount = 0;

    for (const loan of overdueLoans) {
      try {
        const borrower = await interaction.client.users.fetch(loan.borrower_id);
        const dm       = await borrower.createDM();
        const dueText  = toDiscordTimestamp(loan.due_date, 'f');
        const overText = daysUntil(loan.due_date);

        await dm.send({
          embeds: [
            embeds.warning(
              '⚠️ 返却期限が過ぎています',
              `**${interaction.guild.name}** から借りている「**${loan.item_name}**」の返却期限が過ぎています。\n早めにご返却ください。`,
              [
                { name: '貸し出しID', value: `#${loan.id}`, inline: true },
                { name: '返却期限', value: dueText, inline: true },
                { name: '延滞', value: overText, inline: true },
              ]
            ),
          ],
        });
        sentCount++;
      } catch {
        failCount++;
      }
    }

    await interaction.editReply({
      embeds: [
        embeds.info(
          'リマインド送信完了',
          `延滞者 ${overdueLoans.length} 人にリマインドを送信しました。`,
          [
            { name: '成功', value: `${sentCount}件`, inline: true },
            { name: '失敗（DM拒否など）', value: `${failCount}件`, inline: true },
          ]
        ),
      ],
    });
  },
};
