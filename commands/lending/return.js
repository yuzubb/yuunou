// ============================================================
//  commands/lending/return.js - 返却コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db      = require('../../utils/database');
const embeds  = require('../../utils/embeds');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('return')
    .setDescription('アイテムを返却する')
    .addIntegerOption(opt =>
      opt.setName('loan_id').setDescription('貸し出しID（/list で確認）').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    await interaction.deferReply();

    const loanId  = interaction.options.getInteger('loan_id');
    const guildId = interaction.guildId;

    const loan = db.loans.getById(loanId, guildId);
    if (!loan) {
      return interaction.editReply({
        embeds: [embeds.error('見つかりません', `貸し出し #${loanId} は存在しないか、このサーバーのものではありません。`)],
      });
    }

    if (loan.status === 'returned') {
      return interaction.editReply({
        embeds: [embeds.warning('すでに返却済み', `貸し出し #${loanId} はすでに返却されています。`)],
      });
    }

    // 権限チェック: 借り主・貸し主・管理者のみ
    const { isAdmin } = require('../../utils/permissions');
    const isOwner = interaction.user.id === loan.borrower_id || interaction.user.id === loan.lender_id;
    if (!isOwner && !isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [embeds.error('権限エラー', '返却できるのは借り主、貸し主、または管理者のみです。')],
      });
    }

    db.loans.return(loanId, guildId);

    await interaction.editReply({
      embeds: [
        embeds.success(
          '返却完了',
          `貸し出し **#${loanId}** が返却されました！`,
          [
            { name: 'アイテム', value: loan.item_name, inline: true },
            { name: '借り主', value: `<@${loan.borrower_id}>`, inline: true },
            { name: '貸し主', value: `<@${loan.lender_id}>`, inline: true },
          ]
        ),
      ],
    });

    // ログ記録
    await log(interaction.client, guildId, '返却', [
      { name: '貸し出しID', value: `#${loanId}`, inline: true },
      { name: 'アイテム', value: loan.item_name, inline: true },
      { name: '処理者', value: `<@${interaction.user.id}>`, inline: true },
    ]);
  },
};
