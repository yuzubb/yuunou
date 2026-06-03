// ============================================================
//  events/interactionCreate.js - スラッシュコマンド処理
// ============================================================

const embeds = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`❌ コマンドエラー [${interaction.commandName}]:`, err);

      const errEmbed = embeds.error(
        'コマンドエラー',
        '予期しないエラーが発生しました。しばらく経ってから再試行してください。'
      );

      // 既にreply/deferReplyされているか確認
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errEmbed] }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
      }
    }
  },
};
