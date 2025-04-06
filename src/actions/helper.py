from pymongo import MongoClient
from datetime import datetime, timezone
import os




# Helper function to insert messages into the database
def insert_message(chat_collection ,message_id, session_id, user_id, bot_id, role, content_array, timestamp=datetime.now(timezone.utc)):
    """Insert a message into the MongoDB chat collection."""
    chat_collection.insert_one({
        "message_id": message_id,
        "session_id": session_id,
        "user_id": user_id,
        "bot_id": bot_id,  # Include bot_id for bot messages
        "role": role,  # "user" or "assistant"
        "content": content_array,
        "timestamp": timestamp,
    })


