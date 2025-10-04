# Supabase Setup Guide for PORSINARA

This guide will help you set up Supabase as the database for your PORSINARA application.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `porsinara-db`
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
   - **service_role** key (starts with `eyJ`) - Keep this secret!

## 3. Set Up Environment Variables

**⚠️ CRITICAL**: You must create a `.env.local` file or the application will crash with a 500 error!

1. Create a `.env.local` file in your project root:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Where to find these values:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Copy the **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the **anon public** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ainpogzkkaloebejshpc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` file
3. Paste it into the SQL editor
4. Click **Run** to execute the schema

This will create:
- ✅ `faculties` table with SOCS, SOD, BBS, FDCHT data
- ✅ `competitions` table with all sports and arts competitions
- ✅ `matches` table for storing match data
- ✅ `faculty_standings` table for medal tally
- ✅ `table_standings` table for arts competitions
- ✅ Sample data for testing

## 5. Real-time Features (Coming Soon)

**Note**: Supabase's Replication feature is coming soon. For now, we'll use polling to get live updates.

### Current Implementation:
- ✅ Database queries work immediately
- ✅ Data updates are saved to database
- ⏳ Real-time updates will use polling (refresh every few seconds)

### Future Enhancement:
Once Replication is available, you'll be able to enable real-time for:
- `matches`
- `faculty_standings` 
- `table_standings`

## 6. Set Up Row Level Security (RLS)

The schema includes RLS policies that allow:
- ✅ Public read access to all tables
- 🔒 Admin write access (you'll need to set up authentication later)

## 7. Test Your Connection

Run your Next.js application:
```bash
npm run dev
```

The application should now connect to Supabase instead of using mock data.

## 8. Database Structure

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `faculties` | Faculty information | `id`, `name`, `short_name`, `color` |
| `competitions` | Competition details | `id`, `name`, `type`, `format` |
| `matches` | Match data | `competition_id`, `faculty1_id`, `faculty2_id`, `score1`, `score2` |
| `faculty_standings` | Medal tally | `faculty_id`, `competition_id`, `gold`, `silver`, `bronze` |
| `table_standings` | Arts standings | `faculty_id`, `competition_id`, `points`, `rank` |

### Relationships

- `matches.faculty1_id` → `faculties.id`
- `matches.faculty2_id` → `faculties.id`
- `matches.competition_id` → `competitions.id`
- `faculty_standings.faculty_id` → `faculties.id`
- `faculty_standings.competition_id` → `competitions.id`
- `table_standings.faculty_id` → `faculties.id`
- `table_standings.competition_id` → `competitions.id`

## 9. Next Steps

After setting up the database:

1. **Update Data Fetching**: The application will automatically use Supabase queries
2. **Real-time Updates**: Live matches will update in real-time
3. **Admin Panel**: Score updates will be saved to the database
4. **Authentication**: Set up user authentication for admin access

## 10. Update RLS Policies for Admin Panel

The initial schema includes Row Level Security (RLS) policies that only allow read access. To enable the admin panel functionality, you need to add write policies:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL to add write policies:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public write access to matches" ON matches;
DROP POLICY IF EXISTS "Allow public write access to faculty_standings" ON faculty_standings;
DROP POLICY IF EXISTS "Allow public write access to table_standings" ON table_standings;

-- Create policies for public write access (for development - in production you'd want proper authentication)
CREATE POLICY "Allow public write access to matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow public write access to faculty_standings" ON faculty_standings FOR ALL USING (true);
CREATE POLICY "Allow public write access to table_standings" ON table_standings FOR ALL USING (true);
```

**Security Note**: These policies allow public write access for development purposes. In production, you should implement proper authentication and use role-based policies instead.

## 11. Troubleshooting

### Common Issues

1. **500 Internal Server Error**: 
   - **Cause**: Missing `.env.local` file or incorrect environment variables
   - **Solution**: Create `.env.local` file with correct Supabase URL and anon key
   - **Check**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

2. **Connection Error**: Check your environment variables
3. **Permission Denied**: Ensure RLS policies are set up correctly
4. **Real-time Not Working**: Enable replication for tables
5. **Data Not Loading**: Check the browser console for errors

### Useful Commands

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- View sample data
SELECT * FROM faculties;
SELECT * FROM competitions;
SELECT * FROM matches LIMIT 5;
```

## 11. Production Considerations

For production deployment:

1. **Environment Variables**: Set up in your hosting platform
2. **Database Backups**: Enable automatic backups in Supabase
3. **Monitoring**: Set up monitoring and alerts
4. **Security**: Review and tighten RLS policies
5. **Performance**: Add indexes for frequently queried fields

---

Your PORSINARA application is now ready to use Supabase as its database! 🎉
