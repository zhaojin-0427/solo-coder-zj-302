import { ScoreRecord, LEVELS } from './constants';

const STORAGE_KEY = 'braiding_challenge_scores';

export function saveScore(record: ScoreRecord): void {
  const scores = getScores();
  const existing = scores.findIndex(
    (s) => s.level === record.level && s.score < record.score
  );
  if (existing >= 0) {
    scores[existing] = record;
  } else if (!scores.some((s) => s.level === record.level)) {
    scores.push(record);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

export function getScores(): ScoreRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getHighScore(level: number): number {
  const scores = getScores();
  const levelScores = scores.filter((s) => s.level === level);
  return levelScores.length > 0
    ? Math.max(...levelScores.map((s) => s.score))
    : 0;
}

export function getMaxUnlockedLevel(): number {
  const scores = getScores();
  let maxLevel = 1;
  for (const s of scores) {
    const levelConfig = LEVELS.find((l) => l.id === s.level);
    if (levelConfig && s.score >= levelConfig.requiredScore) {
      maxLevel = Math.max(maxLevel, s.level + 1);
    }
  }
  return Math.min(maxLevel, LEVELS.length);
}
