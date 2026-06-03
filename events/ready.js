// ============================================================
//  events/ready.js - Bot起動時イベント
// ============================================================

const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    // アクティビティ設定
    client.user.setPresence({
      activities: [{ name: '/help で使い方確認', type: ActivityType.Watching }],
      status: 'online',
    });

    console.log(`✅ ${client.user.tag} がオンラインになりました`);
    console.log(`📊 サーバー数: ${client.guilds.cache.size}`);
  },
};
