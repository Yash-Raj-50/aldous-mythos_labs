#!/usr/bin/env python3
"""
Aldous Database Document Uploader

This script manages documents in the aldous_db database with the following collections:
- agents: AI agents with configurations and assignments
- analyses: User analysis data and insights
- chatsessions: Chat conversations between users and agents
- profiles: User profile information and metadata
- users: System users with authentication and role data

Database: aldous_db
Collections: agents, analyses, chatsessions, profiles, users

Usage:
    python documentUploader.py upload --collection users --data '{"username": "john", "userClass": "client"}'
    python documentUploader.py update --collection agents --filter '{"name": "Assistant"}' --data '{"activeStatus": false}'
    python documentUploader.py query --collection profiles --filter '{"name": "John Doe"}'
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv
import os
import json
import argparse
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
import uuid
from bson import ObjectId

class AldousDocumentUploader:
    def __init__(self):
        """Initialize connection to aldous_db database."""
        # Load environment variables
        load_dotenv(dotenv_path=".env.local")
        
        self.mongodb_username = os.getenv('NEXT_PUBLIC_MONGODB_USERNAME')
        self.mongodb_password = os.getenv('NEXT_PUBLIC_MONGODB_PASSWORD')
        
        if not self.mongodb_username or not self.mongodb_password:
            raise ValueError("❌ MongoDB credentials not found in environment variables")
        
        # Connect to MongoDB - aldous_db database
        self.conn_link = f"mongodb+srv://{self.mongodb_username}:{self.mongodb_password}@clusteraustraliaflex.fycsf67.mongodb.net/"
        self.client = MongoClient(self.conn_link)
        self.db = self.client["aldous_db"]
        
        # Define valid collections based on database schema
        self.valid_collections = ['agents', 'analyses', 'chatsessions', 'profiles', 'users']
        
        print(f"✅ Connected to aldous_db database")
        print(f"📋 Available collections: {', '.join(self.valid_collections)}")
    
    def _validate_collection(self, collection_name: str) -> bool:
        """Validate that collection name is one of the allowed collections."""
        if collection_name not in self.valid_collections:
            raise ValueError(f"❌ Invalid collection '{collection_name}'. Valid collections: {', '.join(self.valid_collections)}")
        return True
    
    def _validate_user_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and prepare user document according to schema."""
        required_fields = ['username', 'userClass']
        for field in required_fields:
            if field not in document:
                raise ValueError(f"❌ Missing required field '{field}' for users collection")
        
        # Validate userClass
        valid_user_classes = ['admin', 'superuser', 'client']
        if document['userClass'] not in valid_user_classes:
            raise ValueError(f"❌ Invalid userClass '{document['userClass']}'. Must be one of: {', '.join(valid_user_classes)}")
        
        return document
    
    def _validate_agent_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and prepare agent document according to schema."""
        required_fields = ['name', 'aiModel']
        for field in required_fields:
            if field not in document:
                raise ValueError(f"❌ Missing required field '{field}' for agents collection")
        
        # Set default values
        if 'activeStatus' not in document:
            document['activeStatus'] = True
        
        # Validate that at least phone or socialID is provided
        if not document.get('phone') and not document.get('socialID'):
            raise ValueError("❌ Agent must have at least phone or socialID")
        
        return document
    
    def _validate_profile_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and prepare profile document according to schema."""
        required_fields = ['name', 'country', 'phone']
        for field in required_fields:
            if field not in document:
                raise ValueError(f"❌ Missing required field '{field}' for profiles collection")
        
        return document
    
    def _validate_chatsession_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and prepare chatsession document according to schema."""
        required_fields = ['subjectID', 'assignedAgentID', 'language', 'sessionDate']
        for field in required_fields:
            if field not in document:
                raise ValueError(f"❌ Missing required field '{field}' for chatsessions collection")
        
        # Ensure messages is an array
        if 'messages' not in document:
            document['messages'] = []
        
        return document
    
    def _validate_analysis_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and prepare analysis document according to schema."""
        required_fields = ['subjectID']
        for field in required_fields:
            if field not in document:
                raise ValueError(f"❌ Missing required field '{field}' for analyses collection")
        
        # Set default lastUpdated if not provided
        if 'lastUpdated' not in document:
            document['lastUpdated'] = datetime.utcnow()
        
        return document
    
    def _validate_document(self, collection_name: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """Validate document based on collection schema."""
        if collection_name == 'users':
            return self._validate_user_document(document)
        elif collection_name == 'agents':
            return self._validate_agent_document(document)
        elif collection_name == 'profiles':
            return self._validate_profile_document(document)
        elif collection_name == 'chatsessions':
            return self._validate_chatsession_document(document)
        elif collection_name == 'analyses':
            return self._validate_analysis_document(document)
        else:
            return document
    
    def upload_document(self, collection_name: str, document: Dict[str, Any]) -> str:
        """
        Upload a new document to the specified collection.
        
        Args:
            collection_name: Name of the collection (users, agents, profiles, chatsessions, analyses)
            document: Document data to upload
            
        Returns:
            The inserted document ID
        """
        self._validate_collection(collection_name)
        collection = self.db[collection_name]
        
        # Validate document according to schema
        document = self._validate_document(collection_name, document)
        
        try:
            result = collection.insert_one(document)
            doc_id = str(result.inserted_id)
            print(f"✅ Document uploaded successfully to '{collection_name}' with ID: {doc_id}")
            return doc_id
        except Exception as e:
            print(f"❌ Error uploading document to {collection_name}: {str(e)}")
            raise
    
    def update_document(self, collection_name: str, filter_query: Dict[str, Any], 
                       update_data: Dict[str, Any], upsert: bool = False) -> int:
        """
        Update existing document(s) in the specified collection.
        
        Args:
            collection_name: Name of the collection
            filter_query: Query to find documents to update
            update_data: Data to update
            upsert: Whether to create new document if not found
            
        Returns:
            Number of documents modified
        """
        self._validate_collection(collection_name)
        collection = self.db[collection_name]
        
        # Prepare update operation
        if not any(key.startswith('$') for key in update_data.keys()):
            update_data = {'$set': update_data}
        
        try:
            result = collection.update_many(filter_query, update_data, upsert=upsert)
            print(f"✅ Updated {result.modified_count} document(s) in '{collection_name}'")
            if upsert and result.upserted_id:
                print(f"📝 Created new document with ID: {result.upserted_id}")
            return result.modified_count
        except Exception as e:
            print(f"❌ Error updating document in {collection_name}: {str(e)}")
            raise
    
    def query_documents(self, collection_name: str, filter_query: Dict[str, Any] = None,
                       limit: int = 0, sort_field: str = None, 
                       sort_order: int = DESCENDING) -> List[Dict]:
        """
        Query documents from the specified collection.
        
        Args:
            collection_name: Name of the collection
            filter_query: Query filter (default: {})
            limit: Maximum number of documents to return (0 = no limit)
            sort_field: Field to sort by
            sort_order: Sort order (ASCENDING or DESCENDING)
            
        Returns:
            List of matching documents
        """
        self._validate_collection(collection_name)
        collection = self.db[collection_name]
        filter_query = filter_query or {}
        
        try:
            cursor = collection.find(filter_query)
            
            if sort_field:
                cursor = cursor.sort(sort_field, sort_order)
            
            if limit > 0:
                cursor = cursor.limit(limit)
            
            documents = list(cursor)
            
            # Convert ObjectId to string for JSON serialization
            for doc in documents:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            print(f"📋 Found {len(documents)} document(s) in '{collection_name}'")
            return documents
        except Exception as e:
            print(f"❌ Error querying documents from {collection_name}: {str(e)}")
            raise
    
    def delete_document(self, collection_name: str, filter_query: Dict[str, Any]) -> int:
        """
        Delete document(s) from the specified collection.
        
        Args:
            collection_name: Name of the collection
            filter_query: Query to find documents to delete
            
        Returns:
            Number of documents deleted
        """
        self._validate_collection(collection_name)
        collection = self.db[collection_name]
        
        try:
            result = collection.delete_many(filter_query)
            print(f"✅ Deleted {result.deleted_count} document(s) from '{collection_name}'")
            return result.deleted_count
        except Exception as e:
            print(f"❌ Error deleting document from {collection_name}: {str(e)}")
            raise
    
    def get_collection_stats(self, collection_name: str = None) -> Dict[str, Any]:
        """Get statistics about collections."""
        if collection_name:
            self._validate_collection(collection_name)
            collections_to_check = [collection_name]
        else:
            collections_to_check = self.valid_collections
        
        stats = {}
        
        try:
            for col_name in collections_to_check:
                collection = self.db[col_name]
                col_stats = {
                    'document_count': collection.count_documents({}),
                    'estimated_count': collection.estimated_document_count()
                }
                stats[col_name] = col_stats
                
                print(f"📊 Collection '{col_name}': {col_stats['document_count']} documents")
            
            return stats
        except Exception as e:
            print(f"❌ Error getting collection stats: {str(e)}")
            raise
    
    def bulk_upload_from_json(self, collection_name: str, json_file_path: str) -> List[str]:
        """
        Upload multiple documents from a JSON file.
        
        Args:
            collection_name: Name of the collection
            json_file_path: Path to JSON file containing documents
            
        Returns:
            List of inserted document IDs
        """
        self._validate_collection(collection_name)
        collection = self.db[collection_name]
        
        try:
            with open(json_file_path, 'r') as file:
                data = json.load(file)
            
            # Ensure data is a list
            if not isinstance(data, list):
                data = [data]
            
            # Validate each document
            validated_documents = []
            for i, document in enumerate(data):
                try:
                    validated_doc = self._validate_document(collection_name, document)
                    validated_documents.append(validated_doc)
                except Exception as e:
                    print(f"⚠️ Skipping document {i+1}: {str(e)}")
                    continue
            
            if not validated_documents:
                print("❌ No valid documents to upload")
                return []
            
            result = collection.insert_many(validated_documents)
            doc_ids = [str(id) for id in result.inserted_ids]
            
            print(f"✅ Bulk uploaded {len(doc_ids)} document(s) to '{collection_name}'")
            return doc_ids
        except Exception as e:
            print(f"❌ Error in bulk upload to {collection_name}: {str(e)}")
            raise
    
    def close_connection(self):
        """Close the MongoDB connection."""
        self.client.close()
        print("🔒 MongoDB connection closed")

def parse_json_string(json_str: str) -> Dict[str, Any]:
    """Parse JSON string with error handling."""
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON format: {str(e)}")
        sys.exit(1)

def main():
    """Main function to handle command line arguments and execute operations."""
    parser = argparse.ArgumentParser(description='Aldous Database Document Uploader')
    
    parser.add_argument('operation', choices=['upload', 'update', 'delete', 'query', 'bulk', 'stats'],
                       help='Operation to perform')
    
    parser.add_argument('--collection', '-c', type=str, 
                       choices=['users', 'agents', 'profiles', 'chatsessions', 'analyses'],
                       help='Collection name (users, agents, profiles, chatsessions, analyses)')
    
    parser.add_argument('--data', '-d', type=str,
                       help='Document data as JSON string')
    
    parser.add_argument('--filter', '-f', type=str, default='{}',
                       help='Filter query as JSON string (default: {})')
    
    parser.add_argument('--file', type=str,
                       help='JSON file path for bulk operations')
    
    parser.add_argument('--limit', '-l', type=int, default=0,
                       help='Limit number of results (0 = no limit)')
    
    parser.add_argument('--sort', '-s', type=str,
                       help='Sort field name')
    
    parser.add_argument('--ascending', action='store_true',
                       help='Sort in ascending order (default: descending)')
    
    parser.add_argument('--upsert', action='store_true',
                       help='Create document if not found during update')
    
    args = parser.parse_args()
    
    # Initialize uploader
    uploader = AldousDocumentUploader()
    
    try:
        if args.operation == 'upload':
            if not args.collection or not args.data:
                print("❌ Upload operation requires --collection and --data arguments")
                sys.exit(1)
            
            document = parse_json_string(args.data)
            uploader.upload_document(args.collection, document)
        
        elif args.operation == 'update':
            if not args.collection or not args.data:
                print("❌ Update operation requires --collection and --data arguments")
                sys.exit(1)
            
            filter_query = parse_json_string(args.filter)
            update_data = parse_json_string(args.data)
            uploader.update_document(args.collection, filter_query, update_data, upsert=args.upsert)
        
        elif args.operation == 'delete':
            if not args.collection:
                print("❌ Delete operation requires --collection argument")
                sys.exit(1)
            
            filter_query = parse_json_string(args.filter)
            uploader.delete_document(args.collection, filter_query)
        
        elif args.operation == 'query':
            if not args.collection:
                print("❌ Query operation requires --collection argument")
                sys.exit(1)
            
            filter_query = parse_json_string(args.filter)
            sort_order = ASCENDING if args.ascending else DESCENDING
            
            documents = uploader.query_documents(
                args.collection, filter_query, limit=args.limit,
                sort_field=args.sort, sort_order=sort_order
            )
            
            print("\n📄 Results:")
            for i, doc in enumerate(documents, 1):
                print(f"{i}. {json.dumps(doc, indent=2, default=str)}")
        
        elif args.operation == 'bulk':
            if not args.collection or not args.file:
                print("❌ Bulk operation requires --collection and --file arguments")
                sys.exit(1)
            
            uploader.bulk_upload_from_json(args.collection, args.file)
        
        elif args.operation == 'stats':
            uploader.get_collection_stats(args.collection)
    
    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user")
    except Exception as e:
        print(f"❌ Operation failed: {str(e)}")
        sys.exit(1)
    finally:
        uploader.close_connection()

if __name__ == "__main__":
    main()