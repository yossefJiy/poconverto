# Cloudflare Integration Guide

## Overview

This document describes how to set up Cloudflare as DNS and CDN for the JIY Marketing Platform.

## Benefits

### Security
- **DDoS Protection**: Automatic protection against distributed denial-of-service attacks
- **WAF (Web Application Firewall)**: Protection against common web vulnerabilities
- **Bot Management**: Filter out malicious bots
- **SSL/TLS**: Free SSL certificates with automatic renewal

### Performance
- **CDN**: Global content delivery network with 275+ data centers
- **Caching**: Intelligent caching of static assets
- **Minification**: Automatic JavaScript/CSS/HTML minification
- **Compression**: Brotli and gzip compression

### Reliability
- **Always Online™**: Serve cached pages when origin is unavailable
- **Load Balancing**: Distribute traffic across multiple servers
- **Health Checks**: Monitor origin server health

## Setup Steps

### 1. Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for a free account
3. Add your domain

### 2. Update DNS Records
Point your domain's nameservers to Cloudflare:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

### 3. Configure DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | [Your Lovable IP] | ✓ |
| CNAME | www | yourdomain.com | ✓ |
| CNAME | api | [Supabase URL] | ✓ |

### 4. SSL/TLS Settings
- Set encryption mode to "Full (strict)"
- Enable "Always Use HTTPS"
- Set minimum TLS version to 1.2

### 5. Caching Rules

For API routes (`/functions/v1/*`):
```
Cache Level: Bypass
```

For static assets (`/assets/*`, `/*.js`, `/*.css`):
```
Cache Level: Standard
Edge TTL: 1 month
Browser TTL: 1 week
```

### 6. Security Rules

#### Rate Limiting
```
Path: /functions/v1/api-gateway/*
Rate: 100 requests per minute per IP
Action: Block for 1 hour
```

#### Country Blocking (if needed)
```
If country in [list]
Then: Block
```

#### Challenge Known Bots
```
If known bot
Then: Managed Challenge
```

### 7. Page Rules

Priority 1 - API Bypass:
```
URL: *yourdomain.com/functions/*
Settings: 
  - Cache Level: Bypass
  - Disable Apps
  - Disable Performance
```

Priority 2 - Static Assets:
```
URL: *yourdomain.com/assets/*
Settings:
  - Cache Level: Cache Everything
  - Edge TTL: 1 month
```

## Environment Variables

Add these to your Supabase secrets:

```
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ZONE_ID=your_zone_id
```

## Monitoring

### Analytics Dashboard
Access real-time analytics at:
- Requests by country
- Bandwidth usage
- Cache hit ratio
- Security events
- Performance metrics

### Alerts
Set up email alerts for:
- DDoS attacks
- SSL certificate expiry
- Origin server issues
- Rate limit triggers

## Workers (Optional)

For advanced use cases, Cloudflare Workers can:
- Custom caching logic
- A/B testing
- Request/response transformation
- Edge-side authentication

Example Worker for API routing:
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Add custom headers
  const modifiedRequest = new Request(request, {
    headers: {
      ...Object.fromEntries(request.headers),
      'X-Cloudflare-Worker': 'true',
      'X-Request-ID': crypto.randomUUID(),
    }
  })
  
  return fetch(modifiedRequest)
}
```

## Cost

### Free Plan Includes:
- Unlimited bandwidth
- DDoS protection
- SSL
- 3 Page Rules
- Basic analytics

### Pro Plan ($20/month):
- WAF
- Image optimization
- Mobile optimization
- 20 Page Rules

### Business Plan ($200/month):
- 100% SLA
- Custom SSL
- 50 Page Rules
- Advanced analytics

## Recommended Setup for JIY

For production:
1. Start with **Free Plan**
2. Enable proxy for all DNS records
3. Set SSL to Full (strict)
4. Add basic Page Rules for API bypass
5. Monitor analytics for 30 days
6. Upgrade to Pro if WAF needed
