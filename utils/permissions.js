// ============================================================
//  utils/permissions.js - 権限チェックヘルパー
// ============================================================

const { PermissionFlagsBits } = require('discord.js');
const db = require('./database');

/**
 * 管理者かどうか確認（サーバー管理者 or 設定されたロール）
 */
function isAdmin(interaction) {
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const settings = db.settings.get(interaction.guildId);
  if (settings?.admin_role_id) {
    return interaction.member.roles.cache.has(settings.admin_role_id);
  }
  return false;
}

/**
 * 管理者でなければエラーを返す
 */
async function requireAdmin(interaction) {
  if (!isAdmin(interaction)) {
    const { error } = require('./embeds');
    await interaction.reply({
      embeds: [error('権限エラー', 'このコマンドは管理者のみ使用できます。')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

module.exports = { isAdmin, requireAdmin };
