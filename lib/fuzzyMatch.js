// Levenshtein (tahrirlash masofasi) — ism/familiya xato yozilgan
// bo'lsa ham eng yaqin mos foydalanuvchini topish uchun.
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[m][n];
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function similarity(a, b) {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - distance / maxLen;
}

const MIN_SCORE = 0.5;

/**
 * `query` (ism+familiya, xato yozilgan bo'lishi mumkin) va
 * `{firstName, lastName}` maydonlariga ega `candidates` ro'yxati
 * asosida eng yaqin mos keluvchini qaytaradi. "Ism Familiya" va
 * "Familiya Ism" tartiblarining ikkalasi ham tekshiriladi.
 * Hech biri yetarlicha o'xshash bo'lmasa (score < 0.5) `null`.
 */
function findBestUserMatch(query, candidates) {
  const q = normalize(query);
  let best = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const forward = normalize(`${candidate.firstName} ${candidate.lastName}`);
    const backward = normalize(`${candidate.lastName} ${candidate.firstName}`);
    const score = Math.max(similarity(q, forward), similarity(q, backward));

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (!best || bestScore < MIN_SCORE) {
    return null;
  }

  return { user: best, score: bestScore };
}

module.exports = { findBestUserMatch };
