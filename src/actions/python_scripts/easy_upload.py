#!/usr/bin/env python3
"""
Easy Upload Helper for Aldous Database

This script provides an interactive way to upload documents to aldous_db.
You can create JSON files with your data and upload them easily.

Usage:
    python easy_upload.py

The script will:
1. Show you what collections are available
2. Let you choose a collection
3. Let you choose between single upload or bulk upload
4. For single upload: open a template file for editing
5. For bulk upload: let you specify a JSON file
"""

import os
import json
import tempfile
import subprocess
import sys
from pathlib import Path

class EasyUploader:
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.uploader_script = self.script_dir / "documentUploader.py"
        
        # Collection templates
        self.templates = {
            'users': {
                "username": "enter_username_here",
                "password": "$2b$10$your_hashed_password_here",
                "userClass": "client",  # admin, superuser, or client
                "profilePic": "optional_s3_url_here"
            },
            'agents': {
                "name": "Agent Name",
                "aiModel": "claude-3-5-sonnet-20241022",  # or gpt-4o, gemini-1.5-pro
                "prompt": "You are a helpful assistant...",
                "phone": "+1234567890",  # required if no socialID
                "socialID": "optional_social_id",  # required if no phone
                "activeStatus": True,
                "icon": "optional_s3_icon_url"
            },
            'profiles': {
                "name": "John Doe",
                "country": "United States",
                "phone": "+1234567890",
                "profilePic": "optional_s3_url",
                "socialIDs": ["twitter_handle", "instagram_handle"]
            },
            'chatsessions': {
                "subjectID": "profile_object_id_here",
                "assignedAgentID": "agent_object_id_here", 
                "agentPlatform": "whatsapp",
                "agentPlatformID": "whatsapp_bot_id",
                "language": "English",
                "sessionDate": "2025-05-29T10:30:00.000Z",
                "metadata": {
                    "location": "City, State",
                    "device": "mobile",
                    "confidence": 0.95
                },
                "messages": [
                    {
                        "timestamp": "2025-05-29T10:30:00.000Z",
                        "role": "user",  # user, agent, or system
                        "contentType": "text",  # text, image, video, audio
                        "content": "Hello, I need help..."
                    }
                ]
            },
            'analyses': {
                "subjectID": "profile_object_id_here",
                "lastUpdated": "2025-05-29T10:30:00.000Z",
                "completeAnalysis": {
                    "emotional_state": {
                        "primary_emotion": "anxiety",
                        "intensity": 7,
                        "triggers": ["work stress", "social situations"]
                    },
                    "psychological_assessment": {
                        "risk_level": "moderate",
                        "coping_mechanisms": ["breathing exercises"],
                        "recommendations": ["professional therapy"]
                    }
                }
            }
        }
    
    def show_menu(self):
        """Show the main menu."""
        print("🚀 Aldous Database Easy Upload")
        print("=" * 50)
        print("Available collections:")
        for i, collection in enumerate(['users', 'agents', 'profiles', 'chatsessions', 'analyses'], 1):
            print(f"{i}. {collection}")
        print("6. Check database stats")
        print("7. Query collection") 
        print("0. Exit")
        print("=" * 50)
    
    def get_choice(self, prompt, valid_choices):
        """Get user choice with validation."""
        while True:
            try:
                choice = input(prompt).strip()
                if choice in valid_choices:
                    return choice
                print(f"❌ Invalid choice. Please choose from: {', '.join(valid_choices)}")
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                sys.exit(0)
    
    def create_template_file(self, collection, is_bulk=False):
        """Create a template file for the user to edit."""
        template_data = self.templates[collection]
        
        if is_bulk:
            # Create array with multiple template objects
            template_content = [template_data, template_data.copy()]
        else:
            template_content = template_data
        
        # Create temporary file
        suffix = "_bulk.json" if is_bulk else "_single.json"
        temp_file = tempfile.NamedTemporaryFile(
            mode='w',
            suffix=f"_{collection}{suffix}",
            delete=False,
            dir=self.script_dir
        )
        
        # Write template with nice formatting and comments
        json.dump(template_content, temp_file, indent=2)
        temp_file.close()
        
        return temp_file.name
    
    def open_file_for_editing(self, filepath):
        """Open file in system default editor."""
        try:
            if sys.platform == "darwin":  # macOS
                subprocess.run(["open", filepath])
            elif sys.platform == "linux":
                subprocess.run(["xdg-open", filepath])
            elif sys.platform == "win32":
                os.startfile(filepath)
            else:
                print(f"📝 Please edit this file: {filepath}")
                return False
            return True
        except Exception as e:
            print(f"❌ Could not open editor: {e}")
            print(f"📝 Please manually edit this file: {filepath}")
            return False
    
    def upload_single_document(self, collection):
        """Handle single document upload."""
        print(f"\n📝 Creating template for {collection} collection...")
        
        template_file = self.create_template_file(collection, is_bulk=False)
        print(f"✅ Template created: {template_file}")
        
        if self.open_file_for_editing(template_file):
            input("\n⏳ Edit the file and press Enter when ready to upload...")
        else:
            input("\n⏳ Please edit the file manually and press Enter when ready...")
        
        # Validate and upload
        try:
            with open(template_file, 'r') as f:
                data = json.load(f)
            
            # Convert to JSON string for command line
            data_str = json.dumps(data)
            
            # Run upload command
            cmd = [
                "python", str(self.uploader_script),
                "upload",
                "--collection", collection,
                "--data", data_str
            ]
            
            print(f"\n🚀 Uploading to {collection} collection...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Upload successful!")
                print(result.stdout)
            else:
                print("❌ Upload failed!")
                print(result.stderr)
        
        except Exception as e:
            print(f"❌ Error during upload: {e}")
        
        finally:
            # Cleanup temp file
            try:
                os.unlink(template_file)
            except:
                pass
    
    def upload_bulk_documents(self, collection):
        """Handle bulk document upload."""
        print(f"\n📚 Bulk upload for {collection} collection")
        print("Choose an option:")
        print("1. Create new template file")
        print("2. Use existing file")
        
        choice = self.get_choice("Enter choice (1-2): ", ['1', '2'])
        
        if choice == '1':
            # Create template file
            template_file = self.create_template_file(collection, is_bulk=True)
            print(f"✅ Template created: {template_file}")
            
            if self.open_file_for_editing(template_file):
                input("\n⏳ Edit the file and press Enter when ready to upload...")
            else:
                input("\n⏳ Please edit the file manually and press Enter when ready...")
            
            file_to_upload = template_file
        else:
            # Use existing file
            file_to_upload = input("Enter path to JSON file: ").strip()
            if not os.path.exists(file_to_upload):
                print(f"❌ File not found: {file_to_upload}")
                return
        
        # Run bulk upload command
        try:
            cmd = [
                "python", str(self.uploader_script),
                "bulk",
                "--collection", collection,
                "--file", file_to_upload
            ]
            
            print(f"\n🚀 Bulk uploading to {collection} collection...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Bulk upload successful!")
                print(result.stdout)
            else:
                print("❌ Bulk upload failed!")
                print(result.stderr)
        
        except Exception as e:
            print(f"❌ Error during bulk upload: {e}")
        
        finally:
            # Cleanup temp file if created
            if choice == '1':
                try:
                    os.unlink(file_to_upload)
                except:
                    pass
    
    def check_stats(self):
        """Check database statistics."""
        cmd = ["python", str(self.uploader_script), "stats"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
        else:
            print("❌ Failed to get stats!")
            print(result.stderr)
    
    def query_collection(self):
        """Query a collection."""
        collections = ['users', 'agents', 'profiles', 'chatsessions', 'analyses']
        print("\nAvailable collections:")
        for i, col in enumerate(collections, 1):
            print(f"{i}. {col}")
        
        choice = self.get_choice("Choose collection (1-5): ", ['1', '2', '3', '4', '5'])
        collection = collections[int(choice) - 1]
        
        print(f"\nQuerying {collection} collection...")
        print("Example filters:")
        print("- {} (all documents)")
        print('- {"activeStatus": true} (for agents)')
        print('- {"userClass": "admin"} (for users)')
        
        filter_input = input("Enter filter (or press Enter for all): ").strip()
        if not filter_input:
            filter_input = "{}"
        
        limit = input("Enter limit (or press Enter for no limit): ").strip()
        
        cmd = [
            "python", str(self.uploader_script),
            "query",
            "--collection", collection,
            "--filter", filter_input
        ]
        
        if limit and limit.isdigit():
            cmd.extend(["--limit", limit])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
        else:
            print("❌ Query failed!")
            print(result.stderr)
    
    def run(self):
        """Main application loop."""
        while True:
            self.show_menu()
            choice = self.get_choice("Enter your choice (0-7): ", 
                                   ['0', '1', '2', '3', '4', '5', '6', '7'])
            
            if choice == '0':
                print("👋 Goodbye!")
                break
            
            elif choice in ['1', '2', '3', '4', '5']:
                collections = ['users', 'agents', 'profiles', 'chatsessions', 'analyses']
                collection = collections[int(choice) - 1]
                
                print(f"\n📋 Selected: {collection}")
                print("Upload options:")
                print("1. Single document")
                print("2. Bulk upload")
                
                upload_choice = self.get_choice("Choose upload type (1-2): ", ['1', '2'])
                
                if upload_choice == '1':
                    self.upload_single_document(collection)
                else:
                    self.upload_bulk_documents(collection)
            
            elif choice == '6':
                print("\n📊 Database Statistics:")
                self.check_stats()
            
            elif choice == '7':
                self.query_collection()
            
            print("\n" + "=" * 50)

if __name__ == "__main__":
    uploader = EasyUploader()
    uploader.run()
