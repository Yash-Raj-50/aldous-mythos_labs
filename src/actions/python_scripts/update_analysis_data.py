from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
from datetime import datetime

# Load environment variables from .env.local file
load_dotenv('.env.local')

def update_analysis_data():
    # Get MongoDB credentials from environment variables
    MONGODB_USERNAME = os.getenv('NEXT_PUBLIC_MONGODB_USERNAME')
    MONGODB_PASSWORD = os.getenv('NEXT_PUBLIC_MONGODB_PASSWORD')
    
    # Check if credentials are available
    if not MONGODB_USERNAME or not MONGODB_PASSWORD:
        print("Error: MongoDB credentials not found in environment variables")
        print("Make sure your .env.local file contains NEXT_PUBLIC_MONGODB_USERNAME and NEXT_PUBLIC_MONGODB_PASSWORD")
        return
    
    print(f"Using MongoDB credentials from .env.local file")
    
    # Connect to MongoDB ctbot cluster
    uri = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot"
    client = MongoClient(uri)
    db = client["user-chat"]
    users_collection = db["users_simulated"]
    
    print("Connected to MongoDB successfully!")
    
    # Load new analysis data from the JSON file
    json_file_path = 'src/dummy_data/analysis_anthropic_simulated_no_sago_timestamps_included_2025-04-06_22-27-14.json'
    try:
        with open(json_file_path, 'r') as file:
            new_data = json.load(file)
        
        print(f"Loaded data for {len(new_data['data'])} users from analysis_anthropic JSON file.")
    except Exception as e:
        print(f"Error loading JSON file: {str(e)}")
        return
    
    # Counter for tracking updates
    updated_count = 0
    inserted_count = 0
    
    # Process each user in the new data
    for user in new_data['data']:
        user_id = user['userID']
        
        # Check if this user already exists in the database
        existing_user = users_collection.find_one({"userID": user_id})
        
        # Make a copy of the user object to modify
        updated_user = user.copy()
        
        # If the user exists, we'll preserve their conversation and update everything else
        # If not, we'll insert the new user data as is
        if existing_user:
            # Preserve the existing conversation data if present
            if 'conversation' in existing_user:
                updated_user['conversation'] = existing_user['conversation']
                
            # Update the existing user document with new analysis data
            result = users_collection.update_one(
                {"userID": user_id},
                {"$set": updated_user}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"Updated user {user_id}")
            else:
                print(f"No changes needed for user {user_id}")
        else:
            # Insert new user data
            result = users_collection.insert_one(updated_user)
            if result.inserted_id:
                inserted_count += 1
                print(f"Inserted new user {user_id}")
            else:
                print(f"Failed to insert user {user_id}")
    
    print(f"Update complete! {updated_count} users updated, {inserted_count} new users inserted.")
    client.close()

if __name__ == "__main__":
    try:
        update_analysis_data()
    except Exception as e:
        print(f"Error updating analysis data: {str(e)}")
        # Print more detailed error information
        import traceback
        traceback.print_exc()