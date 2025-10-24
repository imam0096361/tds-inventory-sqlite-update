# 🤖 AI Assistant Setup Guide

## Quick Start: Get Your Gemini API Key (FREE!)

### Step 1: Get Gemini API Key
1. Visit: **https://makersuite.google.com/app/apikey**
2. Click **"Create API Key"**
3. Select **"Create API key in new project"**
4. Copy your API key (it starts with `AIza...`)

### Step 2: Configure Your Local Environment

Create or update your `.env` file in the project root:

```env
# PostgreSQL Database (Your existing config)
DATABASE_URL=postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
POSTGRES_URL=postgresql://neondb_owner:npg_VWYJCfilwL47@ep-lively-cloud-a1lfo3j0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret (Your existing config)
JWT_SECRET=your-secret-key-change-in-production

# Node Environment
NODE_ENV=development

# AI Configuration (NEW - Add these lines)
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### Step 3: Configure Vercel Environment Variables

1. Go to: **https://vercel.com/your-username/tds-inventory-sqlite-update/settings/environment-variables**
2. Add these THREE new environment variables:

| Name | Value | Environment |
|------|-------|-------------|
| `AI_ENABLED` | `true` | Production, Preview, Development |
| `AI_PROVIDER` | `gemini` | Production, Preview, Development |
| `GEMINI_API_KEY` | `Your actual Gemini API key` | Production, Preview, Development |

3. Click **"Redeploy"** to apply changes

### Step 4: Test Locally

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

Visit: **http://localhost:5173/ai-assistant**

---

## 🎯 How to Use AI Assistant

### Example Queries

Try these queries after setup:

1. **"Show me all PCs with Core i7 and 8GB RAM"**
   - Finds PCs matching CPU and RAM specs

2. **"Find laptops in HR department with battery problems"**
   - Filters by department and hardware status

3. **"List all servers that are offline"**
   - Shows servers with offline status

4. **"Show me all PCs that need repair"**
   - Finds PCs with repair status

5. **"Find all mice distributed in IT department"**
   - Searches mouse logs by department

6. **"List keyboards serviced this year"**
   - Filters keyboard logs by date

7. **"Show all laptops with good hardware status"**
   - Filters laptops by hardware condition

### Query Tips

✅ **DO:**
- Use natural language
- Be specific about what you want
- Mention field names (department, status, CPU, RAM, etc.)
- Ask for specific modules (PCs, laptops, servers, peripherals)

❌ **DON'T:**
- Use overly complex queries
- Ask multiple unrelated questions at once
- Use technical SQL syntax (AI handles this for you)

---

## 📊 Supported Data Fields

### PCs
- department, ip, pcName, username, motherboard, cpu, ram, storage, monitor, os, status (OK/NO/Repair), floor (5/6/7)

### Laptops
- pcName, username, brand, model, cpu, serialNumber, ram, storage, userStatus, department, date, hardwareStatus (Good/Battery Problem/Platform Problem)

### Servers
- serverID, brand, model, cpu, totalCores, ram, storage, raid, status (Online/Offline/Maintenance), department

### Peripherals (Mouse/Keyboard/SSD)
- productName, serialNumber, pcName, pcUsername, department, date, time, servicedBy, comment

---

## 🔍 Troubleshooting

### Issue: "AI Assistant is not enabled"
**Solution:** 
- Check `.env` file has `AI_ENABLED=true`
- Check `GEMINI_API_KEY` is set correctly
- Restart the development server

### Issue: "Failed to process query"
**Solution:**
- Check your API key is valid
- Check you haven't exceeded Gemini's free tier limits (60 requests/minute)
- Try simplifying your query

### Issue: "No results found"
**Solution:**
- Check your database has data
- Try a simpler query first
- Check field names match your database

### Issue: Works locally but not on Vercel
**Solution:**
- Verify environment variables are set in Vercel dashboard
- Make sure all three AI variables are set
- Redeploy after adding variables
- Check Vercel function logs for errors

---

## 💰 Gemini API Free Tier Limits

- **60 requests per minute** - More than enough for normal use
- **No cost** for standard usage
- **No credit card required** to start

---

## 🔒 Security Notes

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Keep API key secret** - Don't share publicly
3. **Rotate keys if exposed** - Generate new key from Google AI Studio
4. **Use different keys** for dev/prod (recommended)

---

## 🚀 Next Steps After Setup

1. **Test basic queries** - Start with simple examples
2. **Explore query history** - See past searches
3. **Export results** - Use CSV export for reports
4. **Train your team** - Show them how to use natural language queries
5. **Customize prompts** - Edit `server-postgres.cjs` AI prompt if needed

---

## 📞 Need Help?

- **Gemini API Docs:** https://ai.google.dev/docs
- **Get API Key:** https://makersuite.google.com/app/apikey
- **View Usage:** https://makersuite.google.com/app/apikey (same page)

---

## ✨ Features

- ✅ Natural language queries
- ✅ Smart database search
- ✅ Export results to CSV
- ✅ Query history (last 10 queries)
- ✅ Support for all inventory modules
- ✅ Real-time AI processing
- ✅ Beautiful, modern UI
- ✅ Mobile responsive

---

**Enjoy your AI-powered inventory assistant! 🎉**

