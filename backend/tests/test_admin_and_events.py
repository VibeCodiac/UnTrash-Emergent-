"""
Backend API Tests for UnTrash Berlin - Admin and Events Features
Tests admin functionality, event management, and upcoming events display
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cleanup-berlin.preview.emergentagent.com')
SESSION_TOKEN = "mTuak5CtB7pp7_9RmTUgwYofl8AIFgBO9v_bxDlxN0o"
ADMIN_USER_ID = "user_5f414c29c917"
TEST_GROUP_ID = "group_058ea88fb393"


@pytest.fixture
def auth_headers():
    """Headers with session token for authenticated requests"""
    return {"Cookie": f"session_token={SESSION_TOKEN}"}


class TestAuthMe:
    """Test /api/auth/me endpoint - Admin flag visibility"""
    
    def test_auth_me_returns_is_admin_true(self, auth_headers):
        """Issue 1: Admin rights visibility - is_admin should be true for admin user"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "is_admin" in data, "is_admin field missing from response"
        assert data["is_admin"] == True, f"Expected is_admin=True, got {data['is_admin']}"
        assert data["email"] == "stephanj.thurm@gmail.com", "Wrong user returned"
        print(f"✓ Admin user verified: {data['email']} with is_admin={data['is_admin']}")


class TestUpcomingEvents:
    """Test /api/events/upcoming endpoint - Dashboard upcoming events"""
    
    def test_upcoming_events_returns_future_events(self, auth_headers):
        """Issue 5: Dashboard upcoming events - Future events should display"""
        response = requests.get(f"{BASE_URL}/api/events/upcoming", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of events"
        
        # Check if we have the test future event
        future_events = [e for e in data if e.get("event_id") == "event_test_future"]
        assert len(future_events) > 0, "Future test event not found in upcoming events"
        
        event = future_events[0]
        assert "group_name" in event, "group_name missing from event"
        assert event["group_name"] == "SauBer", f"Expected group_name='SauBer', got {event['group_name']}"
        print(f"✓ Found {len(data)} upcoming events with group names")


class TestAdminUsers:
    """Test /api/admin/users endpoint - Admin panel user management"""
    
    def test_admin_users_list(self, auth_headers):
        """Issue 2: Admin Panel functionality - Admin should be able to view users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of users"
        assert len(data) > 0, "No users returned"
        
        # Verify user structure
        user = data[0]
        assert "user_id" in user, "user_id missing"
        assert "email" in user, "email missing"
        assert "name" in user, "name missing"
        print(f"✓ Admin can view {len(data)} users")
    
    def test_admin_users_requires_auth(self):
        """Admin endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Admin users endpoint properly requires authentication")


class TestAdminTrashReports:
    """Test admin trash report management"""
    
    def test_trash_list_returns_reports(self, auth_headers):
        """Issue 2: Admin Panel functionality - Admin should be able to view trash reports"""
        response = requests.get(f"{BASE_URL}/api/trash/list", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of reports"
        print(f"✓ Found {len(data)} trash reports")
        
        if len(data) > 0:
            report = data[0]
            assert "report_id" in report, "report_id missing"
            assert "status" in report, "status missing"
            assert "location" in report, "location missing"


class TestAdminPendingAreas:
    """Test /api/admin/areas/pending endpoint"""
    
    def test_pending_areas_list(self, auth_headers):
        """Issue 2: Admin Panel functionality - Admin should be able to view pending area cleanings"""
        response = requests.get(f"{BASE_URL}/api/admin/areas/pending", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of pending areas"
        print(f"✓ Found {len(data)} pending area cleanings")
    
    def test_pending_areas_requires_admin(self):
        """Pending areas endpoint should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/areas/pending")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Pending areas endpoint properly requires authentication")


class TestEventDeletion:
    """Test event deletion endpoint"""
    
    def test_event_deletion_endpoint_exists(self, auth_headers):
        """Issue 4: Event deletion - DELETE endpoint should exist"""
        # Test with a non-existent event to verify endpoint exists
        response = requests.delete(
            f"{BASE_URL}/api/groups/{TEST_GROUP_ID}/events/nonexistent_event",
            headers=auth_headers
        )
        # Should return 404 for non-existent event, not 405 (method not allowed)
        assert response.status_code in [404, 403], f"Expected 404 or 403, got {response.status_code}"
        print("✓ Event deletion endpoint exists and responds correctly")
    
    def test_group_events_list(self, auth_headers):
        """Verify group events can be listed"""
        response = requests.get(
            f"{BASE_URL}/api/groups/{TEST_GROUP_ID}/events",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of events"
        print(f"✓ Found {len(data)} events in group")
        
        # Check for future test event
        future_events = [e for e in data if e.get("event_id") == "event_test_future"]
        if future_events:
            event = future_events[0]
            assert event["created_by"] == ADMIN_USER_ID, "Event creator mismatch"
            print(f"✓ Future test event found, created by admin user")


class TestGroupDetails:
    """Test group details endpoint"""
    
    def test_group_details(self, auth_headers):
        """Verify group details include admin_ids for delete button logic"""
        response = requests.get(
            f"{BASE_URL}/api/groups/{TEST_GROUP_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "admin_ids" in data, "admin_ids missing from group"
        assert ADMIN_USER_ID in data["admin_ids"], "Admin user not in group admin_ids"
        print(f"✓ Group has admin_ids: {data['admin_ids']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
