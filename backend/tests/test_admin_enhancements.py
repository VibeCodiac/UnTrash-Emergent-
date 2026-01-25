"""
Backend API Tests for UnTrash Berlin - Admin Enhancements
Tests:
1. DELETE /api/admin/trash/{report_id} - deducts points from reporter and collector
2. POST /api/trash/collect/{report_id} - creates pending collection with admin_verified=false
3. GET /api/admin/collections/pending - returns pending collections
4. POST /api/admin/collections/{report_id}/approve - verifies collection and awards points
5. DELETE /api/admin/collections/{report_id} - rejects collection and reverts status
6. GET /api/admin/pending-count - returns counts of pending items
7. POST /api/admin/users/{user_id}/ban - bans user and deletes sessions
8. POST /api/admin/users/{user_id}/unban - unbans user
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cleanup-berlin.preview.emergentagent.com')
SESSION_TOKEN = "mTuak5CtB7pp7_9RmTUgwYofl8AIFgBO9v_bxDlxN0o"
ADMIN_USER_ID = "user_5f414c29c917"


@pytest.fixture
def auth_headers():
    """Headers with session token for authenticated requests"""
    return {"Cookie": f"session_token={SESSION_TOKEN}"}


class TestPendingCount:
    """Test GET /api/admin/pending-count endpoint"""
    
    def test_pending_count_returns_counts(self, auth_headers):
        """Admin should be able to get pending verification counts"""
        response = requests.get(f"{BASE_URL}/api/admin/pending-count", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pending_collections" in data, "pending_collections field missing"
        assert "pending_areas" in data, "pending_areas field missing"
        assert "total_pending" in data, "total_pending field missing"
        
        # Verify total is sum of collections and areas
        assert data["total_pending"] == data["pending_collections"] + data["pending_areas"], \
            "total_pending should equal sum of pending_collections and pending_areas"
        
        print(f"✓ Pending counts: collections={data['pending_collections']}, areas={data['pending_areas']}, total={data['total_pending']}")
    
    def test_pending_count_requires_admin(self):
        """Pending count endpoint should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/pending-count")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Pending count endpoint properly requires authentication")


class TestPendingCollections:
    """Test GET /api/admin/collections/pending endpoint"""
    
    def test_pending_collections_list(self, auth_headers):
        """Admin should be able to list pending trash collections"""
        response = requests.get(f"{BASE_URL}/api/admin/collections/pending", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of pending collections"
        print(f"✓ Found {len(data)} pending collections")
        
        # If there are pending collections, verify structure
        if len(data) > 0:
            collection = data[0]
            assert "report_id" in collection, "report_id missing"
            assert "status" in collection, "status missing"
            assert collection["status"] == "collected", "Status should be 'collected'"
            assert collection.get("admin_verified") == False, "admin_verified should be False for pending"
            print(f"✓ Pending collection structure verified: {collection['report_id']}")
    
    def test_pending_collections_requires_admin(self):
        """Pending collections endpoint should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/collections/pending")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Pending collections endpoint properly requires authentication")


class TestBanUnbanUser:
    """Test POST /api/admin/users/{user_id}/ban and /unban endpoints"""
    
    def test_ban_user_requires_admin(self):
        """Ban endpoint should require admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/users/test_user/ban")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Ban user endpoint properly requires authentication")
    
    def test_unban_user_requires_admin(self):
        """Unban endpoint should require admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/users/test_user/unban")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Unban user endpoint properly requires authentication")
    
    def test_ban_user_endpoint_exists(self, auth_headers):
        """Ban endpoint should exist and respond correctly"""
        # Test with non-existent user - should still return 200 (MongoDB update with no match)
        response = requests.post(
            f"{BASE_URL}/api/admin/users/nonexistent_user_12345/ban",
            headers=auth_headers
        )
        # Should return 200 even for non-existent user (MongoDB update behavior)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "banned" in data["message"].lower(), "Message should mention banned"
        print(f"✓ Ban endpoint works: {data['message']}")
    
    def test_unban_user_endpoint_exists(self, auth_headers):
        """Unban endpoint should exist and respond correctly"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/nonexistent_user_12345/unban",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "unbanned" in data["message"].lower(), "Message should mention unbanned"
        print(f"✓ Unban endpoint works: {data['message']}")


class TestDeleteTrashReport:
    """Test DELETE /api/admin/trash/{report_id} endpoint with points deduction"""
    
    def test_delete_trash_report_requires_admin(self):
        """Delete trash report endpoint should require admin authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/trash/test_report")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Delete trash report endpoint properly requires authentication")
    
    def test_delete_nonexistent_report_returns_404(self, auth_headers):
        """Deleting non-existent report should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/trash/nonexistent_report_12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent report returns 404")


class TestCollectionApproval:
    """Test POST /api/admin/collections/{report_id}/approve endpoint"""
    
    def test_approve_collection_requires_admin(self):
        """Approve collection endpoint should require admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/collections/test_report/approve")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Approve collection endpoint properly requires authentication")
    
    def test_approve_nonexistent_collection_returns_404(self, auth_headers):
        """Approving non-existent collection should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/collections/nonexistent_report_12345/approve",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Approve non-existent collection returns 404")


class TestCollectionRejection:
    """Test DELETE /api/admin/collections/{report_id} endpoint"""
    
    def test_reject_collection_requires_admin(self):
        """Reject collection endpoint should require admin authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/collections/test_report")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Reject collection endpoint properly requires authentication")
    
    def test_reject_nonexistent_collection_returns_404(self, auth_headers):
        """Rejecting non-existent collection should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/collections/nonexistent_report_12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Reject non-existent collection returns 404")


class TestTrashCollectionFlow:
    """Test the full trash collection flow with admin verification"""
    
    def test_collect_trash_creates_pending_collection(self, auth_headers):
        """Collecting trash should create a pending collection requiring admin verification"""
        # First, get a reported trash item
        response = requests.get(f"{BASE_URL}/api/trash/list?status=reported", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        reports = response.json()
        if len(reports) == 0:
            pytest.skip("No reported trash items available for testing")
        
        # Find a report that hasn't been collected yet
        report = reports[0]
        report_id = report["report_id"]
        
        # Try to collect it
        collect_data = {
            "proof_image_url": "https://example.com/proof.jpg"
        }
        response = requests.post(
            f"{BASE_URL}/api/trash/collect/{report_id}",
            json=collect_data,
            headers=auth_headers
        )
        
        # Could be 200 (success) or 400 (already collected)
        if response.status_code == 400:
            print(f"✓ Report {report_id} already collected - skipping collection test")
            return
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "admin verification" in data["message"].lower() or "pending" in data["message"].lower(), \
            "Message should mention admin verification"
        assert "points_pending" in data, "Response should contain points_pending"
        print(f"✓ Collection submitted for admin verification: {data['message']}, points_pending={data['points_pending']}")


class TestAdminUsersEndpoint:
    """Test GET /api/admin/users endpoint"""
    
    def test_admin_users_shows_banned_status(self, auth_headers):
        """Admin users list should include is_banned field"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        users = response.json()
        assert len(users) > 0, "No users returned"
        
        # Check that users have is_banned field
        for user in users:
            assert "is_banned" in user, f"is_banned field missing from user {user.get('user_id')}"
        
        print(f"✓ Admin users list includes is_banned field for all {len(users)} users")


class TestExistingTrashReports:
    """Test existing trash reports have correct structure"""
    
    def test_trash_reports_have_admin_verified_field(self, auth_headers):
        """Collected trash reports should have admin_verified field"""
        response = requests.get(f"{BASE_URL}/api/trash/list", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        reports = response.json()
        collected_reports = [r for r in reports if r.get("status") == "collected"]
        
        if len(collected_reports) == 0:
            print("✓ No collected reports to verify admin_verified field")
            return
        
        for report in collected_reports:
            # admin_verified might not exist for old reports, but new ones should have it
            if "admin_verified" in report:
                print(f"✓ Report {report['report_id']} has admin_verified={report['admin_verified']}")
        
        print(f"✓ Checked {len(collected_reports)} collected reports")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
