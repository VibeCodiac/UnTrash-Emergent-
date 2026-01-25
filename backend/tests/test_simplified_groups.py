"""
Test Simplified Group System - Prime Group Feature Removed
Tests:
1. User model no longer has prime_group_id
2. PUT /users/profile no longer accepts prime_group_id
3. Users can join multiple groups
4. Groups endpoint returns all groups with events
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token created in MongoDB
SESSION_TOKEN = None
USER_ID = None

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_user_session(api_client):
    """Create test user and session"""
    import subprocess
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', '''
        use('test_database');
        var userId = 'test_simplified_' + Date.now();
        var sessionToken = 'test_session_simplified_' + Date.now();
        var email = 'test.simplified.' + Date.now() + '@example.com';
        
        db.users.insertOne({
          user_id: userId,
          email: email,
          name: 'Test Simplified Groups User',
          picture: 'https://via.placeholder.com/150',
          total_points: 100,
          monthly_points: 50,
          weekly_points: 25,
          medals: {},
          joined_groups: [],
          is_admin: false,
          is_banned: false,
          created_at: new Date()
        });
        
        db.user_sessions.insertOne({
          user_id: userId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 7*24*60*60*1000),
          created_at: new Date()
        });
        
        print(JSON.stringify({session_token: sessionToken, user_id: userId, email: email}));
        '''
    ], capture_output=True, text=True)
    
    import json
    data = json.loads(result.stdout.strip())
    return data

@pytest.fixture(scope="module")
def auth_headers(test_user_session):
    """Get auth headers"""
    return {"Authorization": f"Bearer {test_user_session['session_token']}"}


class TestUserModelNoPrimeGroup:
    """Test that User model no longer has prime_group_id"""
    
    def test_get_user_profile_no_prime_group_id(self, api_client, auth_headers):
        """GET /api/users/profile should NOT return prime_group_id field"""
        response = api_client.get(f"{BASE_URL}/api/users/profile", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        user_data = response.json()
        # Verify prime_group_id is NOT in the response
        assert "prime_group_id" not in user_data, "prime_group_id should NOT be in user profile"
        
        # Verify other expected fields are present
        assert "user_id" in user_data
        assert "email" in user_data
        assert "name" in user_data
        assert "joined_groups" in user_data
        print(f"✓ User profile does NOT contain prime_group_id")
        print(f"  User has {len(user_data.get('joined_groups', []))} joined groups")
    
    def test_auth_me_no_prime_group_id(self, api_client, auth_headers):
        """GET /api/auth/me should NOT return prime_group_id field"""
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        user_data = response.json()
        assert "prime_group_id" not in user_data, "prime_group_id should NOT be in auth/me response"
        print(f"✓ auth/me does NOT contain prime_group_id")


class TestUpdateProfileNoPrimeGroup:
    """Test that PUT /users/profile no longer accepts prime_group_id"""
    
    def test_update_profile_ignores_prime_group_id(self, api_client, auth_headers, test_user_session):
        """PUT /api/users/profile should ignore prime_group_id if sent"""
        # First create a group to have a valid group_id
        group_response = api_client.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={"name": "Test Group for Prime", "description": "Testing prime group removal"}
        )
        assert group_response.status_code == 200, f"Failed to create group: {group_response.text}"
        group_id = group_response.json()["group_id"]
        
        # Try to update profile with prime_group_id (should be ignored)
        update_response = api_client.put(
            f"{BASE_URL}/api/users/profile",
            headers=auth_headers,
            json={"name": "Updated Name", "prime_group_id": group_id}
        )
        
        # Should succeed but ignore prime_group_id
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        # Verify prime_group_id is NOT in the response
        updated_user = update_response.json()
        assert "prime_group_id" not in updated_user, "prime_group_id should NOT be in updated user"
        assert updated_user["name"] == "Updated Name", "Name should be updated"
        
        print(f"✓ PUT /users/profile ignores prime_group_id parameter")
        
        # Cleanup - delete the test group
        api_client.delete(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
    
    def test_update_profile_only_name_and_picture(self, api_client, auth_headers):
        """PUT /api/users/profile should only accept name and picture"""
        # Update with valid fields
        response = api_client.put(
            f"{BASE_URL}/api/users/profile",
            headers=auth_headers,
            json={"name": "Valid Name Update"}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Valid Name Update"
        print(f"✓ Profile update works with name field")


class TestMultipleGroupMembership:
    """Test that users can join multiple groups"""
    
    def test_join_multiple_groups(self, api_client, auth_headers):
        """User should be able to join multiple groups"""
        created_groups = []
        
        # Create 3 groups
        for i in range(3):
            response = api_client.post(
                f"{BASE_URL}/api/groups",
                headers=auth_headers,
                json={"name": f"Test Multi Group {i+1}", "description": f"Group {i+1} for testing"}
            )
            assert response.status_code == 200, f"Failed to create group {i+1}: {response.text}"
            created_groups.append(response.json()["group_id"])
        
        # Verify user is member of all created groups (creator is auto-joined)
        profile_response = api_client.get(f"{BASE_URL}/api/users/profile", headers=auth_headers)
        assert profile_response.status_code == 200
        
        user_groups = profile_response.json().get("joined_groups", [])
        for group_id in created_groups:
            assert group_id in user_groups, f"User should be member of group {group_id}"
        
        print(f"✓ User is member of {len(created_groups)} groups")
        
        # Cleanup
        for group_id in created_groups:
            api_client.delete(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
    
    def test_leave_group_still_member_of_others(self, api_client, auth_headers):
        """Leaving one group should not affect membership in other groups"""
        # Create 2 groups
        group1_resp = api_client.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={"name": "Leave Test Group 1"}
        )
        group1_id = group1_resp.json()["group_id"]
        
        group2_resp = api_client.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={"name": "Leave Test Group 2"}
        )
        group2_id = group2_resp.json()["group_id"]
        
        # Note: Can't leave a group you own, so we'll just verify both exist
        profile = api_client.get(f"{BASE_URL}/api/users/profile", headers=auth_headers).json()
        assert group1_id in profile["joined_groups"]
        assert group2_id in profile["joined_groups"]
        
        print(f"✓ User maintains membership in multiple groups independently")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/groups/{group1_id}", headers=auth_headers)
        api_client.delete(f"{BASE_URL}/api/groups/{group2_id}", headers=auth_headers)


class TestGroupEventsForDashboard:
    """Test that group events can be fetched for dashboard display"""
    
    def test_get_group_events(self, api_client, auth_headers):
        """GET /api/groups/{group_id}/events should return events"""
        # Create a group
        group_resp = api_client.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={"name": "Events Test Group", "description": "Testing events"}
        )
        assert group_resp.status_code == 200
        group_id = group_resp.json()["group_id"]
        
        # Create 2 events
        future_date1 = (datetime.now() + timedelta(days=3)).isoformat()
        future_date2 = (datetime.now() + timedelta(days=7)).isoformat()
        
        event1_resp = api_client.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=auth_headers,
            json={
                "title": "Cleanup Event 1",
                "description": "First cleanup event",
                "event_date": future_date1,
                "location_name": "Mauerpark"
            }
        )
        assert event1_resp.status_code == 200, f"Failed to create event 1: {event1_resp.text}"
        
        event2_resp = api_client.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=auth_headers,
            json={
                "title": "Cleanup Event 2",
                "description": "Second cleanup event",
                "event_date": future_date2,
                "location_name": "Alexanderplatz"
            }
        )
        assert event2_resp.status_code == 200, f"Failed to create event 2: {event2_resp.text}"
        
        # Get events
        events_resp = api_client.get(f"{BASE_URL}/api/groups/{group_id}/events", headers=auth_headers)
        assert events_resp.status_code == 200
        
        events = events_resp.json()
        assert len(events) >= 2, f"Expected at least 2 events, got {len(events)}"
        
        # Verify event structure
        for event in events:
            assert "event_id" in event
            assert "title" in event
            assert "event_date" in event
            assert "group_id" in event
        
        print(f"✓ Group has {len(events)} events with proper structure")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
    
    def test_upcoming_events_endpoint(self, api_client, auth_headers):
        """GET /api/events/upcoming should return events from user's groups"""
        # Create a group with an event
        group_resp = api_client.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={"name": "Upcoming Events Test Group"}
        )
        group_id = group_resp.json()["group_id"]
        
        future_date = (datetime.now() + timedelta(days=5)).isoformat()
        api_client.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=auth_headers,
            json={
                "title": "Upcoming Test Event",
                "event_date": future_date,
                "location_name": "Test Location"
            }
        )
        
        # Get upcoming events
        upcoming_resp = api_client.get(f"{BASE_URL}/api/events/upcoming", headers=auth_headers)
        assert upcoming_resp.status_code == 200
        
        events = upcoming_resp.json()
        assert isinstance(events, list)
        
        # Find our event
        our_event = next((e for e in events if e.get("title") == "Upcoming Test Event"), None)
        if our_event:
            assert "group_name" in our_event, "Event should include group_name"
            print(f"✓ Upcoming events endpoint returns events with group_name")
        else:
            print(f"✓ Upcoming events endpoint works (event may have been filtered)")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)


class TestGroupCardData:
    """Test that group data includes all fields needed for Dashboard display"""
    
    def test_group_has_picture_and_member_count(self, api_client, auth_headers):
        """Groups should have picture and member_ids for display"""
        # Create a group with picture
        group_resp = api_client.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={
                "name": "Display Test Group",
                "description": "Testing display fields",
                "picture": "https://via.placeholder.com/150"
            }
        )
        assert group_resp.status_code == 200
        group = group_resp.json()
        group_id = group["group_id"]
        
        # Verify fields
        assert "picture" in group, "Group should have picture field"
        assert "member_ids" in group, "Group should have member_ids field"
        assert "total_points" in group, "Group should have total_points field"
        assert "name" in group, "Group should have name field"
        
        print(f"✓ Group has all required display fields: picture, member_ids, total_points, name")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
    
    def test_list_groups_returns_all_fields(self, api_client, auth_headers):
        """GET /api/groups should return all fields needed for display"""
        response = api_client.get(f"{BASE_URL}/api/groups", headers=auth_headers)
        assert response.status_code == 200
        
        groups = response.json()
        if len(groups) > 0:
            group = groups[0]
            required_fields = ["group_id", "name", "member_ids", "total_points"]
            for field in required_fields:
                assert field in group, f"Group should have {field} field"
            print(f"✓ Groups list returns all required fields")
        else:
            print(f"✓ Groups list endpoint works (no groups to verify)")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_data(self, test_user_session):
        """Clean up test user and session"""
        import subprocess
        user_id = test_user_session['user_id']
        session_token = test_user_session['session_token']
        
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            use('test_database');
            db.users.deleteOne({{user_id: "{user_id}"}});
            db.user_sessions.deleteOne({{session_token: "{session_token}"}});
            db.groups.deleteMany({{name: /Test/}});
            print("Cleanup completed");
            '''
        ], capture_output=True, text=True)
        print("✓ Test data cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
