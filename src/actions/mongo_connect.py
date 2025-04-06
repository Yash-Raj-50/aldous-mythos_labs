MONGODB_USERNAME = os.getenv('MONGODB_USERNAME')
MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD')

# Connect to MongoDB
conn_link = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot"
client = MongoClient(conn_link)
db = client["user-chat"]
# Connect to MongoDB
conn_link = f"mongodb+srv://{MONGODB_USERNAME}:{MONGODB_PASSWORD}@ctbot.5vx6h.mongodb.net/?retryWrites=true&w=majority&appName=CTBot"
client = MongoClient(conn_link)
db = client["user-chat"]
# Create the collection
user_collection = db["users_simulated"]