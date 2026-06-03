// ============================================================
//  utils/logger.js - ログチャンネルへの送信
// ============================================================

const { EmbedBuilder } = require('discord.js');
const db = require('./database');
const { COLORS } = require('./embeds');

/**
 * 設定されたログチャンネルにアクションを記録する
 */
async function log(client, guildId, action, fields = []) {
  const settings = db.settings.get(guildId);
  if (!settings?.log_channel_id) return;

  const channel = await client.channels.fetch(settings.log_channel_id).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`📝 ログ: ${action}`)
    .addFields(fields)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = { log };
