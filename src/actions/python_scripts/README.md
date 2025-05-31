# Aldous Database Document Uploader

A Python script for managing documents in the **aldous_db** MongoDB database. This tool provides command-line operations for the five main collections based on your database schema.

## Database Schema

**Database:** `aldous_db`  
**Collections:**
- `users` - System users with authentication and roles
- `agents` - AI agents with configurations and assignments  
- `profiles` - User profile information and metadata
- `chatsessions` - Chat conversations between users and agents
- `analyses` - User analysis data and psychological insights

## Prerequisites

1. **Python 3.7+**
2. **MongoDB Atlas access** with credentials in `.env.local`
3. **Required packages:**
   ```bash
   pip install -r requirements.txt
   ```

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the demo:**
   ```bash
   chmod +x demo.sh
   ./demo.sh
   ```

3. **Basic usage:**
   ```bash
   # Check database status
   python documentUploader.py stats
   
   # Upload a user
   python documentUploader.py upload --collection users --data '{"username": "john", "userClass": "client"}'
   
   # Query agents
   python documentUploader.py query --collection agents --filter '{"activeStatus": true}'
   ```

## Operations

### 1. Upload Documents

```bash
# Upload a user
python documentUploader.py upload \
    --collection "users" \
    --data '{"username": "john_doe", "password": "$2b$10$hashed", "userClass": "client"}'

# Upload an agent
python documentUploader.py upload \
    --collection "agents" \
    --data '{"name": "Assistant", "aiModel": "claude-3-5-sonnet-20241022", "prompt": "You are helpful", "phone": "+1234567890"}'

# Upload a profile
python documentUploader.py upload \
    --collection "profiles" \
    --data '{"name": "John Doe", "country": "USA", "phone": "+1234567890"}'
```

### 2. Update Documents

```bash
# Update agent status
python documentUploader.py update \
    --collection "agents" \
    --filter '{"name": "Assistant"}' \
    --data '{"activeStatus": false}'

# Update user class with upsert
python documentUploader.py update \
    --collection "users" \
    --filter '{"username": "john_doe"}' \
    --data '{"userClass": "superuser"}' \
    --upsert
```

### 3. Query Documents

```bash
# Find active agents
python documentUploader.py query \
    --collection "agents" \
    --filter '{"activeStatus": true}' \
    --sort "name" \
    --limit 10

# Find users by class
python documentUploader.py query \
    --collection "users" \
    --filter '{"userClass": "admin"}' \
    --ascending
```

### 4. Delete Documents

```bash
# Delete inactive agents
python documentUploader.py delete \
    --collection "agents" \
    --filter '{"activeStatus": false}'

# Delete specific user
python documentUploader.py delete \
    --collection "users" \
    --filter '{"username": "demo_user"}'
```

### 5. Bulk Operations

```bash
# Bulk upload from JSON file
python documentUploader.py bulk \
    --collection "users" \
    --file "sample_users.json"

python documentUploader.py bulk \
    --collection "agents" \
    --file "sample_agents.json"
```

### 6. Database Statistics

```bash
# All collections
python documentUploader.py stats

# Specific collection
python documentUploader.py stats --collection users
```

## Document Validation

The script validates documents according to your database schema:

### Users Collection
- **Required:** `username`, `userClass`
- **Valid userClass:** `admin`, `superuser`, `client`
- **Optional:** `password`, `profilePic`, `agents[]`

### Agents Collection  
- **Required:** `name`, `aiModel`
- **Required:** At least `phone` OR `socialID`
- **Default:** `activeStatus: true`
- **Optional:** `prompt`, `icon`, `assignedClients[]`, `profiles[]`

### Profiles Collection
- **Required:** `name`, `country`, `phone`
- **Optional:** `profilePic`, `socialIDs[]`, `analysis`, `assignedAgentID`, `chatSessions[]`

### Chat Sessions Collection
- **Required:** `subjectID`, `assignedAgentID`, `language`, `sessionDate`
- **Default:** `messages: []`
- **Optional:** `agentPlatform`, `agentPlatformID`, `metadata`

### Analyses Collection
- **Required:** `subjectID`
- **Default:** `lastUpdated: now()`
- **Optional:** `completeAnalysis`

## Sample Data Files

The script includes sample JSON files for testing:

- `sample_users.json` - Example users with different roles
- `sample_agents.json` - AI agents with various configurations
- `sample_profiles.json` - User profiles with contact info
- `sample_chatsessions.json` - Chat conversations with messages
- `sample_analyses.json` - Psychological analysis data

## Advanced Examples

### Complex Queries
```bash
# Find Claude agents that are active
python documentUploader.py query \
    --collection "agents" \
    --filter '{"activeStatus": true, "aiModel": {"$regex": "claude"}}'

# Find profiles from specific countries
python documentUploader.py query \
    --collection "profiles" \
    --filter '{"country": {"$in": ["USA", "Canada"]}}'

# Recent chat sessions
python documentUploader.py query \
    --collection "chatsessions" \
    --filter '{"sessionDate": {"$gte": "2025-05-01T00:00:00.000Z"}}' \
    --sort "sessionDate"
```

### Batch Operations
```bash
# Update all inactive agents
python documentUploader.py update \
    --collection "agents" \
    --filter '{"activeStatus": false}' \
    --data '{"$set": {"lastChecked": "2025-05-29T00:00:00.000Z"}}'

# Add tags to all profiles
python documentUploader.py update \
    --collection "profiles" \
    --filter '{}' \
    --data '{"$set": {"tags": ["imported"]}}'
```

## Command Line Arguments

| Argument | Description | Required | Example |
|----------|-------------|----------|---------|
| `operation` | upload, update, delete, query, bulk, stats | ✅ | `upload` |
| `--collection` | Collection name | ⚠️ | `users` |
| `--data` | JSON document data | ⚠️ | `'{"name": "John"}'` |
| `--filter` | Query filter | ❌ | `'{"active": true}'` |
| `--file` | JSON file path | ⚠️ | `sample_users.json` |
| `--limit` | Result limit | ❌ | `10` |
| `--sort` | Sort field | ❌ | `name` |
| `--ascending` | Sort order | ❌ | |
| `--upsert` | Create if not found | ❌ | |

## Error Handling

The script provides comprehensive validation:

- ✅ Schema validation for each collection
- ✅ Required field checking  
- ✅ Data type validation
- ✅ MongoDB connection error handling
- ✅ JSON parsing error handling
- ✅ Detailed error messages

## Environment Configuration

Make sure your `.env.local` contains:
```bash
NEXT_PUBLIC_MONGODB_USERNAME=your_username
NEXT_PUBLIC_MONGODB_PASSWORD=your_password
```

## Security Notes

1. **Passwords** should be properly hashed before uploading
2. **Validate inputs** before bulk operations
3. **Backup data** before large operations
4. **Use filters** carefully to avoid unintended changes

## Development

### Testing
```bash
# Run full demo
./demo.sh

# Test specific operations
python documentUploader.py stats
python documentUploader.py query --collection users --filter '{}'
```

### Schema Updates
When the database schema changes, update the validation functions in the script:
- `_validate_user_document()`
- `_validate_agent_document()` 
- `_validate_profile_document()`
- `_validate_chatsession_document()`
- `_validate_analysis_document()`

---

**Part of the Aldous system by Mythos Labs**

For questions or issues, contact the development team.
