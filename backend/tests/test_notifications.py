"""
Test suite for UnTrash Berlin Push Notification System
Tests: subscribe, unsubscribe, status, notifications list, mark-read, event creation notifications
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token - will be set by fixture
TEST_SESSION_TOKEN = None
TEST_USER_ID = None
TEST_GROUP_ID = None


class TestNotificationEndpoints:
    """Test notification subscription and management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self, test_session):
        """Setup test session for all tests"""
        global TEST_SESSION_TOKEN, TEST_USER_ID
        TEST_SESSION_TOKEN = test_session['session_token']
        TEST_USER_ID = test_session['user_id']
    
    def get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TEST_SESSION_TOKEN}"
        }
    
    # Test 1: POST /api/notifications/subscribe - should save subscription for user
    def test_subscribe_to_notifications(self):
        """Test subscribing to push notifications"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.get_headers(),
            json={
                "subscription": {"endpoint": "https://test.push.service/abc123", "keys": {"p256dh": "test", "auth": "test"}},
                "device_type": "desktop"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert data.get("enabled") == True
        print(f"✓ Subscribe endpoint works: {data}")
    
    # Test 2: POST /api/notifications/unsubscribe - should disable notifications for user
    def test_unsubscribe_from_notifications(self):
        """Test unsubscribing from push notifications"""
        # First subscribe
        requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.get_headers(),
            json={"subscription": None, "device_type": "desktop"}
        )
        
        # Then unsubscribe
        response = requests.post(
            f"{BASE_URL}/api/notifications/unsubscribe",
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert data.get("enabled") == False
        print(f"✓ Unsubscribe endpoint works: {data}")
    
    # Test 3: GET /api/notifications/status - should return subscription status
    def test_get_notification_status(self):
        """Test getting notification subscription status"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/status",
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "subscribed" in data
        assert isinstance(data["subscribed"], bool)
        print(f"✓ Status endpoint works: {data}")
    
    # Test 4: GET /api/notifications/mock - should return user's notifications list
    def test_get_notifications_list(self):
        """Test getting user's notifications list"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/mock",
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Notifications list endpoint works: {len(data)} notifications")
    
    # Test 5: POST /api/notifications/mark-read - should mark notifications as read
    def test_mark_notifications_read(self):
        """Test marking notifications as read"""
        # Mark all as read (empty notification_ids)
        response = requests.post(
            f"{BASE_URL}/api/notifications/mark-read",
            headers=self.get_headers(),
            json={}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Mark-read endpoint works: {data}")
    
    # Test 6: GET /api/notifications/unread-count - should return unread count
    def test_get_unread_count(self):
        """Test getting unread notification count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"✓ Unread count endpoint works: {data}")
    
    # Test subscription status after subscribe
    def test_status_after_subscribe(self):
        """Test that status shows subscribed after subscribing"""
        # Subscribe first
        requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.get_headers(),
            json={"subscription": {"endpoint": "test"}, "device_type": "mobile"}
        )
        
        # Check status
        response = requests.get(
            f"{BASE_URL}/api/notifications/status",
            headers=self.get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscribed"] == True
        assert data["device_type"] == "mobile"
        print(f"✓ Status correctly shows subscribed: {data}")
    
    # Test subscription status after unsubscribe
    def test_status_after_unsubscribe(self):
        """Test that status shows unsubscribed after unsubscribing"""
        # Subscribe first
        requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.get_headers(),
            json={"subscription": None, "device_type": "desktop"}
        )
        
        # Unsubscribe
        requests.post(
            f"{BASE_URL}/api/notifications/unsubscribe",
            headers=self.get_headers()
        )
        
        # Check status
        response = requests.get(
            f"{BASE_URL}/api/notifications/status",
            headers=self.get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscribed"] == False
        print(f"✓ Status correctly shows unsubscribed: {data}")


class TestEventNotifications:
    """Test that creating events sends notifications to group members"""
    
    @pytest.fixture(autouse=True)
    def setup(self, test_session, test_group_with_members):
        """Setup test session and group for all tests"""
        global TEST_SESSION_TOKEN, TEST_USER_ID, TEST_GROUP_ID
        TEST_SESSION_TOKEN = test_session['session_token']
        TEST_USER_ID = test_session['user_id']
        TEST_GROUP_ID = test_group_with_members['group_id']
    
    def get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TEST_SESSION_TOKEN}"
        }
    
    # Test 7: POST /api/groups/{group_id}/events - should create notification for group members
    def test_event_creation_sends_notifications(self, test_group_with_members):
        """Test that creating an event sends notifications to group members"""
        group_id = test_group_with_members['group_id']
        member_user_id = test_group_with_members['member_user_id']
        
        # Create an event
        event_date = (datetime.now() + timedelta(days=7)).isoformat()
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/events",
            headers=self.get_headers(),
            json={
                "title": "Test Cleanup Event",
                "description": "Testing notification system",
                "event_date": event_date,
                "location_name": "Test Location"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        event_data = response.json()
        assert "event_id" in event_data
        print(f"✓ Event created: {event_data['event_id']}")
        
        # Check that notification was created for the member (not the creator)
        # We need to check the member's notifications
        member_session = test_group_with_members['member_session_token']
        member_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {member_session}"
        }
        
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications/mock",
            headers=member_headers
        )
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Find notification about the new event
        event_notifications = [n for n in notifications if "Test Cleanup Event" in n.get("message", "")]
        assert len(event_notifications) > 0, "Expected notification for new event"
        print(f"✓ Notification sent to group member: {event_notifications[0]}")


class TestNotificationAuth:
    """Test that notification endpoints require authentication"""
    
    def test_subscribe_requires_auth(self):
        """Test that subscribe endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers={"Content-Type": "application/json"},
            json={"subscription": None}
        )
        assert response.status_code == 401
        print("✓ Subscribe requires auth")
    
    def test_unsubscribe_requires_auth(self):
        """Test that unsubscribe endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/unsubscribe",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✓ Unsubscribe requires auth")
    
    def test_status_requires_auth(self):
        """Test that status endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/status",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✓ Status requires auth")
    
    def test_notifications_list_requires_auth(self):
        """Test that notifications list endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/mock",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✓ Notifications list requires auth")
    
    def test_mark_read_requires_auth(self):
        """Test that mark-read endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/mark-read",
            headers={"Content-Type": "application/json"},
            json={}
        )
        assert response.status_code == 401
        print("✓ Mark-read requires auth")


# Fixtures
@pytest.fixture(scope="module")
def test_session():
    """Create a test user and session"""
    import subprocess
    import json
    
    timestamp = int(datetime.now().timestamp() * 1000)
    user_id = f"test-notif-{timestamp}"
    session_token = f"test_notif_session_{timestamp}"
    
    # Create user and session in MongoDB
    mongo_script = f"""
    use('test_database');
    db.users.insertOne({{
      user_id: '{user_id}',
      email: 'test.notif.{timestamp}@example.com',
      name: 'Test Notification User',
      picture: 'https://via.placeholder.com/150',
      total_points: 0,
      monthly_points: 0,
      weekly_points: 0,
      medals: {{}},
      joined_groups: [],
      is_admin: false,
      is_banned: false,
      created_at: new Date()
    }});
    db.user_sessions.insertOne({{
      user_id: '{user_id}',
      session_token: '{session_token}',
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    }});
    """
    subprocess.run(['mongosh', '--quiet', '--eval', mongo_script], capture_output=True)
    
    yield {"user_id": user_id, "session_token": session_token}
    
    # Cleanup
    cleanup_script = f"""
    use('test_database');
    db.users.deleteOne({{user_id: '{user_id}'}});
    db.user_sessions.deleteOne({{session_token: '{session_token}'}});
    db.notification_subscriptions.deleteOne({{user_id: '{user_id}'}});
    db.notifications.deleteMany({{user_id: '{user_id}'}});
    """
    subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)


@pytest.fixture(scope="module")
def test_group_with_members(test_session):
    """Create a test group with multiple members for notification testing"""
    import subprocess
    
    timestamp = int(datetime.now().timestamp() * 1000)
    group_id = f"test-group-{timestamp}"
    member_user_id = f"test-member-{timestamp}"
    member_session_token = f"test_member_session_{timestamp}"
    
    # Create member user and session
    mongo_script = f"""
    use('test_database');
    db.users.insertOne({{
      user_id: '{member_user_id}',
      email: 'test.member.{timestamp}@example.com',
      name: 'Test Member User',
      picture: 'https://via.placeholder.com/150',
      total_points: 0,
      monthly_points: 0,
      weekly_points: 0,
      medals: {{}},
      joined_groups: ['{group_id}'],
      is_admin: false,
      is_banned: false,
      created_at: new Date()
    }});
    db.user_sessions.insertOne({{
      user_id: '{member_user_id}',
      session_token: '{member_session_token}',
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    }});
    db.groups.insertOne({{
      group_id: '{group_id}',
      name: 'Test Notification Group',
      description: 'Group for testing notifications',
      admin_ids: ['{test_session["user_id"]}'],
      member_ids: ['{test_session["user_id"]}', '{member_user_id}'],
      total_points: 0,
      weekly_points: 0,
      created_at: new Date()
    }});
    db.users.updateOne(
      {{user_id: '{test_session["user_id"]}'}},
      {{$addToSet: {{joined_groups: '{group_id}'}}}}
    );
    db.notification_preferences.insertOne({{
      user_id: '{member_user_id}',
      notify_new_events: true,
      notify_group_updates: true
    }});
    """
    subprocess.run(['mongosh', '--quiet', '--eval', mongo_script], capture_output=True)
    
    yield {
        "group_id": group_id,
        "member_user_id": member_user_id,
        "member_session_token": member_session_token
    }
    
    # Cleanup
    cleanup_script = f"""
    use('test_database');
    db.users.deleteOne({{user_id: '{member_user_id}'}});
    db.user_sessions.deleteOne({{session_token: '{member_session_token}'}});
    db.groups.deleteOne({{group_id: '{group_id}'}});
    db.group_events.deleteMany({{group_id: '{group_id}'}});
    db.notifications.deleteMany({{user_id: '{member_user_id}'}});
    db.notification_preferences.deleteOne({{user_id: '{member_user_id}'}});
    db.users.updateOne(
      {{user_id: '{test_session["user_id"]}'}},
      {{$pull: {{joined_groups: '{group_id}'}}}}
    );
    """
    subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
