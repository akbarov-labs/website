// In-memory limits. One container serves the site, so memory is enough; a
// restart forgets them, which the Anthropic Console's monthly spend limit
// backs up.

// At most `max` hits per key within `windowMs`.
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private max: number;
  private windowMs: number;

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  take(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  // Drops keys with no recent hits, so the map doesn't grow forever.
  sweep(now = Date.now()): void {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
    }
  }
}

// Dollars spent today, Tashkent time (UTC+5, no daylight saving).
export class DailyBudget {
  private day = '';
  private spent = 0;
  private limitUsd: number;

  constructor(limitUsd: number) {
    this.limitUsd = limitUsd;
  }

  private today(now: number): string {
    return new Date(now + 5 * 3600_000).toISOString().slice(0, 10);
  }

  exhausted(now = Date.now()): boolean {
    if (this.today(now) !== this.day) {
      this.day = this.today(now);
      this.spent = 0;
    }
    return this.spent >= this.limitUsd;
  }

  add(usd: number, now = Date.now()): void {
    this.exhausted(now);
    this.spent += usd;
  }

  get spentToday(): number {
    return this.spent;
  }
}
