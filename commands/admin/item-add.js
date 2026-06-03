// ============================================================
//  commands/admin/item-add.js - アイテム追加コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db      = require('../../utils/database');
const embeds  = require('../../utils/embeds');
const { requireAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item-add')
    .setDescription('貸し出しアイテムを追加する（管理者のみ）')
    .addStringOption(opt =>
      opt.setName('name').setDescription('アイテム名').setRequired(true))
    .addStringOption(opt =>
      opt.setName('category').setDescription('カテゴリ（例: 機材、書籍、工具）'))
    .addIntegerOption(opt =>
      opt.setName('quantity').setDescription('在庫数（デフォルト: 1）').setMinValue(1))
    .addStringOption(opt =>
      opt.setName('description').setDescription('説明')),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;

    await interaction.deferReply();

    const name        = interaction.options.getString('name');
    const category    = interaction.options.getString('category') ?? '未分類';
    const quantity    = interaction.options.getInteger('quantity') ?? 1;
    const description = interaction.options.getString('description') ?? '';
    const guildId     = interaction.guildId;

    const result = db.items.add(guildId, name, description, category, quantity, interaction.user.id);

    await interaction.editReply({
      embeds: [
        embeds.success(
          'アイテムを追加しました',
          `**${name}** をアイテムリストに追加しました！`,
          [
            { name: 'アイテムID', value: `#${result.lastInsertRowid}`, inline: true },
            { name: 'カテゴリ', value: category, inline: true },
            { name: '在庫数', value: `${quantity}個`, inline: true },
            ...(description ? [{ name: '説明', value: description }] : []),
          ]
        ),
      ],
    });
  },
};
