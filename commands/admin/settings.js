// ============================================================
//  commands/admin/settings.js - Bot設定コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const db      = require('../../utils/database');
const embeds  = require('../../utils/embeds');
const { requireAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Bot設定を変更する（管理者のみ）')
    .addSubcommand(sub =>
      sub.setName('view').setDescription('現在の設定を確認'))
    .addSubcommand(sub =>
      sub.setName('log-channel')
        .setDescription('ログチャンネルを設定')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('ログを送信するチャンネル').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('admin-role')
        .setDescription('管理者ロールを設定')
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Bot管理者ロール').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('reminder-dm')
        .setDescription('貸し出し時のDM通知ON/OFF')
        .addBooleanOption(opt =>
          opt.setName('enabled').setDescription('ON/OFF').setRequired(true))),

  async execute(interaction) {
    if (!await requireAdmin(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'view') {
      const s = db.settings.get(guildId);
      return interaction.editReply({
        embeds: [
          embeds.info('現在の設定', 'このサーバーのBot設定', [
            { name: 'ログチャンネル', value: s.log_channel_id ? `<#${s.log_channel_id}>` : '未設定', inline: true },
            { name: '管理者ロール',   value: s.admin_role_id  ? `<@&${s.admin_role_id}>` : '未設定', inline: true },
            { name: 'DM通知',        value: s.reminder_dm ? '✅ ON' : '❌ OFF', inline: true },
          ]),
        ],
      });
    }

    if (sub === 'log-channel') {
      const ch = interaction.options.getChannel('channel');
      db.settings.set(guildId, { log_channel_id: ch.id });
      return interaction.editReply({
        embeds: [embeds.success('設定完了', `ログチャンネルを <#${ch.id}> に設定しました。`)],
      });
    }

    if (sub === 'admin-role') {
      const role = interaction.options.getRole('role');
      db.settings.set(guildId, { admin_role_id: role.id });
      return interaction.editReply({
        embeds: [embeds.success('設定完了', `管理者ロールを <@&${role.id}> に設定しました。`)],
      });
    }

    if (sub === 'reminder-dm') {
      const enabled = interaction.options.getBoolean('enabled');
      db.settings.set(guildId, { reminder_dm: enabled ? 1 : 0 });
      return interaction.editReply({
        embeds: [embeds.success('設定完了', `DM通知を **${enabled ? 'ON' : 'OFF'}** にしました。`)],
      });
    }
  },
};
