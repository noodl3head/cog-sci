export async function ensureTelegramMockSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS telegram_mock_users (
      chat_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS telegram_mock_sessions (
      session_id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES telegram_mock_users(chat_id),
      mock_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      questions JSONB NOT NULL,
      responses JSONB NOT NULL DEFAULT '{}'::jsonb,
      selected JSONB NOT NULL DEFAULT '[]'::jsonb,
      current_index INTEGER NOT NULL DEFAULT 0,
      last_question_message_id TEXT,
      last_question_index INTEGER,
      result JSONB,
      result_delivery_index INTEGER NOT NULL DEFAULT -1,
      result_delivery_claim_index INTEGER,
      result_delivery_claimed_at TIMESTAMPTZ,
      score NUMERIC(8,2),
      max_marks NUMERIC(8,2),
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at TIMESTAMPTZ,
      UNIQUE(chat_id, mock_date)
    )
  `;
  await sql`ALTER TABLE telegram_mock_sessions ADD COLUMN IF NOT EXISTS last_question_index INTEGER`;
  await sql`ALTER TABLE telegram_mock_sessions ADD COLUMN IF NOT EXISTS result JSONB`;
  await sql`ALTER TABLE telegram_mock_sessions ADD COLUMN IF NOT EXISTS result_delivery_index INTEGER NOT NULL DEFAULT -1`;
  await sql`ALTER TABLE telegram_mock_sessions ADD COLUMN IF NOT EXISTS result_delivery_claim_index INTEGER`;
  await sql`ALTER TABLE telegram_mock_sessions ADD COLUMN IF NOT EXISTS result_delivery_claimed_at TIMESTAMPTZ`;
  await sql`
    CREATE TABLE IF NOT EXISTS telegram_mock_updates (
      update_id BIGINT PRIMARY KEY,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS telegram_mock_sessions_chat_status_idx ON telegram_mock_sessions(chat_id, status)`;
}

export async function claimTelegramMockUpdate(sql, updateId) {
  const rows = await sql`
    INSERT INTO telegram_mock_updates (update_id)
    VALUES (${updateId})
    ON CONFLICT (update_id) DO NOTHING
    RETURNING update_id
  `;
  return rows.length > 0;
}

export async function releaseTelegramMockUpdate(sql, updateId) {
  await sql`DELETE FROM telegram_mock_updates WHERE update_id = ${updateId}`;
}

export async function registerTelegramMockUser(sql, chat, user) {
  const rows = await sql`
    INSERT INTO telegram_mock_users (chat_id, user_id, username, first_name, active, last_seen_at)
    VALUES (${String(chat.id)}, ${String(user.id)}, ${user.username || null}, ${user.first_name || null}, TRUE, now())
    ON CONFLICT (chat_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      active = TRUE,
      last_seen_at = now()
    RETURNING *
  `;
  return rows[0];
}

export async function listActiveTelegramMockUsers(sql) {
  return sql`
    SELECT * FROM telegram_mock_users
    WHERE active = TRUE AND chat_id = user_id
    ORDER BY created_at
  `;
}

export async function deactivateTelegramMockUser(sql, chatId) {
  await sql`UPDATE telegram_mock_users SET active = FALSE, last_seen_at = now() WHERE chat_id = ${String(chatId)}`;
}

export async function loadAttemptedChapterRows(sql) {
  return sql`
    SELECT book_id, chapter_id,
           COUNT(*)::int AS attempted,
           COUNT(*) FILTER (WHERE is_correct)::int AS correct
    FROM attempts
    GROUP BY book_id, chapter_id
    HAVING COUNT(*) > 0
  `;
}

export async function loadUsedQuestionIds(sql, chatId) {
  const rows = await sql`
    SELECT DISTINCT item->>'id' AS id
    FROM telegram_mock_sessions,
         jsonb_array_elements(questions) AS item
    WHERE chat_id = ${String(chatId)}
      AND item->>'id' IS NOT NULL
  `;
  return rows.map((row) => row.id);
}

export async function findTelegramMockSessionByDate(sql, chatId, mockDate) {
  const rows = await sql`
    SELECT * FROM telegram_mock_sessions
    WHERE chat_id = ${String(chatId)} AND mock_date = ${mockDate}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function createTelegramMockSession(sql, { sessionId, chatId, mockDate, questions }) {
  const rows = await sql`
    INSERT INTO telegram_mock_sessions (session_id, chat_id, mock_date, questions)
    VALUES (${sessionId}, ${String(chatId)}, ${mockDate}, ${JSON.stringify(questions)}::jsonb)
    ON CONFLICT (chat_id, mock_date) DO UPDATE SET chat_id = EXCLUDED.chat_id
    RETURNING *
  `;
  return rows[0];
}

export async function getTelegramMockSession(sql, sessionId) {
  const rows = await sql`SELECT * FROM telegram_mock_sessions WHERE session_id = ${sessionId} LIMIT 1`;
  return rows[0] || null;
}

export async function getActiveTelegramMockSession(sql, chatId) {
  const rows = await sql`
    SELECT * FROM telegram_mock_sessions
    WHERE chat_id = ${String(chatId)} AND status IN ('in_progress', 'finishing')
    ORDER BY started_at DESC LIMIT 1
  `;
  return rows[0] || null;
}

export async function saveTelegramMockProgress(sql, sessionId, {
  responses, selected, currentIndex, messageId = null, messageIndex = null,
}) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      responses = ${JSON.stringify(responses)}::jsonb,
      selected = ${JSON.stringify(selected || [])}::jsonb,
      current_index = ${currentIndex},
      last_question_message_id = COALESCE(${messageId == null ? null : String(messageId)}, last_question_message_id),
      last_question_index = CASE
        WHEN ${messageId == null ? null : String(messageId)} IS NULL THEN last_question_index
        ELSE ${messageIndex}
      END
    WHERE session_id = ${sessionId}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function toggleTelegramMockSelection(sql, sessionId, expectedIndex, value) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      selected = CASE
        WHEN selected ? ${value} THEN selected - ${value}
        ELSE selected || jsonb_build_array(${value})
      END
    WHERE session_id = ${sessionId}
      AND status = 'in_progress'
      AND current_index = ${expectedIndex}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function submitTelegramMockSelection(sql, sessionId, expectedIndex) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      responses = jsonb_set(
        responses,
        ARRAY[${String(expectedIndex)}],
        selected,
        TRUE
      ),
      selected = '[]'::jsonb,
      current_index = current_index + 1
    WHERE session_id = ${sessionId}
      AND status = 'in_progress'
      AND current_index = ${expectedIndex}
      AND jsonb_array_length(selected) > 0
    RETURNING *
  `;
  return rows[0] || null;
}

export async function advanceTelegramMockSession(sql, sessionId, expectedIndex, response) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      responses = jsonb_set(
        responses,
        ARRAY[${String(expectedIndex)}],
        ${JSON.stringify(response)}::jsonb,
        TRUE
      ),
      selected = '[]'::jsonb,
      current_index = current_index + 1
    WHERE session_id = ${sessionId}
      AND status = 'in_progress'
      AND current_index = ${expectedIndex}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function prepareTelegramMockResultDelivery(sql, sessionId, result) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      status = 'finishing',
      result = ${JSON.stringify(result)}::jsonb,
      score = ${result.score},
      max_marks = ${result.maxMarks},
      result_delivery_index = -1,
      result_delivery_claim_index = NULL,
      result_delivery_claimed_at = NULL,
      selected = '[]'::jsonb
    WHERE session_id = ${sessionId}
      AND status = 'in_progress'
      AND current_index >= jsonb_array_length(questions)
    RETURNING *
  `;
  return rows[0] || null;
}

export async function claimTelegramMockResultMessage(sql, sessionId, messageIndex) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      result_delivery_claim_index = ${messageIndex},
      result_delivery_claimed_at = now()
    WHERE session_id = ${sessionId}
      AND status = 'finishing'
      AND result_delivery_index = ${messageIndex - 1}
      AND (
        result_delivery_claim_index IS NULL
        OR result_delivery_claimed_at < now() - interval '2 minutes'
      )
    RETURNING *
  `;
  return rows[0] || null;
}

export async function releaseTelegramMockResultClaim(sql, sessionId, messageIndex) {
  await sql`
    UPDATE telegram_mock_sessions SET
      result_delivery_claim_index = NULL,
      result_delivery_claimed_at = NULL
    WHERE session_id = ${sessionId}
      AND status = 'finishing'
      AND result_delivery_claim_index = ${messageIndex}
  `;
}

export async function markTelegramMockResultDelivered(sql, sessionId, messageIndex) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      result_delivery_index = ${messageIndex},
      result_delivery_claim_index = NULL,
      result_delivery_claimed_at = NULL
    WHERE session_id = ${sessionId}
      AND status = 'finishing'
      AND result_delivery_index = ${messageIndex - 1}
      AND result_delivery_claim_index = ${messageIndex}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function completeTelegramMockSession(sql, sessionId, finalDeliveryIndex) {
  const rows = await sql`
    UPDATE telegram_mock_sessions SET
      status = 'completed',
      completed_at = now(),
      selected = '[]'::jsonb
    WHERE session_id = ${sessionId}
      AND status = 'finishing'
      AND result_delivery_index = ${finalDeliveryIndex}
    RETURNING *
  `;
  return rows[0] || null;
}
