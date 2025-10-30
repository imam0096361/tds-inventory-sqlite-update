#!/bin/bash

# Generate secure secrets for production

echo "🔐 Generating Secure Secrets..."
echo ""

# Generate JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -hex 32)
echo "✅ JWT_SECRET (64 chars):"
echo "$JWT_SECRET"
echo ""

# Generate Database Password (32 characters)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "✅ DB_PASSWORD (32 chars):"
echo "$DB_PASSWORD"
echo ""

# Example .env output
echo "📝 Add these to your .env file:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "DATABASE_URL=your_neon_db_url_here"
echo ""
echo "✅ Done!"

