export type MetricsSnapshot = {
  startedAtMs: number;
  reqTotal: number;
  reqByRoute: Record<string, number>;
  reqByStatus: Record<string, number>;
  rateLimited: number;
  pushDailyScanned: number;
  pushDailySent: number;
  pushDailySkipped: number;
  pushDailyFailed: number;
  pushDailyRemoved: number;
  analyticsEventsIngested: number;
  analyticsEventsFailed: number;
};

export class Metrics {
  readonly startedAtMs = Date.now();
  reqTotal = 0;
  reqByRoute: Record<string, number> = {};
  reqByStatus: Record<string, number> = {};
  rateLimited = 0;
  pushDailyScanned = 0;
  pushDailySent = 0;
  pushDailySkipped = 0;
  pushDailyFailed = 0;
  pushDailyRemoved = 0;
  analyticsEventsIngested = 0;
  analyticsEventsFailed = 0;

  incAnalyticsEventsFailed() {
    this.analyticsEventsFailed += 1;
  }

  incAnalyticsEventsIngested() {
    this.analyticsEventsIngested += 1;
  }

  recordPushDailyRun(o: {
    scanned: number;
    sent: number;
    skipped: number;
    failed: number;
    removed: number;
  }) {
    this.pushDailyScanned += o.scanned | 0;
    this.pushDailySent += o.sent | 0;
    this.pushDailySkipped += o.skipped | 0;
    this.pushDailyFailed += o.failed | 0;
    this.pushDailyRemoved += o.removed | 0;
  }

  incRoute(route: string) {
    this.reqTotal += 1;
    this.reqByRoute[route] = (this.reqByRoute[route] ?? 0) + 1;
  }

  incStatus(status: number) {
    const k = String(status);
    this.reqByStatus[k] = (this.reqByStatus[k] ?? 0) + 1;
  }

  snapshot(): MetricsSnapshot {
    return {
      startedAtMs: this.startedAtMs,
      reqTotal: this.reqTotal,
      reqByRoute: { ...this.reqByRoute },
      reqByStatus: { ...this.reqByStatus },
      rateLimited: this.rateLimited,
      pushDailyScanned: this.pushDailyScanned,
      pushDailySent: this.pushDailySent,
      pushDailySkipped: this.pushDailySkipped,
      pushDailyFailed: this.pushDailyFailed,
      pushDailyRemoved: this.pushDailyRemoved,
      analyticsEventsIngested: this.analyticsEventsIngested,
      analyticsEventsFailed: this.analyticsEventsFailed
    };
  }

  renderPrometheus(service = "nyrvexis-gateway"): string {
    const lines: string[] = [];
    const up = 1;
    lines.push(`# HELP kr_up Service is up`);
    lines.push(`# TYPE kr_up gauge`);
    lines.push(`kr_up{service="${service}"} ${up}`);

    lines.push(`# HELP kr_requests_total Total requests`);
    lines.push(`# TYPE kr_requests_total counter`);
    lines.push(`kr_requests_total{service="${service}"} ${this.reqTotal}`);

    lines.push(`# HELP kr_requests_by_route_total Requests by route`);
    lines.push(`# TYPE kr_requests_by_route_total counter`);
    for (const [route, v] of Object.entries(this.reqByRoute)) {
      lines.push(`kr_requests_by_route_total{service="${service}",route="${route}"} ${v}`);
    }

    lines.push(`# HELP kr_requests_by_status_total Requests by status`);
    lines.push(`# TYPE kr_requests_by_status_total counter`);
    for (const [status, v] of Object.entries(this.reqByStatus)) {
      lines.push(`kr_requests_by_status_total{service="${service}",status="${status}"} ${v}`);
    }

    lines.push(`# HELP kr_rate_limited_total Rate limited requests`);
    lines.push(`# TYPE kr_rate_limited_total counter`);
    lines.push(`kr_rate_limited_total{service="${service}"} ${this.rateLimited}`);

    lines.push(`# HELP kr_push_daily_scanned_total Subscriptions examined by internal daily push job`);
    lines.push(`# TYPE kr_push_daily_scanned_total counter`);
    lines.push(`kr_push_daily_scanned_total{service="${service}"} ${this.pushDailyScanned}`);

    lines.push(`# HELP kr_push_daily_sent_total Successful web push sends from daily job`);
    lines.push(`# TYPE kr_push_daily_sent_total counter`);
    lines.push(`kr_push_daily_sent_total{service="${service}"} ${this.pushDailySent}`);

    lines.push(`# HELP kr_push_daily_skipped_total Skipped (already sent today or dry-run) in daily job`);
    lines.push(`# TYPE kr_push_daily_skipped_total counter`);
    lines.push(`kr_push_daily_skipped_total{service="${service}"} ${this.pushDailySkipped}`);

    lines.push(`# HELP kr_push_daily_failed_total Failed sends (non-410) in daily job`);
    lines.push(`# TYPE kr_push_daily_failed_total counter`);
    lines.push(`kr_push_daily_failed_total{service="${service}"} ${this.pushDailyFailed}`);

    lines.push(`# HELP kr_push_daily_removed_total Subscriptions removed after 410 in daily job`);
    lines.push(`# TYPE kr_push_daily_removed_total counter`);
    lines.push(`kr_push_daily_removed_total{service="${service}"} ${this.pushDailyRemoved}`);

    lines.push(`# HELP kr_analytics_events_ingested_total Accepted analytics events (Postgres)`);
    lines.push(`# TYPE kr_analytics_events_ingested_total counter`);
    lines.push(`kr_analytics_events_ingested_total{service="${service}"} ${this.analyticsEventsIngested}`);

    lines.push(`# HELP kr_analytics_events_failed_total Failed / rejected analytics events`);
    lines.push(`# TYPE kr_analytics_events_failed_total counter`);
    lines.push(`kr_analytics_events_failed_total{service="${service}"} ${this.analyticsEventsFailed}`);

    return lines.join("\n") + "\n";
  }
}

