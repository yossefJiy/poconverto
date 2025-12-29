# תכנית מעבר לארכיטקטורת Microservices

## מבנה נוכחי

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│  (Dashboard, Analytics, Campaigns, Tasks, Team, Settings)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐ │
│  │ Auth        │ │ Database     │ │ Edge Functions        │ │
│  │ (built-in)  │ │ (PostgreSQL) │ │ (shopify, google-ads) │ │
│  └─────────────┘ └──────────────┘ └───────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## מבנה יעד - Microservices

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           React Frontend                                 │
│  (Client App - Single Page Application)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Gateway                                    │
│  (Rate Limiting, Auth Validation, Request Routing, Load Balancing)       │
└─────────────────────────────────────────────────────────────────────────┘
          │           │           │           │           │           │
          ▼           ▼           ▼           ▼           ▼           ▼
     ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
     │ Auth   │  │ Data   │  │Integr. │  │Reports │  │  AI    │  │ Events │
     │Service │  │Service │  │Service │  │Service │  │Service │  │ Bus    │
     └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
          │           │           │           │           │           │
          └───────────┴───────────┴─────┬─────┴───────────┴───────────┘
                                        │
                           ┌────────────┴────────────┐
                           │                         │
                      ┌────────┐              ┌────────────┐
                      │ Redis  │              │ PostgreSQL │
                      │ Cache  │              │  Database  │
                      └────────┘              └────────────┘
```

---

## סרוויסים שיש ליצור

### 1. Auth Service
**מטרה:** ניהול אימות והרשאות

**נקודות קצה:**
- `POST /auth/login` - התחברות
- `POST /auth/logout` - התנתקות
- `POST /auth/refresh` - רענון טוקן
- `POST /auth/2fa/send` - שליחת קוד 2FA
- `POST /auth/2fa/verify` - אימות קוד 2FA
- `GET /auth/session` - בדיקת סשן
- `POST /auth/oauth/google` - התחברות Google

**קבצים קיימים למיגרציה:**
- `supabase/functions/send-2fa-code/index.ts`
- `src/hooks/useAuth.tsx`
- `src/lib/authError.ts`

**טבלאות:**
- `auth.users` (managed by Supabase)
- `user_roles`
- `two_factor_codes`
- `authorized_emails`

---

### 2. Data Service
**מטרה:** CRUD לכל הישויות העסקיות

**נקודות קצה:**
```
# Clients
GET    /data/clients
POST   /data/clients
GET    /data/clients/:id
PUT    /data/clients/:id
DELETE /data/clients/:id

# Campaigns
GET    /data/campaigns
POST   /data/campaigns
GET    /data/campaigns/:id
PUT    /data/campaigns/:id
DELETE /data/campaigns/:id

# Tasks
GET    /data/tasks
POST   /data/tasks
PUT    /data/tasks/:id
DELETE /data/tasks/:id

# Team
GET    /data/team
POST   /data/team
PUT    /data/team/:id
DELETE /data/team/:id
```

**טבלאות:**
- `clients`
- `campaigns`
- `tasks`
- `team`
- `client_users`

**קבצים קיימים למיגרציה:**
- `supabase/functions/mcp-server/index.ts`
- `supabase/functions/data-api/index.ts`

---

### 3. Integrations Service
**מטרה:** ניהול חיבורים לפלטפורמות חיצוניות

**נקודות קצה:**
```
# Connection Management
POST   /integrations/connect
DELETE /integrations/disconnect/:id
GET    /integrations/status/:clientId

# Data Fetching
GET    /integrations/shopify/:clientId/orders
GET    /integrations/shopify/:clientId/products
GET    /integrations/shopify/:clientId/inventory
GET    /integrations/google-ads/:clientId/campaigns
GET    /integrations/google-ads/:clientId/metrics
GET    /integrations/google-analytics/:clientId/data
GET    /integrations/woocommerce/:clientId/orders

# Sync
POST   /integrations/sync/:clientId
GET    /integrations/sync-status/:clientId
```

**Edge Functions קיימות:**
- `shopify-api/index.ts` ✅
- `google-ads/index.ts` ✅
- `google-ads-oauth/index.ts` ✅
- `google-analytics/index.ts` ✅
- `woocommerce-api/index.ts` ✅
- `connect-integration/index.ts` ✅
- `sync-integrations/index.ts` ✅

**טבלאות:**
- `integrations`
- `sync_schedules`

---

### 4. Analytics Service
**מטרה:** אגרגציה וניתוח נתונים

**נקודות קצה:**
```
GET    /analytics/dashboard/:clientId
GET    /analytics/performance/:clientId
GET    /analytics/comparison/:clientId
GET    /analytics/trends/:clientId
POST   /analytics/snapshot/:clientId
GET    /analytics/snapshots/:clientId
```

**Edge Functions קיימות:**
- `sync-analytics-background/index.ts` ✅

**טבלאות:**
- `analytics_snapshots`
- `marketing_data`

---

### 5. Reports Service
**מטרה:** יצירת דוחות ומסמכים

**נקודות קצה:**
```
POST   /reports/generate
GET    /reports/:id
GET    /reports/list/:clientId
DELETE /reports/:id
POST   /reports/schedule
```

**Edge Functions קיימות:**
- `generate-report/index.ts` ✅

---

### 6. AI Service
**מטרה:** תוכן ותובנות מבוססי AI

**נקודות קצה:**
```
POST   /ai/content/generate
POST   /ai/insights/analyze
POST   /ai/suggestions/:clientId
```

**Edge Functions קיימות:**
- `ai-marketing/index.ts` ✅

---

### 7. Notifications Service
**מטרה:** שליחת התראות והודעות

**נקודות קצה:**
```
POST   /notifications/email/send
POST   /notifications/sms/send
POST   /notifications/push/send
GET    /notifications/history/:userId
```

**Edge Functions קיימות:**
- `send-admin-alert/index.ts` ✅
- `send-client-invitation/index.ts` ✅

---

### 8. Webhooks Service
**מטרה:** קבלת עדכונים מפלטפורמות חיצוניות

**נקודות קצה:**
```
POST   /webhooks/shopify
POST   /webhooks/google
POST   /webhooks/stripe
POST   /webhooks/custom
```

**Edge Functions קיימות:**
- `webhook-receiver/index.ts` ✅

---

## שלבי המיגרציה

### Phase 1: תשתית (2-3 שבועות)
1. הקמת API Gateway
2. הגדרת Redis Cache
3. יצירת Event Bus (RabbitMQ/Redis Pub-Sub)
4. הגדרת Docker Compose לפיתוח מקומי
5. CI/CD Pipeline

### Phase 2: Auth Service (1-2 שבועות)
1. העברת לוגיקת 2FA
2. Token Management
3. Session Handling
4. OAuth Flows

### Phase 3: Data Service (2 שבועות)
1. העברת כל ה-CRUD operations
2. Validation Layer
3. Error Handling
4. Rate Limiting per client

### Phase 4: Integrations Service (2-3 שבועות)
1. איחוד כל Edge Functions לסרוויס אחד
2. Connection Pool Management
3. Retry Logic
4. Circuit Breaker Pattern

### Phase 5: Analytics & Reports (1-2 שבועות)
1. העברת Analytics aggregation
2. Scheduled Jobs for snapshots
3. Report generation queue

### Phase 6: AI & Notifications (1 שבוע)
1. AI Service עם queue
2. Notifications עם priority

### Phase 7: Frontend Migration (2 שבועות)
1. עדכון כל ה-API calls
2. Error handling מרכזי
3. Offline support
4. Optimistic updates

---

## טכנולוגיות מומלצות

| רכיב | טכנולוגיה | סיבה |
|------|-----------|------|
| API Gateway | Kong / Nginx | Performance, Rate limiting |
| Services | Deno (Edge Functions) / Node.js | Consistency, TypeScript |
| Message Queue | Redis Pub/Sub | Simplicity, Speed |
| Cache | Redis | In-memory, Fast |
| Database | PostgreSQL (Supabase) | Already in use |
| Monitoring | Prometheus + Grafana | Standard |
| Logging | Loki / ELK | Centralized |

---

## יתרונות הארכיטקטורה החדשה

1. **Scalability** - כל סרוויס יכול להתרחב בנפרד
2. **Reliability** - נפילה של סרוויס אחד לא מפילה את כולם
3. **Development** - צוותים יכולים לעבוד במקביל
4. **Testing** - קל יותר לבדוק יחידות קטנות
5. **Deployment** - Deploy של שינויים קטנים בלי להשפיע על כל המערכת

---

## אתגרים וסיכונים

| אתגר | פתרון |
|------|--------|
| Data Consistency | Event Sourcing + Saga Pattern |
| Latency | Caching + Connection Pooling |
| Debugging | Distributed Tracing (Jaeger) |
| Authentication | Centralized Auth Service + JWT |
| Rate Limiting | API Gateway Level |

---

## הערכת זמנים כוללת

| שלב | זמן |
|-----|-----|
| תכנון מפורט | 1 שבוע |
| Phase 1-2 | 4 שבועות |
| Phase 3-4 | 4 שבועות |
| Phase 5-7 | 4 שבועות |
| Testing & QA | 2 שבועות |
| **סה"כ** | **~15 שבועות** |

---

## נספח: מבנה תיקיות מומלץ

```
/services
  /auth-service
    /src
      /routes
      /controllers
      /services
      /middleware
    /tests
    Dockerfile
    package.json
  
  /data-service
    ...
  
  /integrations-service
    ...
  
  /analytics-service
    ...
  
  /reports-service
    ...
  
  /ai-service
    ...
  
  /notifications-service
    ...

/shared
  /types
  /utils
  /constants

/infrastructure
  /docker
  /kubernetes
  /terraform

/gateway
  nginx.conf
  kong.yml
```

---

## הערה חשובה

התכנית הזו מתאימה למעבר מלא לארכיטקטורת Microservices. עם זאת, ניתן גם לשקול גישת **Modular Monolith** כשלב ביניים:

1. שמירה על הכל באותו deployment
2. הפרדה לוגית לפי domains
3. תקשורת פנימית דרך interfaces ברורים
4. מעבר ל-microservices רק לסרוויסים שצריכים scale נפרד

זה יכול לחסוך זמן משמעותי תוך שמירה על יתרונות ההפרדה הלוגית.
