# How to Push This Project to GitHub

## Step 1: Initialize Git Repository

Run these commands in your terminal:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create first commit
git commit -m "Initial commit: TDS IT Inventory Management System"
```

## Step 2: Create a New Repository on GitHub

1. Go to [GitHub](https://github.com)
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `tds-it-inventory` (or your preferred name)
   - **Description**: "IT Inventory Management System with React, Express, and SQLite"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 3: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tds-it-inventory.git

# Verify the remote was added
git remote -v

# Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

## Step 4: (Optional) Set Up SSH Authentication

If you prefer SSH over HTTPS:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub

# Add the key to GitHub:
# 1. Go to GitHub Settings > SSH and GPG keys
# 2. Click "New SSH key"
# 3. Paste your public key
# 4. Click "Add SSH key"

# Then use SSH URL instead:
git remote set-url origin git@github.com:YOUR_USERNAME/tds-it-inventory.git
```

## Important Notes

### Files Excluded from Git (in .gitignore):
- `node_modules/` - Dependencies (will be installed via npm)
- `database.db` - Database file with your data
- `.env` files - Environment variables
- `dist/` - Build output
- Log files

### After Cloning the Repository (for others or on a new machine):

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tds-it-inventory.git
cd tds-it-inventory

# Install dependencies
npm install

# Run the application
npm run dev
```

The database will be created automatically when the server starts for the first time.

## Future Updates

To push future changes:

```bash
# Check status of changes
git status

# Add changed files
git add .

# Commit changes with a message
git commit -m "Description of your changes"

# Push to GitHub
git push
```

## Common Git Commands

```bash
# Check current branch
git branch

# Create and switch to a new branch
git checkout -b feature-name

# Switch to existing branch
git checkout branch-name

# Pull latest changes from GitHub
git pull

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD
```

## Recommended README.md Sections

Make sure your README.md includes:
- Project description
- Features
- Technologies used
- Installation instructions
- How to run the project
- API documentation (if applicable)
- Screenshots (optional)
- License information

