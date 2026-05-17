# Use SQS pub/sub for social publishing, not for scraper sync

When a Club Admin publishes a Club Session to social channels (Instagram, WhatsApp, Telegram, TikTok), the platform enqueues one SQS message per channel and returns 202 Accepted immediately. Separate Lambda workers consume each queue and call the respective platform APIs, with independent retry behaviour per channel.

The scraper sync endpoint remains synchronous (direct HTTP POST → Lambda → DB). A queue adds no value there — the scraper is a cron job with no latency requirement and needs a clear success/failure signal.

## Consequences

SQS is free up to 1 million requests/month. Social publishing is a future feature; this ADR is recorded now to prevent the queue pattern being applied to the wrong place (e.g. scraper sync) when it is built.
