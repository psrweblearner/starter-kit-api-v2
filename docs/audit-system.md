# Website Audit System Contract

## API Endpoints
- `POST /v1/audit/run`
- `GET /v1/audit/result/:jobId`
- `GET /v1/audit/result/:jobId/subscribe`
- `POST /v1/audit/result/:jobId/clear-cache`

## Request Payload
```json
{
  "domain": "example.com",
  "businessName": "Example Inc",
  "competitors": ["competitor1.com", "competitor2.com"],
  "mode": "mobile"
}
```

## Response Shape (result data)
```json
{
  "summary": {
    "domain": "example.com",
    "generatedAt": "2026-04-24T00:00:00.000Z",
    "elapsedMs": 9302,
    "overallScore": 74,
    "keyIssuesCount": 8
  },
  "scores": {
    "weights": {
      "performance": 30,
      "seo": 30,
      "tracking": 10,
      "localSeo": 10,
      "bestPracticesSecurity": 20
    },
    "overallScore": 74,
    "categories": {
      "performance": 71,
      "seo": 69,
      "tracking": 60,
      "localSeo": 77,
      "bestPracticesSecurity": 81
    }
  },
  "modules": {},
  "issues": [],
  "recommendations": [],
  "competitiveGap": {},
  "insights": {},
  "costMeta": {
    "pagespeedCalls": 3,
    "mapsCalls": 3,
    "cacheHit": false
  }
}
```

## Database Schema (using existing `jobs` table)
Audit jobs are stored in `jobs` with:
- `type = audit`
- `status = pending|processing|completed|failed`
- `input_data` JSON request payload
- `result_data` LONGTEXT normalized report JSON
- `error`, `attempts`, `user_id`

For future SaaS analytics, add tables:
- `audit_reports` (report metadata, score, tenant)
- `audit_module_results` (module-wise snapshots)
- `audit_issues` (severity, evidence, recommendation mapping)
