from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
MONGODB_USERNAME = os.getenv('NEXT_PUBLIC_MONGODB_USERNAME')
MONGODB_PASSWORD = os.getenv('NEXT_PUBLIC_MONGODB_PASSWORD')

# Connect to MongoDB
conn_link = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@clusteraustraliaflex.fycsf67.mongodb.net/"
client = MongoClient(conn_link)
db = client["sago_db"]
chat_collection = db["chat"]




import json

# Fetch one record from the chat_collection
record = chat_collection.find_one()

print(print(record))

# # Example output of the record
# {"_id":{"$oid":"67b97c03b382e5612e39de14"},"message_id":"fb453833-6fb2-4571-9553-867d86216e2e","session_id":"whatsapp:16076248584","user_id":"whatsapp:+16076248584","bot_id":"de9fd19a-6856-403f-b59d-bd1e5206d696","role":"user","content":[{"type":"text","text":"Date is Saturday, February 22, 2025, 07:25 UTC: hi who are you"}],"timestamp":{"$date":{"$numberLong":"1740208759019"}}}