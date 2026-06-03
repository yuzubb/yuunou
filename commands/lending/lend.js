// ============================================================
//  commands/lending/lend.js - 貸し出しコマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db         = require('../../utils/database');
const embeds     = require('../../utils/embeds');
const { parseDuration, toDiscordTimestamp } = require('../../utils/dateHelper');
const { log }    = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lend')
    .setDescription('アイテムを貸し出す')
    .addStringOption(opt =>
      opt.setName('item').setDescription('アイテム名（部分一致）').setRequired(true))
    .addUserOption(opt =>
      opt.setName('borrower').setDescription('借り主のユーザー').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('quantity').setDescription('数量（デフォルト: 1）').setMinValue(1))
    .addStringOption(opt =>
      opt.setName('due').setDescription('返却期限 例: 3d=3日, 2w=2週間, 1m=1ヶ月'))
    .addStringOption(opt =>
      opt.setName('note').setDescription('メモ（任意）')),

  async execute(interaction) {
    await interaction.deferReply();

    const itemQuery  = interaction.options.getString('item');
    const borrower   = interaction.options.getUser('borrower');
    const quantity   = interaction.options.getInteger('quantity') ?? 1;
    const dueStr     = interaction.options.getString('due');
    const note       = interaction.options.getString('note') ?? '';
    const guildId    = interaction.guildId;

    // アイテム検索
    const found = db.items.getByName(guildId, itemQuery);
    if (found.length === 0) {
      return interaction.editReply({
        embeds: [embeds.error('アイテムが見つかりません', `「${itemQuery}」に一致するアイテムがありません。\n\`/item-add\` でアイテムを追加してください。`)],
      });
    }
    if (found.length > 1) {
      const list = found.map(i => `**#${i.id}** ${i.name}`).join('\n');
      return interaction.editReply({
        embeds: [embeds.warning('複数のアイテムが見つかりました', `アイテムIDを使って \`/lend-id\` で指定してください:\n${list}`)],
      });
    }

    const item = found[0];

    // 在庫チェック
    const borrowed = db.items.borrowedCount(item.id);
    const available = item.quantity - borrowed;
    if (available < quantity) {
      return interaction.editReply({
        embeds: [embeds.error('在庫不足', `**${item.name}** の在庫が不足しています。\n在庫: ${item.quantity}個 / 貸出中: ${borrowed}個 / 利用可能: ${available}個`)],
      });
    }

    // 期限日計算
    const dueDate = dueStr ? parseDuration(dueStr) : null;
    if (dueStr && !dueDate) {
      return interaction.editReply({
        embeds: [embeds.error('日付形式エラー', '期限の形式が正しくありません。\n例: `3d`(3日後) `2w`(2週間後) `1m`(1ヶ月後)')],
      });
    }

    // 貸し出し記録作成
    const result = db.loans.create(
      guildId, item.id, borrower.id, interaction.user.id,
      quantity, dueDate?.toISOString() ?? null, note
    );

    const dueText = dueDate ? toDiscordTimestamp(dueDate, 'f') : '未設定';

    await interaction.editReply({
      embeds: [
        embeds.success(
          '貸し出し完了',
          `**${item.name}** を <@${borrower.id}> に貸し出しました！`,
          [
            { name: 'アイテム', value: item.name, inline: true },
            { name: '数量', value: `${quantity}個`, inline: true },
            { name: '貸し出しID', value: `#${result.lastInsertRowid}`, inline: true },
            { name: '返却期限', value: dueText, inline: true },
            ...(note ? [{ name: 'メモ', value: note }] : []),
          ]
        ),
      ],
    });

    // ログ記録
    await log(interaction.client, guildId, '貸し出し', [
      { name: 'アイテム', value: item.name, inline: true },
      { name: '貸し主', value: `<@${interaction.user.id}>`, inline: true },
      { name: '借り主', value: `<@${borrower.id}>`, inline: true },
      { name: '数量', value: `${quantity}個`, inline: true },
      { name: '返却期限', value: dueText, inline: true },
    ]);

    // 借り主にDM通知
    const settings = db.settings.get(guildId);
    if (settings?.reminder_dm !== 0) {
      const dm = await borrower.createDM().catch(() => null);
      if (dm) {
        await dm.send({
          embeds: [
            embeds.info(
              '📦 アイテムが貸し出されました',
              `**${interaction.guild.name}** の <@${interaction.user.id}> から「**${item.name}**」が貸し出されました。`,
              [
                { name: '返却期限', value: dueText },
                ...(note ? [{ name: 'メモ', value: note }] : []),
              ]
            ),
          ],
        }).catch(() => {});
      }
    }
  },
};
