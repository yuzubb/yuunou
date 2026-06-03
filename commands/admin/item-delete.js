// ============================================================
//  commands/admin/item-delete.js - アイテム削除コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db      = require('../../utils/database');
const embeds  = require('../../utils/embeds');
const { requireAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item-delete')
    .setDescription('アイテムを削除する（管理者のみ）')
    .addIntegerOption(opt =>
      opt.setName('item_id').setDescription('アイテムID（/item-list で確認）').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const itemId  = interaction.options.getInteger('item_id');
    const guildId = interaction.guildId;

    const item = db.items.getById(itemId, guildId);
    if (!item) {
      return interaction.editReply({
        embeds: [embeds.error('見つかりません', `アイテム #${itemId} は存在しません。`)],
      });
    }

    // 貸し出し中チェック
    const borrowed = db.items.borrowedCount(itemId);
    if (borrowed > 0) {
      return interaction.editReply({
        embeds: [embeds.error('削除できません', `**${item.name}** は現在 ${borrowed}個 貸し出し中です。\n先に返却処理を完了してください。`)],
      });
    }

    db.items.delete(itemId, guildId);

    await interaction.editReply({
      embeds: [embeds.success('アイテムを削除しました', `**${item.name}** (#${itemId}) を削除しました。`)],
    });
  },
};
