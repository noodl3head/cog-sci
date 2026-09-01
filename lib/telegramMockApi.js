function token() {
  const value = process.env.TELEGRAM_MOCK_BOT_TOKEN;
  if (!value) throw new Error('TELEGRAM_MOCK_BOT_TOKEN is not configured');
  return value;
}

export async function telegramMockApi(method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || response.status}`);
  }
  return data.result;
}

export function sendTelegramMockMessage(chatId, text, replyMarkup = null) {
  return telegramMockApi('sendMessage', {
    chat_id: String(chatId),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function editTelegramMockMessage(chatId, messageId, text, replyMarkup = null) {
  return telegramMockApi('editMessageText', {
    chat_id: String(chatId),
    message_id: Number(messageId),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function editTelegramMockKeyboard(chatId, messageId, replyMarkup) {
  return telegramMockApi('editMessageReplyMarkup', {
    chat_id: String(chatId),
    message_id: Number(messageId),
    reply_markup: replyMarkup,
  });
}

export function answerTelegramMockCallback(callbackQueryId, text = null) {
  return telegramMockApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export function setTelegramMockWebhook(url, secretToken) {
  if (!secretToken) {
    return Promise.reject(new Error('TELEGRAM_MOCK_WEBHOOK_SECRET is not configured'));
  }
  return telegramMockApi('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });
}

export function getTelegramMockWebhookInfo() {
  return telegramMockApi('getWebhookInfo');
}
