// ============================================================
//  commands/lending/loan-detail.js - 貸し出し詳細コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db     = require('../../utils/database');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loan-detail')
    .setDescription('貸し出しの詳細を表示')
    .addIntegerOption(opt =>
      opt.setName('loan_id').setDescription('貸し出しID').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const loanId  = interaction.options.getInteger('loan_id');
    const guildId = interaction.guildId;

    const loan = db.loans.getById(loanId, guildId);
    if (!loan) {
      return interaction.editReply({
        embeds: [embeds.error('見つかりません', `貸し出し #${loanId} は存在しません。`)],
      });
    }

    const item = db.items.getById(loan.item_id, guildId);
    await interaction.editReply({ embeds: [embeds.loanCard(loan, item)] });
  },
};
