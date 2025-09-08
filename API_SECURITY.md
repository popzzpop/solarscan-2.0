# API Key Security Configuration

## 🔑 Google Maps API Key Security

### Current API Key: `AIzaSyDx_lPJcFPQVTTx0-7NJtD2vGUyUNBHBnM`

**⚠️ CRITICAL: Configure these restrictions IMMEDIATELY in Google Cloud Console**

### Required API Restrictions

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/google/maps-apis/credentials
   - Select your API key: `AIzaSyDx_lPJcFPQVTTx0-7NJtD2vGUyUNBHBnM`

2. **Application Restrictions** (Choose ONE)
   
   **Option A: HTTP Referrers (Recommended for web apps)**
   ```
   https://yourdomain.com/*
   https://www.yourdomain.com/*
   https://solarscan.mt/*
   https://www.solarscan.mt/*
   ```
   
   **Option B: IP Addresses (If using server-side)**
   ```
   Your Railway deployment IP address
   Your development machine IP (temporary)
   ```

3. **API Restrictions** - Limit to ONLY these APIs:
   - ✅ Maps JavaScript API
   - ✅ Solar API
   - ✅ Geocoding API
   - ✅ Places API
   - ❌ All other APIs (disable them)

### Required API Enablement

Ensure these APIs are enabled in your Google Cloud project:

1. **Maps JavaScript API** - For map display
2. **Solar API** - For solar potential data
3. **Geocoding API** - For address lookup
4. **Places API** - For address search

### Security Checklist

- [ ] **Set HTTP referrer restrictions** for your production domain
- [ ] **Limit to required APIs only** (4 APIs listed above)
- [ ] **Remove development domains** from restrictions before going live
- [ ] **Monitor API usage** in Google Cloud Console
- [ ] **Set up billing alerts** to prevent unexpected charges
- [ ] **Enable API key monitoring** for suspicious activity

### Railway Deployment Configuration

When deploying to Railway:

1. **Environment Variables**
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyDx_lPJcFPQVTTx0-7NJtD2vGUyUNBHBnM
   ```

2. **Domain Restrictions**
   - Add your Railway app domain to API restrictions
   - Format: `https://your-app.railway.app/*`

3. **Testing Configuration**
   ```bash
   # For local development (temporary)
   http://localhost:5173/*
   http://127.0.0.1:5173/*
   
   # Remove these before production!
   ```

## 📧 EmailJS Security

### Current Configuration:
- Service ID: `service_yobj5xp`
- Template ID: `template_xn0w90f`
- Public Key: `1xSyV_omwpk0XA8vh`

### EmailJS Dashboard Security Settings

1. **Rate Limiting** (Configure in EmailJS dashboard)
   - Max emails per minute: 5
   - Max emails per hour: 100
   - Max emails per day: 500

2. **Domain Restrictions**
   - Add your production domain
   - Remove localhost domains before production

3. **Template Security**
   - Review template variables for data exposure
   - Ensure no sensitive data in email content
   - Test with sample data

## 🔒 Security Monitoring

### What to Monitor

1. **API Usage Spikes**
   - Unusual traffic patterns
   - Rapid API consumption
   - Geographic anomalies

2. **Error Rates**
   - 401 Unauthorized errors (bad API key)
   - 403 Forbidden errors (restrictions working)
   - Rate limit violations

3. **Cost Monitoring**
   - Set billing alerts at $10, $50, $100
   - Monitor daily usage trends
   - Watch for unexpected charges

### Emergency Response

**If API key is compromised:**

1. **Immediately disable** the current API key in Google Console
2. **Generate new API key** with proper restrictions
3. **Update environment variables** in production
4. **Deploy updated application**
5. **Monitor for continued unauthorized usage**

**If unusual activity detected:**

1. Check error logs for patterns
2. Verify API restrictions are working
3. Contact Google Cloud Support if needed
4. Consider temporary IP restrictions

## 📋 Pre-Production Checklist

- [ ] Google Maps API key configured with domain restrictions
- [ ] Only required APIs enabled (Maps, Solar, Geocoding, Places)
- [ ] EmailJS rate limiting configured
- [ ] Billing alerts set up in Google Cloud
- [ ] API monitoring dashboard configured
- [ ] Emergency response plan documented
- [ ] .env file excluded from git (✅ Already done)
- [ ] All team members understand API security

## 🚨 Security Notes

1. **Never commit API keys** to version control
2. **Always use environment variables** for API keys
3. **Rotate API keys periodically** (every 6 months)
4. **Monitor API usage regularly** for anomalies
5. **Test restrictions** before going live
6. **Have backup API keys** ready for emergencies

---

**Last Updated:** $(date)
**API Key Updated:** Today
**Security Review:** Required before production deployment