# 🔑 Gemini API Key Setup - Step by Step

## ⚠️ CRITICAL: You MUST add the API key to Vercel for it to work!

The AI Assistant needs a **FREE Gemini API key** from Google. Here's exactly how to set it up:

---

## 📋 Step 1: Get Your FREE Gemini API Key

### Option A: Using Google AI Studio (Recommended - Easiest)

1. **Go to**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click**: "Create API Key"
4. **Select**: "Create API key in new project" (or use existing project)
5. **Copy** the API key (starts with `AIza...`)
6. **Save it** somewhere safe (you'll need it in the next steps)

### Option B: Using Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable "Generative Language API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

---

## 🚀 Step 2: Add API Key to Vercel (REQUIRED!)

### Go to your Vercel Dashboard:

**Direct Link**: https://vercel.com/imam0096361/tds-inventory-sqlite-update/settings/environment-variables

### Add THREE environment variables:

Click **"Add"** button for each of these:

#### Variable 1:
- **Key**: `AI_ENABLED`
- **Value**: `true`
- **Environment**: ✅ Production ✅ Preview ✅ Development

#### Variable 2:
- **Key**: `AI_PROVIDER`
- **Value**: `gemini`
- **Environment**: ✅ Production ✅ Preview ✅ Development

#### Variable 3:
- **Key**: `GEMINI_API_KEY`
- **Value**: `YOUR_ACTUAL_API_KEY_HERE` (paste the key you copied)
- **Environment**: ✅ Production ✅ Preview ✅ Development

### Important Notes:
- ⚠️ Make sure you paste the ACTUAL API key, not the text "YOUR_ACTUAL_API_KEY_HERE"
- ⚠️ Check all three environment checkboxes (Production, Preview, Development)
- ⚠️ Click "Save" after adding each variable

---

## 🔄 Step 3: Redeploy Your Application

After adding the environment variables:

1. Go to: https://vercel.com/imam0096361/tds-inventory-sqlite-update
2. Go to the **"Deployments"** tab
3. Find the latest deployment
4. Click the **three dots menu** (⋯)
5. Click **"Redeploy"**
6. Wait 2-3 minutes for deployment to complete

---

## ✅ Step 4: Verify It's Working

1. Visit: https://tds-inventory-sqlite-update.vercel.app/ai-assistant
2. Login if needed (username: `admin`, password: `admin123`)
3. Type: **"Find laptops in HR department with battery problems"**
4. Click **"Ask AI"**
5. You should see results! 🎉

---

## 🐛 Troubleshooting

### Error: "AI Assistant is not enabled"
**Solution**: You forgot to add environment variables to Vercel
- Go back to Step 2 and add all THREE variables

### Error: "[404 Not Found]"
**Possible causes**:
1. **API key not set in Vercel** (most common)
   - Go to Vercel dashboard and verify variables are there
   - Make sure you clicked "Save"
   - Redeploy after adding variables

2. **Invalid API key**
   - Get a new key from https://aistudio.google.com/app/apikey
   - Make sure you copied the entire key (starts with `AIza`)
   - No extra spaces before/after the key

3. **API not enabled**
   - Your Google account needs access to Gemini API
   - Try creating a new API key
   - Make sure you're using a Google account (not organization account)

### Error: "Rate limit exceeded"
**Solution**: You've made too many requests
- Free tier limit: 60 requests per minute
- Wait 1 minute and try again
- Consider using a different API key for testing

---

## 💰 Cost Check

**Gemini API Free Tier:**
- ✅ FREE forever
- ✅ 60 requests per minute
- ✅ No credit card required
- ✅ More than enough for your inventory system

**Your typical usage**: 10-20 queries per day = **$0.00 per month**

---

## 📸 Visual Guide

### Where to find environment variables in Vercel:

```
Vercel Dashboard
  → Select your project: "tds-inventory-sqlite-update"
    → Settings tab
      → Environment Variables
        → Add button
          → Add each of the 3 variables
```

### Your environment variables should look like:

```
AI_ENABLED = true
AI_PROVIDER = gemini  
GEMINI_API_KEY = AIzaSyABCDEF1234567890_YOUR_ACTUAL_KEY
```

---

## 🔒 Security Notes

1. **Never commit API key to Git** - Already protected in `.gitignore`
2. **Use environment variables only** - Never hardcode in code
3. **Rotate keys if exposed** - Get new key from Google AI Studio
4. **Keep Vercel dashboard secure** - Use strong password + 2FA

---

## 📞 Quick Links

- **Get API Key**: https://aistudio.google.com/app/apikey
- **Vercel Settings**: https://vercel.com/imam0096361/tds-inventory-sqlite-update/settings/environment-variables
- **Test AI Assistant**: https://tds-inventory-sqlite-update.vercel.app/ai-assistant
- **Google AI Docs**: https://ai.google.dev/docs

---

## ✨ After Setup

Once everything is configured, you can ask things like:

```
"Show me all PCs with Core i7 and 8GB RAM"
"Find laptops in HR department with battery problems"
"List all servers that are offline"
"Show me all PCs that need repair"
"Find all mice distributed in IT department"
```

The AI will understand your natural language and search your database automatically! 🚀

---

**Need help?** Check that:
- ✅ API key is from https://aistudio.google.com/app/apikey
- ✅ All 3 environment variables are in Vercel
- ✅ You clicked "Save" for each variable
- ✅ You redeployed after adding variables
- ✅ Variables are enabled for Production, Preview, and Development

