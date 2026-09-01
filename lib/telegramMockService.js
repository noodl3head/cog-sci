import crypto from 'node:crypto';
import {
  answerTelegramMockCallback,
  editTelegramMockKeyboard,
  sendTelegramMockMessage,
} from './telegramMockApi.js';
import {
  buildQuestionKeyboard,
  buildQuestionMessage,
  buildResultSummary,
  parseCallbackData,
} from './telegramMockCore.js';
import { deriveTopicWeights, generateDailyTelegramMock } from './telegramMockGenerator.js';
import {
  advanceTelegramMockSession,
  claimTelegramMockResultMessage,
  claimTelegramMockUpdate,
  completeTelegramMockSession,
  createTelegramMockSession,
  deactivateTelegramMockUser,
  ensureTelegramMockSchema,
  findTelegramMockSessionByDate,
  getActiveTelegramMockSession,
  getTelegramMockSession,
  listActiveTelegramMockUsers,
  loadAttemptedChapterRows,
  loadUsedQuestionIds,
  markTelegramMockResultDelivered,
  prepareTelegramMockResultDelivery,
  registerTelegramMockUser,
  releaseTelegramMockResultClaim,
  releaseTelegramMockUpdate,
  saveTelegramMockProgress,
  submitTelegramMockSelection,
  toggleTelegramMockSelection,
} from './telegramMockStore.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function indiaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function allowedUserId() {
  const value = process.env.TELEGRAM_MOCK_ALLOWED_USER_ID;
  if (!value) throw new Error('TELEGRAM_MOCK_ALLOWED_USER_ID is not configured');
  return String(value);
}

function isAllowed(user) {
  return user && String(user.id) === allowedUserId();
}

export function isAuthorizedPrivateSubscriber(user, expectedUserId) {
  return Boolean(user)
    && String(user.user_id) === String(expectedUserId)
    && String(user.chat_id) === String(user.user_id);
}

export function parseNatResponse(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  return Number.isFinite(Number(text.replace(/,/g, ''))) ? text : null;
}

export function hasUndeliveredCurrentQuestion(session) {
  return session?.status === 'in_progress'
    && Number(session.current_index) < session.questions.length
    && (session.last_question_index == null
      || Number(session.last_question_index) !== Number(session.current_index));
}

export function shouldRecoverMissingQuestion(session, answeredQuestionIndex) {
  return Number(session?.current_index) === answeredQuestionIndex + 1
    && hasUndeliveredCurrentQuestion(session);
}

export function startMockDisposition(session) {
  if (!session) return 'create';
  if (session.status === 'completed') return 'completed';
  if (session.status === 'finishing') return 'finishing';
  return hasUndeliveredCurrentQuestion(session) ? 'recover-question' : 'already-active';
}

export function buildTelegramResultMessages(result) {
  return [
    { text: result.summaryText || result.text, parseMode: 'HTML' },
    ...result.rows.map((row) => ({
      text: [
        `<b>Q${row.questionNumber} · ${row.correct ? 'Correct' : 'Incorrect'} · ${Math.round(row.marksAwarded * 100) / 100} marks</b>`,
        `Your answer: ${escapeHtml(displayResponse(row.response))}`,
        `Correct: ${escapeHtml(row.correctAnswer)}`,
        escapeHtml(row.explanation),
      ].filter(Boolean).join('\n'),
      parseMode: 'HTML',
    })),
  ];
}

function inviteKeyboard(mockDate) {
  return { inline_keyboard: [[{ text: 'Start today’s mock', callback_data: `tm:start:${mockDate}` }]] };
}

export async function sendDailyTelegramMockInvites(sql, mockDate = indiaDate()) {
  await ensureTelegramMockSchema(sql);
  const users = (await listActiveTelegramMockUsers(sql))
    .filter((user) => isAuthorizedPrivateSubscriber(user, allowedUserId()));
  const results = [];
  for (const user of users) {
    try {
      const existing = await findTelegramMockSessionByDate(sql, user.chat_id, mockDate);
      if (existing?.status === 'completed') continue;
      const message = await sendTelegramMockMessage(
        user.chat_id,
        `<b>Daily GATE XH-C5 Psychology mock</b>\n\n10 questions · about 20 minutes · MCQ, MSQ and NAT\nOnly topics from chapters you have attempted are eligible.`,
        inviteKeyboard(mockDate),
      );
      results.push({ chatId: user.chat_id, delivered: true, messageId: message.message_id });
    } catch (error) {
      results.push({ chatId: user.chat_id, delivered: false, error: error.message });
    }
  }
  return results;
}

async function sendQuestion(sql, session) {
  const question = session.questions[session.current_index];
  if (!question) return finishSession(sql, session);
  const message = await sendTelegramMockMessage(
    session.chat_id,
    buildQuestionMessage(question, session.current_index, session.questions.length),
    buildQuestionKeyboard(question, {
      sessionId: session.session_id,
      questionIndex: session.current_index,
      selected: session.selected || [],
    }),
  );
  await saveTelegramMockProgress(sql, session.session_id, {
    responses: session.responses || {},
    selected: session.selected || [],
    currentIndex: session.current_index,
    messageId: message.message_id,
    messageIndex: session.current_index,
  });
}

function displayResponse(response) {
  if (response == null) return 'Skipped';
  return Array.isArray(response) ? response.join(', ') : String(response);
}

async function finishSession(sql, session) {
  let working = session;
  if (working.status === 'in_progress') {
    const result = buildResultSummary(working.questions, working.responses || {});
    result.summaryText = `<b>Mock complete · ${result.score}/${result.maxMarks}</b>\n${result.correctCount}/${working.questions.length} questions correct\n\nFeedback and explanations follow below.`;
    working = await prepareTelegramMockResultDelivery(sql, working.session_id, result)
      || await getTelegramMockSession(sql, working.session_id);
  }
  if (!working || working.status === 'completed') return working;
  if (working.status !== 'finishing' || !working.result) {
    throw new Error('Telegram mock result delivery state is invalid');
  }

  const messages = buildTelegramResultMessages(working.result);
  for (let index = Number(working.result_delivery_index ?? -1) + 1; index < messages.length; index += 1) {
    const claim = await claimTelegramMockResultMessage(sql, working.session_id, index);
    if (!claim) return working;
    try {
      await sendTelegramMockMessage(working.chat_id, messages[index].text);
    } catch (error) {
      await releaseTelegramMockResultClaim(sql, working.session_id, index);
      throw error;
    }
    const checkpoint = await markTelegramMockResultDelivered(sql, working.session_id, index);
    if (!checkpoint) {
      const latest = await getTelegramMockSession(sql, working.session_id);
      if (Number(latest?.result_delivery_index ?? -1) < index) {
        await releaseTelegramMockResultClaim(sql, working.session_id, index);
        throw new Error(`Could not checkpoint Telegram result message ${index}`);
      }
      working = latest;
    } else {
      working = checkpoint;
    }
  }

  return completeTelegramMockSession(sql, working.session_id, messages.length - 1);
}

async function continueAdvancedSession(sql, updated) {
  if (!updated) return;
  if (updated.current_index >= updated.questions.length) return finishSession(sql, updated);
  return sendQuestion(sql, updated);
}

async function advanceSession(sql, session, response) {
  const updated = await advanceTelegramMockSession(
    sql,
    session.session_id,
    session.current_index,
    response,
  );
  return continueAdvancedSession(sql, updated);
}

async function startMock(sql, chatId, mockDate) {
  let session = await findTelegramMockSessionByDate(sql, chatId, mockDate);
  const disposition = startMockDisposition(session);
  if (disposition === 'completed') {
    await sendTelegramMockMessage(chatId, 'Today’s mock is already complete. The next invitation arrives tomorrow at 12:00 PM.');
    return;
  }
  if (disposition === 'finishing') {
    await sendTelegramMockMessage(chatId, 'Resuming your result delivery…');
    await finishSession(sql, session);
    return;
  }
  if (disposition === 'recover-question') {
    await sendTelegramMockMessage(chatId, 'Resending the next question…');
    await sendQuestion(sql, session);
    return;
  }
  if (disposition === 'already-active') {
    await sendTelegramMockMessage(chatId, 'Your mock is already in progress. Use the latest question above.');
    return;
  }

  const chapterRows = await loadAttemptedChapterRows(sql);
  const topicWeights = deriveTopicWeights(chapterRows);
  if (!Object.keys(topicWeights).length) {
    await sendTelegramMockMessage(chatId, 'I could not find any attempted chapters yet. Complete at least one chapter quiz in Cog-Sci, then try again.');
    return;
  }
  const excludedIds = await loadUsedQuestionIds(sql, chatId);
  const questions = generateDailyTelegramMock(topicWeights, excludedIds);
  session = await createTelegramMockSession(sql, {
    sessionId: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    chatId,
    mockDate,
    questions,
  });
  await sendTelegramMockMessage(chatId, '<b>Mock started.</b> Answers are locked as you move forward. Feedback and explanations appear after Question 10.');
  await sendQuestion(sql, session);
}

async function handleCallback(sql, query) {
  if (!isAllowed(query.from) || query.message?.chat?.type !== 'private') {
    await answerTelegramMockCallback(query.id, 'This private mock bot is not authorized for your account.');
    return;
  }
  const parsed = parseCallbackData(query.data);
  if (!parsed) {
    await answerTelegramMockCallback(query.id, 'This button is invalid or expired.');
    return;
  }
  const chatId = String(query.message.chat.id);
  if (parsed.action === 'start') {
    await answerTelegramMockCallback(query.id, 'Starting…');
    await startMock(sql, chatId, parsed.mockDate);
    return;
  }

  const session = await getTelegramMockSession(sql, parsed.sessionId);
  if (!session || String(session.chat_id) !== chatId) {
    await answerTelegramMockCallback(query.id, 'This mock is no longer active.');
    return;
  }
  if (session.status === 'finishing') {
    await answerTelegramMockCallback(query.id, 'Resuming result delivery…');
    await finishSession(sql, session);
    return;
  }
  if (session.status !== 'in_progress') {
    await answerTelegramMockCallback(query.id, 'This mock is no longer active.');
    return;
  }
  if (Number(session.current_index) !== parsed.questionIndex) {
    if (Number(session.current_index) >= session.questions.length) {
      await answerTelegramMockCallback(query.id, 'Resuming result delivery…');
      await finishSession(sql, session);
      return;
    }
    if (shouldRecoverMissingQuestion(session, parsed.questionIndex)) {
      await answerTelegramMockCallback(query.id, 'Resending the next question…');
      await sendQuestion(sql, session);
      return;
    }
    await answerTelegramMockCallback(query.id, 'That question is already locked.');
    return;
  }
  const question = session.questions[session.current_index];

  if (parsed.action === 'skip') {
    await answerTelegramMockCallback(query.id, 'Skipped');
    await advanceSession(sql, session, null);
    return;
  }
  if (parsed.action === 'q' && question.type === 'MSQ') {
    const updated = await toggleTelegramMockSelection(
      sql,
      session.session_id,
      session.current_index,
      parsed.value,
    );
    if (!updated) {
      await answerTelegramMockCallback(query.id, 'That question is already locked.');
      return;
    }
    await editTelegramMockKeyboard(chatId, query.message.message_id, buildQuestionKeyboard(question, {
      sessionId: session.session_id, questionIndex: session.current_index, selected: updated.selected,
    }));
    await answerTelegramMockCallback(query.id);
    return;
  }
  if (parsed.action === 'submit' && question.type === 'MSQ') {
    const updated = await submitTelegramMockSelection(sql, session.session_id, session.current_index);
    if (!updated) {
      await answerTelegramMockCallback(query.id, 'Select at least one option, or this question is already locked.');
      return;
    }
    await answerTelegramMockCallback(query.id, 'Answer locked');
    await continueAdvancedSession(sql, updated);
    return;
  }
  if (parsed.action === 'q' && question.type === 'MCQ') {
    await answerTelegramMockCallback(query.id, 'Answer locked');
    await advanceSession(sql, session, parsed.value);
    return;
  }
  await answerTelegramMockCallback(query.id, 'Use the controls shown for this question.');
}

async function handleMessage(sql, message) {
  const user = message.from;
  const chat = message.chat;
  if (!isAllowed(user) || chat.type !== 'private') {
    await sendTelegramMockMessage(chat.id, 'This is a private mock bot and this Telegram account is not authorized.');
    return;
  }
  const text = String(message.text || '').trim();
  if (text === '/start') {
    await registerTelegramMockUser(sql, chat, user);
    await sendTelegramMockMessage(
      chat.id,
      `<b>Daily Psychology Mock Bot is ready.</b>\n\nEvery day at 12:00 PM IST, I’ll send a 10-question GATE-style mock drawn only from chapters you have attempted.`,
      inviteKeyboard(indiaDate()),
    );
    return;
  }
  if (text === '/stop') {
    await deactivateTelegramMockUser(sql, chat.id);
    await sendTelegramMockMessage(chat.id, 'Daily mock invitations are paused. Send /start to resume them.');
    return;
  }

  const session = await getActiveTelegramMockSession(sql, chat.id);
  if (!session) {
    await sendTelegramMockMessage(chat.id, 'No mock is active. Use the Start button in today’s invitation.');
    return;
  }
  if (session.status === 'finishing' || Number(session.current_index) >= session.questions.length) {
    await sendTelegramMockMessage(chat.id, 'Resuming your result delivery…');
    await finishSession(sql, session);
    return;
  }
  if (hasUndeliveredCurrentQuestion(session)) {
    await sendTelegramMockMessage(chat.id, 'Resending the next question…');
    await sendQuestion(sql, session);
    return;
  }
  const question = session.questions[session.current_index];
  if (question?.type !== 'NAT') {
    await sendTelegramMockMessage(chat.id, 'Use the inline buttons on the current question.');
    return;
  }
  const natResponse = parseNatResponse(message.text);
  if (natResponse == null) {
    await sendTelegramMockMessage(chat.id, 'Enter a numerical value, or press Skip on the question.');
    return;
  }
  await advanceSession(sql, session, natResponse);
}

export async function handleTelegramMockUpdate(sql, update) {
  await ensureTelegramMockSchema(sql);
  if (!Number.isInteger(update?.update_id)) return;
  if (!(await claimTelegramMockUpdate(sql, update.update_id))) return;
  try {
    if (update.callback_query) return await handleCallback(sql, update.callback_query);
    if (update.message) return await handleMessage(sql, update.message);
  } catch (error) {
    await releaseTelegramMockUpdate(sql, update.update_id);
    throw error;
  }
}
