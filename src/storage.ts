import { ScoreRecord, LEVELS, PracticeRecord, GameReviewData, CommissionRecord } from './constants';

const STORAGE_KEY = 'braiding_challenge_scores';
const PRACTICE_KEY = 'braiding_challenge_practice_records';
const MAX_PRACTICE_RECORDS = 5;
const COMMISSION_KEY = 'braiding_challenge_commission_records';
const MAX_COMMISSION_RECORDS = 5;
const COMMISSION_BEST_KEY = 'braiding_challenge_commission_best';

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

export function savePracticeRecord(record: PracticeRecord): void {
  const records = getPracticeRecords();
  records.unshift(record);
  const trimmed = records.slice(0, MAX_PRACTICE_RECORDS);
  localStorage.setItem(PRACTICE_KEY, JSON.stringify(trimmed));
}

export function getPracticeRecords(): PracticeRecord[] {
  try {
    const data = localStorage.getItem(PRACTICE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearPracticeRecords(): void {
  localStorage.removeItem(PRACTICE_KEY);
}

export function saveReviewToPractice(review: GameReviewData): void {
  const levelConfig = LEVELS.find((l) => l.id === review.levelId);
  const record: PracticeRecord = {
    level: review.levelId,
    levelName: levelConfig?.name || `关卡 ${review.levelId}`,
    score: review.score,
    accuracy: Math.round(review.accuracy),
    date: new Date().toISOString(),
    mainMistakeTypes: review.mainMistakeTypes,
    success: review.success,
  };
  savePracticeRecord(record);
}

export function saveCommissionRecord(record: CommissionRecord): void {
  const records = getCommissionRecords();
  records.unshift(record);
  const trimmed = records.slice(0, MAX_COMMISSION_RECORDS);
  localStorage.setItem(COMMISSION_KEY, JSON.stringify(trimmed));

  const bestRecords = getBestCommissionRecords();
  const existing = bestRecords.findIndex((r) => r.commissionId === record.commissionId);
  if (existing >= 0) {
    if (bestRecords[existing].satisfaction < record.satisfaction) {
      bestRecords[existing] = record;
    }
  } else {
    bestRecords.push(record);
  }
  localStorage.setItem(COMMISSION_BEST_KEY, JSON.stringify(bestRecords));
}

export function getCommissionRecords(): CommissionRecord[] {
  try {
    const data = localStorage.getItem(COMMISSION_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getBestCommissionRecords(): CommissionRecord[] {
  try {
    const data = localStorage.getItem(COMMISSION_BEST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getBestSatisfactionForCommission(commissionId: string): number {
  const bestRecords = getBestCommissionRecords();
  const record = bestRecords.find((r) => r.commissionId === commissionId);
  return record ? record.satisfaction : 0;
}

export function clearCommissionRecords(): void {
  localStorage.removeItem(COMMISSION_KEY);
}
