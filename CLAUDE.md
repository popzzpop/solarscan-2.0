# Claude Code Configuration & Instructions

## 🔒 Privacy & Git Configuration

**IMPORTANT: Protect your privacy when working with git!**

### Anonymous Git Configuration

To avoid exposing your real name in commits, configure git with anonymous credentials:

```bash
# Set anonymous credentials for this project
git config user.name "SolarScan Developer"
git config user.email "dev@solarscan.local"

# Verify configuration
git config user.name
git config user.email
```

### Global Git Privacy (Optional)

If you want to use anonymous credentials for all projects:

```bash
# Set global anonymous credentials
git config --global user.name "Developer"
git config --global user.email "dev@localhost"
```

## 🛠️ Development Commands

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run check

# Lint and format
npm run lint
npm run format

# Security audit
npm audit
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm run start
```

## 🔐 Security Configuration

### Environment Variables Required

```bash
# Google Maps API (with domain restrictions!)
VITE_GOOGLE_MAPS_API_KEY="your_api_key_here"

# EmailJS for lead capture
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_NOTIFICATION_EMAIL=your-email@example.com
```

### Security Checklist

Before deploying to production:

- [ ] Configure Google Maps API domain restrictions
- [ ] Set up EmailJS rate limiting  
- [ ] Review SECURITY.md file
- [ ] Check API_SECURITY.md for API key setup
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Verify .env is not committed to git
- [ ] Test all security measures

## 📁 Important Files

- **SECURITY.md** - Complete security documentation
- **API_SECURITY.md** - API key configuration guide
- **.env.example** - Environment variables template
- **src/lib/security.ts** - Security utilities and rate limiting
- **src/lib/emailService.ts** - Email service with security measures

## 🚨 Privacy Reminders

1. **Never commit real names** - Always use anonymous git config
2. **Never commit API keys** - Use environment variables only
3. **Never commit personal information** - Review commits before pushing
4. **Use project-specific git config** - Keep personal info separate

## 📝 Development Notes

### Current Security Measures

- ✅ Rate limiting (3 emails/5min, 30 searches/min)
- ✅ Input validation and sanitization
- ✅ XSS prevention
- ✅ Content Security Policy headers
- ✅ Secure API key handling
- ✅ Error logging without sensitive data

### Architecture Notes

- **SvelteKit** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Maps API** - Map functionality
- **Solar API** - Solar potential data
- **EmailJS** - Client-side email service

### Performance Optimizations

- Lazy loading of components
- Optimized image handling
- Efficient API calls
- Client-side caching where appropriate

---

**Remember: Privacy first! Always use anonymous git configuration.**