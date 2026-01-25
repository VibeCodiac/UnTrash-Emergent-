"""
Test Prime Group Feature and Event Editing
Tests for:
1. Setting/unsetting prime_group_id via PUT /api/users/profile
2. Validation that user must be a member of the group
3. Event creation, editing, and deletion
4. Authorization checks for event editing (only creator can edit)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPrimeGroupFeature:
    """Tests for Prime Group functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_connection):
        """Setup test user and session"""
        import uuid
        from datetime import datetime, timezone
        
        self.db = db_connection
        self.user_id = f"test-prime-{uuid.uuid4().hex[:8]}"
        self.session_token = f"test_session_prime_{uuid.uuid4().hex[:8]}"
        
        # Create test user
        self.db.users.insert_one({
            "user_id": self.user_id,
            "email": f"test.prime.{uuid.uuid4().hex[:8]}@example.com",
            "name": "Prime Test User",
            "picture": "https://via.placeholder.com/150",
            "total_points": 100,
            "monthly_points": 50,
            "weekly_points": 25,
            "medals": {},
            "joined_groups": [],
            "prime_group_id": None,
            "is_admin": False,
            "is_banned": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create session
        self.db.user_sessions.insert_one({
            "user_id": self.user_id,
            "session_token": self.session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        
        yield
        
        # Cleanup
        self.db.users.delete_many({"user_id": self.user_id})
        self.db.user_sessions.delete_many({"session_token": self.session_token})
        self.db.groups.delete_many({"admin_ids": self.user_id})
        self.db.group_events.delete_many({"created_by": self.user_id})
    
    def test_get_user_profile_has_prime_group_id_field(self):
        """Test that user profile includes prime_group_id field"""
        response = requests.get(f"{BASE_URL}/api/users/profile", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "prime_group_id" in data
        assert data["prime_group_id"] is None  # Initially null
    
    def test_set_prime_group_requires_membership(self):
        """Test that setting prime_group_id fails if user is not a member"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers=self.headers,
            json={"prime_group_id": "group_nonexistent123"}
        )
        assert response.status_code == 400
        assert "must be a member" in response.json()["detail"].lower()
    
    def test_set_prime_group_success(self):
        """Test setting prime_group_id for a group user is a member of"""
        # First create a group (user becomes member automatically)
        group_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=self.headers,
            json={"name": "TEST_Prime Group", "description": "Testing prime group"}
        )
        assert group_response.status_code == 200
        group_id = group_response.json()["group_id"]
        
        # Set as prime group
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers=self.headers,
            json={"prime_group_id": group_id}
        )
        assert response.status_code == 200
        assert response.json()["prime_group_id"] == group_id
        
        # Verify persistence
        profile_response = requests.get(f"{BASE_URL}/api/users/profile", headers=self.headers)
        assert profile_response.status_code == 200
        assert profile_response.json()["prime_group_id"] == group_id
    
    def test_unset_prime_group(self):
        """Test unsetting prime_group_id by setting to null"""
        # Create and set prime group first
        group_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=self.headers,
            json={"name": "TEST_Prime Group 2", "description": "Testing"}
        )
        group_id = group_response.json()["group_id"]
        
        requests.put(
            f"{BASE_URL}/api/users/profile",
            headers=self.headers,
            json={"prime_group_id": group_id}
        )
        
        # Unset prime group
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers=self.headers,
            json={"prime_group_id": None}
        )
        assert response.status_code == 200
        assert response.json()["prime_group_id"] is None


class TestEventEditing:
    """Tests for Event Editing functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_connection):
        """Setup test users, group, and event"""
        import uuid
        from datetime import datetime, timezone
        
        self.db = db_connection
        
        # Create event creator user
        self.creator_id = f"test-creator-{uuid.uuid4().hex[:8]}"
        self.creator_token = f"test_session_creator_{uuid.uuid4().hex[:8]}"
        
        self.db.users.insert_one({
            "user_id": self.creator_id,
            "email": f"test.creator.{uuid.uuid4().hex[:8]}@example.com",
            "name": "Event Creator",
            "picture": "https://via.placeholder.com/150",
            "total_points": 0,
            "monthly_points": 0,
            "weekly_points": 0,
            "medals": {},
            "joined_groups": [],
            "prime_group_id": None,
            "is_admin": False,
            "is_banned": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        self.db.user_sessions.insert_one({
            "user_id": self.creator_id,
            "session_token": self.creator_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create another user (non-creator)
        self.other_id = f"test-other-{uuid.uuid4().hex[:8]}"
        self.other_token = f"test_session_other_{uuid.uuid4().hex[:8]}"
        
        self.db.users.insert_one({
            "user_id": self.other_id,
            "email": f"test.other.{uuid.uuid4().hex[:8]}@example.com",
            "name": "Other User",
            "picture": "https://via.placeholder.com/150",
            "total_points": 0,
            "monthly_points": 0,
            "weekly_points": 0,
            "medals": {},
            "joined_groups": [],
            "prime_group_id": None,
            "is_admin": False,
            "is_banned": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        self.db.user_sessions.insert_one({
            "user_id": self.other_id,
            "session_token": self.other_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        self.creator_headers = {"Authorization": f"Bearer {self.creator_token}"}
        self.other_headers = {"Authorization": f"Bearer {self.other_token}"}
        
        yield
        
        # Cleanup
        self.db.users.delete_many({"user_id": {"$in": [self.creator_id, self.other_id]}})
        self.db.user_sessions.delete_many({"session_token": {"$in": [self.creator_token, self.other_token]}})
        self.db.groups.delete_many({"admin_ids": self.creator_id})
        self.db.group_events.delete_many({"created_by": self.creator_id})
    
    def test_create_event(self):
        """Test creating an event"""
        # Create group first
        group_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=self.creator_headers,
            json={"name": "TEST_Event Group", "description": "Testing events"}
        )
        group_id = group_response.json()["group_id"]
        
        # Create event
        event_date = (datetime.now() + timedelta(days=30)).isoformat()
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=self.creator_headers,
            json={
                "title": "TEST_Cleanup Event",
                "description": "Test event description",
                "event_date": event_date,
                "location_name": "Mauerpark, Berlin"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Cleanup Event"
        assert data["location_name"] == "Mauerpark, Berlin"
        assert data["created_by"] == self.creator_id
    
    def test_edit_event_by_creator(self):
        """Test that event creator can edit the event"""
        # Create group and event
        group_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=self.creator_headers,
            json={"name": "TEST_Edit Event Group", "description": "Testing"}
        )
        group_id = group_response.json()["group_id"]
        
        event_date = (datetime.now() + timedelta(days=30)).isoformat()
        event_response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=self.creator_headers,
            json={
                "title": "Original Title",
                "description": "Original description",
                "event_date": event_date,
                "location_name": "Original Location"
            }
        )
        event_id = event_response.json()["event_id"]
        
        # Edit event
        new_date = (datetime.now() + timedelta(days=45)).isoformat()
        edit_response = requests.put(
            f"{BASE_URL}/api/groups/{group_id}/events/{event_id}",
            headers=self.creator_headers,
            json={
                "title": "Updated Title",
                "description": "Updated description",
                "event_date": new_date,
                "location_name": "Updated Location"
            }
        )
        assert edit_response.status_code == 200
        data = edit_response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"
        assert data["location_name"] == "Updated Location"
    
    def test_edit_event_by_non_creator_fails(self):
        """Test that non-creator cannot edit the event"""
        # Create group and event as creator
        group_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=self.creator_headers,
            json={"name": "TEST_Auth Event Group", "description": "Testing"}
        )
        group_id = group_response.json()["group_id"]
        
        event_date = (datetime.now() + timedelta(days=30)).isoformat()
        event_response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=self.creator_headers,
            json={
                "title": "Creator's Event",
                "event_date": event_date
            }
        )
        event_id = event_response.json()["event_id"]
        
        # Other user joins the group
        requests.post(
            f"{BASE_URL}/api/groups/{group_id}/join",
            headers=self.other_headers
        )
        
        # Other user tries to edit (should fail)
        edit_response = requests.put(
            f"{BASE_URL}/api/groups/{group_id}/events/{event_id}",
            headers=self.other_headers,
            json={"title": "Hacked Title"}
        )
        assert edit_response.status_code == 403
        assert "only the event creator" in edit_response.json()["detail"].lower()
    
    def test_delete_event_by_creator(self):
        """Test that event creator can delete the event"""
        # Create group and event
        group_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=self.creator_headers,
            json={"name": "TEST_Delete Event Group", "description": "Testing"}
        )
        group_id = group_response.json()["group_id"]
        
        event_date = (datetime.now() + timedelta(days=30)).isoformat()
        event_response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=self.creator_headers,
            json={"title": "Event to Delete", "event_date": event_date}
        )
        event_id = event_response.json()["event_id"]
        
        # Delete event
        delete_response = requests.delete(
            f"{BASE_URL}/api/groups/{group_id}/events/{event_id}",
            headers=self.creator_headers
        )
        assert delete_response.status_code == 200
        
        # Verify deletion
        events_response = requests.get(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=self.creator_headers
        )
        events = events_response.json()
        assert not any(e["event_id"] == event_id for e in events)


@pytest.fixture(scope="session")
def db_connection():
    """Create MongoDB connection for tests"""
    from pymongo import MongoClient
    import os
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    yield db
    
    client.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
