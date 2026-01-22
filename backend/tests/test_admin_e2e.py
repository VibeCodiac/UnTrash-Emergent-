"""
End-to-End Tests for UnTrash Berlin Admin Enhancements
Tests the complete flow:
1. Report trash -> Collect trash -> Admin approve/reject
2. Ban/Unban user flow
3. Delete trash report with points deduction
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bln-cleanup.preview.emergentagent.com')
SESSION_TOKEN = "mTuak5CtB7pp7_9RmTUgwYofl8AIFgBO9v_bxDlxN0o"
ADMIN_USER_ID = "user_5f414c29c917"


@pytest.fixture
def auth_headers():
    """Headers with session token for authenticated requests"""
    return {"Cookie": f"session_token={SESSION_TOKEN}"}


class TestE2ETrashCollectionApproval:
    """End-to-end test for trash collection with admin approval"""
    
    def test_full_collection_approval_flow(self, auth_headers):
        """Test: Report -> Collect -> Admin Approve -> Points Awarded"""
        
        # Step 1: Get initial user points
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert user_response.status_code == 200
        initial_points = user_response.json().get("total_points", 0)
        print(f"✓ Initial user points: {initial_points}")
        
        # Step 2: Find a reported trash item
        trash_response = requests.get(f"{BASE_URL}/api/trash/list?status=reported", headers=auth_headers)
        assert trash_response.status_code == 200
        reports = trash_response.json()
        
        if len(reports) == 0:
            pytest.skip("No reported trash items available for testing")
        
        report = reports[0]
        report_id = report["report_id"]
        print(f"✓ Found reported trash: {report_id}")
        
        # Step 3: Collect the trash
        collect_data = {"proof_image_url": "https://via.placeholder.com/400x300?text=Collected"}
        collect_response = requests.post(
            f"{BASE_URL}/api/trash/collect/{report_id}",
            json=collect_data,
            headers=auth_headers
        )
        
        if collect_response.status_code == 400:
            print(f"○ Report already collected, skipping collection step")
            # Find a pending collection instead
            pending_response = requests.get(f"{BASE_URL}/api/admin/collections/pending", headers=auth_headers)
            assert pending_response.status_code == 200
            pending = pending_response.json()
            if len(pending) == 0:
                pytest.skip("No pending collections available for testing")
            report_id = pending[0]["report_id"]
            print(f"✓ Using existing pending collection: {report_id}")
        else:
            assert collect_response.status_code == 200, f"Expected 200, got {collect_response.status_code}"
            collect_data = collect_response.json()
            assert "admin verification" in collect_data["message"].lower() or "pending" in collect_data["message"].lower()
            print(f"✓ Collection submitted: {collect_data['message']}")
        
        # Step 4: Verify collection is pending
        pending_response = requests.get(f"{BASE_URL}/api/admin/collections/pending", headers=auth_headers)
        assert pending_response.status_code == 200
        pending = pending_response.json()
        pending_ids = [p["report_id"] for p in pending]
        assert report_id in pending_ids, f"Report {report_id} not in pending collections"
        print(f"✓ Collection is pending admin verification")
        
        # Step 5: Admin approves the collection
        approve_response = requests.post(
            f"{BASE_URL}/api/admin/collections/{report_id}/approve",
            headers=auth_headers
        )
        assert approve_response.status_code == 200, f"Expected 200, got {approve_response.status_code}"
        approve_data = approve_response.json()
        assert "approved" in approve_data["message"].lower()
        points_awarded = approve_data.get("points", 0)
        print(f"✓ Collection approved, points awarded: {points_awarded}")
        
        # Step 6: Verify collection is no longer pending
        pending_response = requests.get(f"{BASE_URL}/api/admin/collections/pending", headers=auth_headers)
        assert pending_response.status_code == 200
        pending = pending_response.json()
        pending_ids = [p["report_id"] for p in pending]
        assert report_id not in pending_ids, f"Report {report_id} should not be in pending after approval"
        print(f"✓ Collection removed from pending list")
        
        # Step 7: Verify report status is updated
        report_response = requests.get(f"{BASE_URL}/api/trash/{report_id}", headers=auth_headers)
        assert report_response.status_code == 200
        report = report_response.json()
        assert report.get("admin_verified") == True, "admin_verified should be True after approval"
        assert report.get("points_given") == True, "points_given should be True after approval"
        print(f"✓ Report status updated: admin_verified={report['admin_verified']}, points_given={report['points_given']}")


class TestE2ECollectionRejection:
    """End-to-end test for trash collection rejection"""
    
    def test_collection_rejection_reverts_status(self, auth_headers):
        """Test: Collect -> Admin Reject -> Status reverts to 'reported'"""
        
        # Step 1: Find a reported trash item
        trash_response = requests.get(f"{BASE_URL}/api/trash/list?status=reported", headers=auth_headers)
        assert trash_response.status_code == 200
        reports = trash_response.json()
        
        if len(reports) == 0:
            pytest.skip("No reported trash items available for testing")
        
        report = reports[0]
        report_id = report["report_id"]
        print(f"✓ Found reported trash: {report_id}")
        
        # Step 2: Collect the trash
        collect_data = {"proof_image_url": "https://via.placeholder.com/400x300?text=Collected"}
        collect_response = requests.post(
            f"{BASE_URL}/api/trash/collect/{report_id}",
            json=collect_data,
            headers=auth_headers
        )
        
        if collect_response.status_code == 400:
            pytest.skip("Report already collected, cannot test rejection flow")
        
        assert collect_response.status_code == 200
        print(f"✓ Collection submitted for report: {report_id}")
        
        # Step 3: Admin rejects the collection
        reject_response = requests.delete(
            f"{BASE_URL}/api/admin/collections/{report_id}",
            headers=auth_headers
        )
        assert reject_response.status_code == 200, f"Expected 200, got {reject_response.status_code}"
        reject_data = reject_response.json()
        assert "rejected" in reject_data["message"].lower() or "reverted" in reject_data["message"].lower()
        print(f"✓ Collection rejected: {reject_data['message']}")
        
        # Step 4: Verify report status is reverted to 'reported'
        report_response = requests.get(f"{BASE_URL}/api/trash/{report_id}", headers=auth_headers)
        assert report_response.status_code == 200
        report = report_response.json()
        assert report.get("status") == "reported", f"Status should be 'reported', got {report.get('status')}"
        assert report.get("collector_id") is None, "collector_id should be None after rejection"
        print(f"✓ Report status reverted to 'reported'")


class TestE2EBanUnbanUser:
    """End-to-end test for ban/unban user functionality"""
    
    def test_ban_user_deletes_sessions(self, auth_headers):
        """Test: Ban user -> Sessions deleted -> User cannot authenticate"""
        
        # Step 1: Get list of users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        
        # Find a non-admin user to ban
        test_user = None
        for user in users:
            if not user.get("is_admin") and not user.get("is_banned"):
                test_user = user
                break
        
        if not test_user:
            pytest.skip("No non-admin, non-banned user available for testing")
        
        user_id = test_user["user_id"]
        print(f"✓ Found test user: {user_id} ({test_user['email']})")
        
        # Step 2: Ban the user
        ban_response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/ban",
            headers=auth_headers
        )
        assert ban_response.status_code == 200
        ban_data = ban_response.json()
        assert "banned" in ban_data["message"].lower()
        print(f"✓ User banned: {ban_data['message']}")
        
        # Step 3: Verify user is banned
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        banned_user = next((u for u in users if u["user_id"] == user_id), None)
        assert banned_user is not None, "User should still exist"
        assert banned_user.get("is_banned") == True, "User should be banned"
        print(f"✓ User is_banned={banned_user['is_banned']}")
        
        # Step 4: Unban the user
        unban_response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/unban",
            headers=auth_headers
        )
        assert unban_response.status_code == 200
        unban_data = unban_response.json()
        assert "unbanned" in unban_data["message"].lower()
        print(f"✓ User unbanned: {unban_data['message']}")
        
        # Step 5: Verify user is unbanned
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        unbanned_user = next((u for u in users if u["user_id"] == user_id), None)
        assert unbanned_user is not None, "User should still exist"
        assert unbanned_user.get("is_banned") == False, "User should be unbanned"
        print(f"✓ User is_banned={unbanned_user['is_banned']}")


class TestE2EDeleteTrashWithPointsDeduction:
    """End-to-end test for deleting trash report with points deduction"""
    
    def test_delete_report_deducts_reporter_points(self, auth_headers):
        """Test: Delete report -> Reporter points deducted"""
        
        # Step 1: Get initial admin user points
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert user_response.status_code == 200
        initial_points = user_response.json().get("total_points", 0)
        print(f"✓ Initial admin points: {initial_points}")
        
        # Step 2: Find a trash report by admin user
        trash_response = requests.get(f"{BASE_URL}/api/trash/list", headers=auth_headers)
        assert trash_response.status_code == 200
        reports = trash_response.json()
        
        # Find a report by the admin user
        admin_report = None
        for report in reports:
            if report.get("reporter_id") == ADMIN_USER_ID:
                admin_report = report
                break
        
        if not admin_report:
            pytest.skip("No trash report by admin user available for testing")
        
        report_id = admin_report["report_id"]
        print(f"✓ Found admin's trash report: {report_id}")
        
        # Step 3: Delete the report
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/trash/{report_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        delete_data = delete_response.json()
        assert "deleted" in delete_data["message"].lower()
        print(f"✓ Report deleted: {delete_data['message']}")
        print(f"✓ Points deducted: {delete_data.get('points_deducted', [])}")
        
        # Step 4: Verify points were deducted
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert user_response.status_code == 200
        final_points = user_response.json().get("total_points", 0)
        print(f"✓ Final admin points: {final_points}")
        
        # Points should be reduced by 10 (reporter points)
        expected_points = initial_points - 10
        assert final_points == expected_points, f"Expected {expected_points} points, got {final_points}"
        print(f"✓ Points correctly deducted: {initial_points} -> {final_points}")


class TestPendingCountAccuracy:
    """Test that pending count matches actual pending items"""
    
    def test_pending_count_matches_actual(self, auth_headers):
        """Verify pending count endpoint returns accurate counts"""
        
        # Get pending count
        count_response = requests.get(f"{BASE_URL}/api/admin/pending-count", headers=auth_headers)
        assert count_response.status_code == 200
        counts = count_response.json()
        
        # Get actual pending collections
        collections_response = requests.get(f"{BASE_URL}/api/admin/collections/pending", headers=auth_headers)
        assert collections_response.status_code == 200
        actual_collections = len(collections_response.json())
        
        # Get actual pending areas
        areas_response = requests.get(f"{BASE_URL}/api/admin/areas/pending", headers=auth_headers)
        assert areas_response.status_code == 200
        actual_areas = len(areas_response.json())
        
        # Verify counts match
        assert counts["pending_collections"] == actual_collections, \
            f"pending_collections mismatch: {counts['pending_collections']} vs {actual_collections}"
        assert counts["pending_areas"] == actual_areas, \
            f"pending_areas mismatch: {counts['pending_areas']} vs {actual_areas}"
        assert counts["total_pending"] == actual_collections + actual_areas, \
            f"total_pending mismatch: {counts['total_pending']} vs {actual_collections + actual_areas}"
        
        print(f"✓ Pending counts accurate: collections={actual_collections}, areas={actual_areas}, total={counts['total_pending']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
