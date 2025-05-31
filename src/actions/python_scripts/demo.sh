#!/bin/bash

# Aldous Database Document Uploader Demo
# This script demonstrates operations with the aldous_db database

echo "🚀 Aldous Database Document Uploader Demo"
echo "========================================="
echo "Database: aldous_db"
echo "Collections: users, agents, profiles, chatsessions, analyses"
echo ""

# Check if Python script exists
if [ ! -f "documentUploader.py" ]; then
    echo "❌ documentUploader.py not found in current directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt
echo ""

# Demo 1: Check database stats
echo "📊 Demo 1: Getting database statistics"
python documentUploader.py stats
echo ""

# Demo 2: Upload a single user
echo "👤 Demo 2: Uploading a single user"
python documentUploader.py upload \
    --collection "users" \
    --data '{"username": "demo_user", "password": "$2b$10$hashedpassword", "userClass": "client"}'
echo ""

# Demo 3: Upload a single agent
echo "🤖 Demo 3: Uploading a single agent"
python documentUploader.py upload \
    --collection "agents" \
    --data '{"name": "Demo Agent", "aiModel": "claude-3-5-sonnet-20241022", "prompt": "Demo prompt", "phone": "+1234567890", "activeStatus": true}'
echo ""

# Demo 4: Query users
echo "🔍 Demo 4: Querying users collection"
python documentUploader.py query \
    --collection "users" \
    --filter '{"userClass": "client"}' \
    --limit 5
echo ""

# Demo 5: Update an agent
echo "✏️ Demo 5: Updating agent status"
python documentUploader.py update \
    --collection "agents" \
    --filter '{"name": "Demo Agent"}' \
    --data '{"activeStatus": false, "prompt": "Updated demo prompt"}'
echo ""

# Demo 6: Bulk upload users
echo "📚 Demo 6: Bulk uploading users from JSON"
python documentUploader.py bulk \
    --collection "users" \
    --file "sample_users.json"
echo ""

# Demo 7: Bulk upload agents
echo "🤖 Demo 7: Bulk uploading agents from JSON"
python documentUploader.py bulk \
    --collection "agents" \
    --file "sample_agents.json"
echo ""

# Demo 8: Bulk upload profiles
echo "👥 Demo 8: Bulk uploading profiles from JSON"
python documentUploader.py bulk \
    --collection "profiles" \
    --file "sample_profiles.json"
echo ""

# Demo 9: Query active agents
echo "🔍 Demo 9: Querying active agents"
python documentUploader.py query \
    --collection "agents" \
    --filter '{"activeStatus": true}' \
    --sort "name" \
    --ascending
echo ""

# Demo 10: Collection statistics after uploads
echo "📊 Demo 10: Final database statistics"
python documentUploader.py stats
echo ""

echo "✅ Demo completed! Check your aldous_db database to see the results."
echo ""
echo "🧹 Cleanup (optional):"
echo "# To delete demo data, run:"
echo "python documentUploader.py delete --collection users --filter '{\"username\": \"demo_user\"}'"
echo "python documentUploader.py delete --collection agents --filter '{\"name\": \"Demo Agent\"}'"
echo ""
echo "🔧 Advanced Usage Examples:"
echo "=========================="
echo ""
echo "# Query with complex filter:"
echo "python documentUploader.py query --collection agents --filter '{\"activeStatus\": true, \"aiModel\": {\"\\$regex\": \"claude\"}}'"
echo ""
echo "# Update with upsert:"
echo "python documentUploader.py update --collection profiles --filter '{\"phone\": \"+1234567890\"}' --data '{\"country\": \"USA\"}' --upsert"
echo ""
echo "# Get specific collection stats:"
echo "python documentUploader.py stats --collection users"
echo ""
