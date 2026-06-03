// ============================================================
//  utils/dateHelper.js - 日付ヘルパー
// ============================================================

/**
 * 「3d」「2w」「1m」などの文字列をDateに変換
 * d = 日, w = 週, m = 月, h = 時間
 */
function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)([dhwm])$/i);
  if (!match) return null;

  const num  = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const now  = new Date();

  switch (unit) {
    case 'h': now.setHours(now.getHours() + num); break;
    case 'd': now.setDate(now.getDate() + num); break;
    case 'w': now.setDate(now.getDate() + num * 7); break;
    case 'm': now.setMonth(now.getMonth() + num); break;
    default: return null;
  }
  return now;
}

/**
 * DateをDiscordタイムスタンプ形式に変換
 */
function toDiscordTimestamp(date, style = 'f') {
  if (!date) return '未設定';
  return `<t:${Math.floor(new Date(date).getTime() / 1000)}:${style}>`;
}

/**
 * 残り日数の文字列を返す
 */
function daysUntil(date) {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}日延滞`;
  if (days === 0) return '今日まで';
  return `あと${days}日`;
}

module.exports = { parseDuration, toDiscordTimestamp, daysUntil };
