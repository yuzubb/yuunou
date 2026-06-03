// ============================================================
//  utils/embeds.js - Embed作成ヘルパー
// ============================================================

const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success : 0x57F287,  // 緑
  error   : 0xED4245,  // 赤
  warning : 0xFEE75C,  // 黄
  info    : 0x5865F2,  // 青紫
  lending : 0xEB459E,  // ピンク
  return  : 0x57F287,  // 緑
};

/**
 * 成功メッセージ
 */
function success(title, description, fields = []) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .addFields(fields)
    .setTimestamp();
}

/**
 * エラーメッセージ
 */
function error(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * 警告メッセージ
 */
function warning(title, description, fields = []) {
  return new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .addFields(fields)
    .setTimestamp();
}

/**
 * 情報メッセージ
 */
function info(title, description, fields = []) {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`📋 ${title}`)
    .setDescription(description)
    .addFields(fields)
    .setTimestamp();
}

/**
 * 貸し出しカード
 */
function loanCard(loan, item) {
  const dueText = loan.due_date
    ? `<t:${Math.floor(new Date(loan.due_date).getTime() / 1000)}:R>`
    : '未設定';
  const status = loan.status === 'overdue' ? '🔴 延滞中' : '🟢 貸出中';

  return new EmbedBuilder()
    .setColor(loan.status === 'overdue' ? COLORS.error : COLORS.lending)
    .setTitle(`📦 貸し出し #${loan.id}`)
    .addFields(
      { name: 'アイテム', value: item?.name ?? loan.item_name, inline: true },
      { name: 'カテゴリ', value: item?.category ?? '—', inline: true },
      { name: '数量', value: `${loan.quantity}個`, inline: true },
      { name: '借り主', value: `<@${loan.borrower_id}>`, inline: true },
      { name: '貸し主', value: `<@${loan.lender_id}>`, inline: true },
      { name: 'ステータス', value: status, inline: true },
      { name: '返却期限', value: dueText, inline: false },
      ...(loan.note ? [{ name: 'メモ', value: loan.note }] : []),
    )
    .setTimestamp(new Date(loan.created_at));
}

module.exports = { success, error, warning, info, loanCard, COLORS };
