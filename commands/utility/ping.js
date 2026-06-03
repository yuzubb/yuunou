// ============================================================
//  commands/utility/ping.js - 疎通確認コマンド
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botの応答速度を確認する'),

  async execute(interaction) {
    const sent  = await interaction.reply({ content: '計測中...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    await interaction.editReply({
      content: '',
      embeds: [
        embeds.info('🏓 Pong!', 'Bot応答速度', [
          { name: 'メッセージ遅延', value: `${latency}ms`, inline: true },
          { name: 'WebSocket遅延', value: `${wsLatency}ms`, inline: true },
        ]),
      ],
    });
  },
};
