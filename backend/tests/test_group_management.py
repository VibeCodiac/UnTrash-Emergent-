"""
Backend API Tests for UnTrash Berlin - Group Management Features
Tests group owner delete, non-owner leave, and owner cannot leave functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ecoberlin-map.preview.emergentagent.com')
OWNER_SESSION_TOKEN = "mTuak5CtB7pp7_9RmTUgwYofl8AIFgBO9v_bxDlxN0o"
OWNER_USER_ID = "user_5f414c29c917"
EXISTING_GROUP_ID = "group_058ea88fb393"
NON_OWNER_SESSION_TOKEN = "test_session_nonowner_1769101845066"


@pytest.fixture
def owner_headers():
    """Headers with owner session token"""
    return {"Cookie": f"session_token={OWNER_SESSION_TOKEN}"}


@pytest.fixture
def non_owner_headers():
    """Headers with non-owner session token"""
    return {"Cookie": f"session_token={NON_OWNER_SESSION_TOKEN}"}


class TestOwnerCannotLeave:
    """Test that group owner cannot leave their own group"""
    
    def test_owner_leave_returns_error(self, owner_headers):
        """Owner trying to leave should return 400 with specific error message"""
        response = requests.post(
            f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}/leave",
            headers=owner_headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error detail missing"
        assert "owner cannot leave" in data["detail"].lower(), f"Wrong error message: {data['detail']}"
        print(f"✓ Owner cannot leave: {data['detail']}")


class TestNonOwnerCanLeave:
    """Test that non-owner members can leave groups"""
    
    def test_non_owner_join_and_leave(self, non_owner_headers, owner_headers):
        """Non-owner should be able to join and leave a group"""
        # First join the group
        join_response = requests.post(
            f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}/join",
            headers=non_owner_headers
        )
        # May already be a member, so accept 200 or 400
        assert join_response.status_code in [200, 400], f"Join failed: {join_response.status_code}"
        
        # Now leave the group
        leave_response = requests.post(
            f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}/leave",
            headers=non_owner_headers
        )
        assert leave_response.status_code == 200, f"Expected 200, got {leave_response.status_code}"
        
        data = leave_response.json()
        assert "message" in data, "Success message missing"
        assert "left" in data["message"].lower(), f"Wrong message: {data['message']}"
        print(f"✓ Non-owner can leave: {data['message']}")


class TestOwnerCanDeleteGroup:
    """Test that group owner can delete their group"""
    
    def test_create_and_delete_group(self, owner_headers):
        """Owner should be able to create and delete a group"""
        # Create a test group
        create_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=owner_headers,
            json={"name": "TEST_DeleteTest", "description": "Test group for deletion"}
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.status_code}"
        
        group_data = create_response.json()
        group_id = group_data["group_id"]
        assert group_data["admin_ids"][0] == OWNER_USER_ID, "Owner not set as first admin"
        print(f"✓ Created test group: {group_id}")
        
        # Delete the group
        delete_response = requests.delete(
            f"{BASE_URL}/api/groups/{group_id}",
            headers=owner_headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
        
        data = delete_response.json()
        assert "deleted" in data["message"].lower(), f"Wrong message: {data['message']}"
        print(f"✓ Owner deleted group: {data['message']}")
        
        # Verify group is gone
        get_response = requests.get(f"{BASE_URL}/api/groups/{group_id}", headers=owner_headers)
        assert get_response.status_code == 404, f"Group should be deleted, got {get_response.status_code}"
        print("✓ Group verified as deleted")


class TestDeleteGroupRemovesEvents:
    """Test that deleting a group removes all associated events"""
    
    def test_delete_group_removes_events(self, owner_headers):
        """Deleting a group should remove all its events"""
        # Create a test group
        create_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=owner_headers,
            json={"name": "TEST_GroupWithEvents2", "description": "Test group with events"}
        )
        assert create_response.status_code == 200
        group_id = create_response.json()["group_id"]
        print(f"✓ Created test group: {group_id}")
        
        # Create an event in the group
        event_response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=owner_headers,
            json={
                "title": "TEST_Event2",
                "description": "Test event",
                "event_date": "2026-03-01T10:00:00Z",
                "location": {"lat": 52.52, "lng": 13.405}
            }
        )
        assert event_response.status_code == 200
        event_id = event_response.json()["event_id"]
        print(f"✓ Created test event: {event_id}")
        
        # Verify event exists
        events_response = requests.get(f"{BASE_URL}/api/groups/{group_id}/events", headers=owner_headers)
        assert len(events_response.json()) > 0, "Event should exist"
        
        # Delete the group
        delete_response = requests.delete(f"{BASE_URL}/api/groups/{group_id}", headers=owner_headers)
        assert delete_response.status_code == 200
        print("✓ Deleted group")
        
        # Verify events are gone (endpoint returns empty list for deleted group)
        events_after = requests.get(f"{BASE_URL}/api/groups/{group_id}/events", headers=owner_headers)
        assert len(events_after.json()) == 0, "Events should be deleted with group"
        print("✓ Events deleted with group")


class TestNonOwnerCannotDeleteGroup:
    """Test that non-owner cannot delete a group"""
    
    def test_non_owner_delete_returns_403(self, non_owner_headers):
        """Non-owner trying to delete should return 403"""
        response = requests.delete(
            f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}",
            headers=non_owner_headers
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error detail missing"
        assert "owner" in data["detail"].lower(), f"Wrong error message: {data['detail']}"
        print(f"✓ Non-owner cannot delete: {data['detail']}")


class TestGroupOwnerDetermination:
    """Test that owner is correctly determined as first admin"""
    
    def test_owner_is_first_admin(self, owner_headers):
        """Owner should be the first element in admin_ids array"""
        response = requests.get(
            f"{BASE_URL}/api/groups/{EXISTING_GROUP_ID}",
            headers=owner_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "admin_ids" in data, "admin_ids missing"
        assert len(data["admin_ids"]) > 0, "admin_ids is empty"
        assert data["admin_ids"][0] == OWNER_USER_ID, f"First admin should be owner, got {data['admin_ids'][0]}"
        print(f"✓ Owner is first admin: {data['admin_ids'][0]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
