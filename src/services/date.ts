// services/date.ts
export function normalizeToISODate(
  dateStr?: string | null,
  issueMonth?: string | null
): string | null {
  if (!dateStr) return null;
  let s = dateStr.trim();

  // 日本語・/ . をハイフンに寄せる
  s = s.replace(/[年月\/\.]/g, "-").replace(/日/g, "");

  // 年なし（例: "5-11" / "05-11"）→ issue_month と合成
  if (/^\d{1,2}-\d{1,2}$/.test(s)) {
    const ym = issueMonth ?? new Date().toISOString().slice(0, 7); // YYYY-MM
    const [m, d] = s.split("-").map(v => v.padStart(2, "0"));
    return `${ym.split("-")[0]}-${m}-${d}`;
  }

  // 年あり（例: "2024-5-1" / "2024-05-01"）
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null; // 不明な形式は無視（UI側は「期限未設定」）
}
