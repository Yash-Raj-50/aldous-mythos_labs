from pymongo import MongoClient
from dotenv import load_dotenv
import os
import uuid
from datetime import datetime
import json

# Load environment variables
load_dotenv()
MONGODB_USERNAME = os.getenv('NEXT_PUBLIC_MONGODB_USERNAME')
MONGODB_PASSWORD = os.getenv('NEXT_PUBLIC_MONGODB_PASSWORD')
BOT_ID = os.getenv('DEMO_BOT_ID', '4b5ab6c4-2c39-4237-a457-b6ffc358fe19')  # Default or from .env

# Connect to source MongoDB (ctbot cluster)
source_uri = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot"
source_client = MongoClient(source_uri)
source_db = source_client["user-chat"]
source_collection = source_db["users_simulated"]

# Connect to target MongoDB (clusteraustraliaflex)
target_uri = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAustraliaFlex"
target_client = MongoClient(target_uri)
target_db = target_client["sago_db"]
target_collection = target_db["chat"]

# Helper function to convert timestamp to milliseconds since epoch
def to_epoch_ms(timestamp_str):
    try:
        # Try parsing different date formats
        for fmt in ["%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"]:
            try:
                dt = datetime.strptime(timestamp_str, fmt)
                return int(dt.timestamp() * 1000)
            except ValueError:
                continue
        
        # If all parsing attempts fail, use current time
        return int(datetime.now().timestamp() * 1000)
    except:
        # Fallback to current time if any error occurs
        return int(datetime.now().timestamp() * 1000)

# Function to migrate a single user's conversations
def migrate_user_conversations(user):
    user_id = user.get('userID')
    if not user_id:
        print(f"Skipping user without userID: {user.get('_id')}")
        return 0
    
    print(f"Processing user: {user_id}")
    
    # Use the exact same userID as in the source database
    # No formatting/prefixing - keep it identical
    session_id = user_id
    
    # Get user's conversation messages
    conversation = user.get('conversation', [])
    if not conversation or not isinstance(conversation, list):
        print(f"No valid conversation data for user {user_id}")
        return 0
    
    migrated_count = 0
    for msg in conversation:
        # Skip invalid messages
        if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
            print(f"Skipping invalid message format: {msg}")
            continue
        
        # Generate message ID
        message_id = str(uuid.uuid4())
        
        # Convert timestamp to epoch milliseconds
        timestamp_str = msg.get('timestamp', datetime.now().isoformat())
        timestamp_ms = to_epoch_ms(timestamp_str) if isinstance(timestamp_str, str) else int(datetime.now().timestamp() * 1000)
        
        # Format content as an array with type and text
        content_text = msg.get('content', '')
        content = [{"type": "text", "text": content_text}]
        
        # Create new document for target collection
        new_doc = {
            "message_id": message_id,
            "session_id": session_id,
            "user_id": user_id,  # Using exact ID without prefixing
            "bot_id": BOT_ID,
            "role": msg.get('role', 'user'),
            "content": content,
            "timestamp": {"$date": {"$numberLong": str(timestamp_ms)}}
        }
        
        # Insert into target collection
        result = target_collection.insert_one(new_doc)
        if result.inserted_id:
            migrated_count += 1
        else:
            print(f"Failed to insert message for user {user_id}")
    
    print(f"Migrated {migrated_count} messages for user {user_id}")
    return migrated_count

# Main migration function
def migrate_all_conversations():
    total_users = 0
    total_messages = 0
    
    try:
        # Get all users with conversations
        users = source_collection.find({})
        
        for user in users:
            total_users += 1
            messages_migrated = migrate_user_conversations(user)
            total_messages += messages_migrated
        
        print(f"Migration complete! Processed {total_users} users and migrated {total_messages} messages.")
    
    except Exception as e:
        print(f"Error during migration: {str(e)}")
    finally:
        # Close connections
        source_client.close()
        target_client.close()

if __name__ == "__main__":
    # Check if we should proceed
    print("This script will migrate conversation data from ctbot to clusteraustraliaflex.")
    print("Make sure you have correct MongoDB credentials in your .env file.")
    confirm = input("Proceed with migration? (y/n): ")
    
    if confirm.lower() == 'y':
        migrate_all_conversations()
    else:
        print("Migration cancelled.")