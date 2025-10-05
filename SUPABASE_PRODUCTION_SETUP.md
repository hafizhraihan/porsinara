# Supabase Production Setup Guide

## 🔧 Required Supabase Configuration Changes

To deploy your PORSINARA app to production, you need to update your Supabase project settings to allow requests from your production domain.

### 1. Authentication Settings

**Go to:** Authentication → URL Configuration

**Add to Site URL:**
```
https://your-netlify-domain.netlify.app
```

**Add to Redirect URLs:**
```
https://your-netlify-domain.netlify.app/**
https://your-netlify-domain.netlify.app/admin/login
```

### 2. API Settings

**Go to:** Settings → API

**Check that:**
- Project URL includes your production domain
- CORS settings allow your domain
- API is enabled for public access

### 3. Row Level Security (RLS)

**Go to:** Authentication → Policies

**Ensure policies allow:**
- Public read access for competitions, faculties, matches
- Admin access for admin_users table

### 4. Environment Variables for Netlify

**Add to Netlify Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Common Issues & Solutions

**Issue:** "Invalid API key" error
**Solution:** Check that the anon key is correct and the API is enabled

**Issue:** CORS errors
**Solution:** Add your domain to the allowed origins in Supabase settings

**Issue:** RLS blocking requests
**Solution:** Update RLS policies to allow public access for read operations

### 6. Testing

After configuration:
1. Deploy to Netlify
2. Check browser console for any Supabase errors
3. Test admin login functionality
4. Verify data loading on the main dashboard

## 📝 Quick Checklist

- [ ] Site URL updated in Supabase
- [ ] Redirect URLs configured
- [ ] API settings checked
- [ ] RLS policies reviewed
- [ ] Environment variables added to Netlify
- [ ] Production deployment tested
