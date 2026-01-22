"""
Test Points System V5 - Testing specific changes:
1. POST /api/trash/report should return points_awarded=5 and message about earning points
2. POST /api/trash/collect/{report_id} should return points_pending=20 and message about admin verification
3. POST /api/admin/users/{user_id}/reset-points should work for ALL users including admin users
4. DELETE /api/admin/trash/{report_id} should deduct reporter points (5 points) when deleting a report
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials created via mongosh
TEST_USER_ID = "test_user_points_1769119436280"
TEST_SESSION_TOKEN = "test_session_points_1769119436280"
ADMIN_USER_ID = "test_admin_1769119436301"
ADMIN_SESSION_TOKEN = "test_admin_session_1769119436301"


class TestTrashReportPoints:
    """Test 1: POST /api/trash/report should return points_awarded=5"""
    
    def test_report_trash_returns_5_points(self):
        """Verify that reporting trash awards 5 points immediately"""
        response = requests.post(
            f"{BASE_URL}/api/trash/report",
            json={
                "location": {"lat": 52.5200, "lng": 13.4050, "address": "Test Location Berlin"},
                "image_url": "https://res.cloudinary.com/dx9sbx0lc/image/upload/test_trash_report.jpg"
            },
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify points_awarded is 5
        assert "points_awarded" in data, "Response should contain points_awarded"
        assert data["points_awarded"] == 5, f"Expected points_awarded=5, got {data['points_awarded']}"
        
        # Verify message about earning points
        assert "message" in data, "Response should contain message"
        assert "5 points" in data["message"], f"Message should mention 5 points: {data['message']}"
        
        # Store report_id for later tests
        pytest.report_id_for_delete = data.get("report_id")
        print(f"✓ Report created with report_id: {data.get('report_id')}, points_awarded: {data['points_awarded']}")
        print(f"✓ Message: {data['message']}")


class TestTrashCollectPoints:
    """Test 2: POST /api/trash/collect/{report_id} should return points_pending=20"""
    
    def test_collect_trash_returns_20_points_pending(self):
        """Verify that collecting trash returns points_pending=20 for admin verification"""
        # First create a trash report to collect
        report_response = requests.post(
            f"{BASE_URL}/api/trash/report",
            json={
                "location": {"lat": 52.5201, "lng": 13.4051, "address": "Test Collection Location"},
                "image_url": "https://res.cloudinary.com/dx9sbx0lc/image/upload/test_trash_collect.jpg"
            },
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert report_response.status_code == 200, f"Failed to create report: {report_response.text}"
        report_id = report_response.json()["report_id"]
        
        # Now collect the trash
        collect_response = requests.post(
            f"{BASE_URL}/api/trash/collect/{report_id}",
            json={
                "proof_image_url": "https://res.cloudinary.com/dx9sbx0lc/image/upload/test_proof.jpg"
            },
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert collect_response.status_code == 200, f"Expected 200, got {collect_response.status_code}: {collect_response.text}"
        data = collect_response.json()
        
        # Verify points_pending is 20
        assert "points_pending" in data, "Response should contain points_pending"
        assert data["points_pending"] == 20, f"Expected points_pending=20, got {data['points_pending']}"
        
        # Verify message about admin verification
        assert "message" in data, "Response should contain message"
        assert "admin" in data["message"].lower() or "verification" in data["message"].lower(), \
            f"Message should mention admin verification: {data['message']}"
        
        print(f"✓ Collection submitted with points_pending: {data['points_pending']}")
        print(f"✓ Message: {data['message']}")


class TestAdminResetPointsForAllUsers:
    """Test 3: POST /api/admin/users/{user_id}/reset-points should work for ALL users including admin users"""
    
    def test_reset_points_for_regular_user(self):
        """Verify admin can reset points for regular users"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}/reset-points",
            json={
                "total_points": 25,
                "monthly_points": 25,
                "weekly_points": 25
            },
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "message" in data, "Response should contain message"
        assert "new_points" in data, "Response should contain new_points"
        assert data["new_points"]["total"] == 25, f"Expected total=25, got {data['new_points']['total']}"
        
        print(f"✓ Reset points for regular user: {data}")
    
    def test_reset_points_for_admin_user(self):
        """Verify admin can reset points for OTHER admin users"""
        # First, let's create another admin user to test
        import uuid
        another_admin_id = f"test_admin_target_{uuid.uuid4().hex[:8]}"
        
        # Create another admin user via mongosh
        import subprocess
        result = subprocess.run([
            "mongosh", "--quiet", "--eval", f"""
            use('test_database');
            db.users.insertOne({{
                user_id: '{another_admin_id}',
                email: 'another.admin.{uuid.uuid4().hex[:8]}@example.com',
                name: 'Another Admin User',
                total_points: 200,
                monthly_points: 200,
                weekly_points: 200,
                medals: {{}},
                joined_groups: [],
                is_admin: true,
                is_banned: false,
                created_at: new Date()
            }});
            print('Created admin user: {another_admin_id}');
            """
        ], capture_output=True, text=True)
        
        # Now reset points for this admin user
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{another_admin_id}/reset-points",
            json={
                "total_points": 0,
                "monthly_points": 0,
                "weekly_points": 0,
                "clear_medals": True
            },
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["new_points"]["total"] == 0, f"Expected total=0, got {data['new_points']['total']}"
        assert data["new_points"]["monthly"] == 0, f"Expected monthly=0, got {data['new_points']['monthly']}"
        assert data["new_points"]["weekly"] == 0, f"Expected weekly=0, got {data['new_points']['weekly']}"
        
        print(f"✓ Reset points for ADMIN user {another_admin_id}: {data}")
    
    def test_reset_points_for_self_admin(self):
        """Verify admin can reset their OWN points"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json={
                "total_points": 50,
                "monthly_points": 50,
                "weekly_points": 50
            },
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["new_points"]["total"] == 50, f"Expected total=50, got {data['new_points']['total']}"
        
        print(f"✓ Admin reset their OWN points: {data}")


class TestDeleteTrashReportDeductsPoints:
    """Test 4: DELETE /api/admin/trash/{report_id} should deduct reporter points (5 points)"""
    
    def test_delete_report_deducts_reporter_points(self):
        """Verify that deleting a trash report deducts 5 points from the reporter"""
        # First, get the reporter's current points
        user_response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        
        if user_response.status_code != 200:
            pytest.skip("Could not get user data")
        
        initial_points = user_response.json().get("total_points", 0)
        print(f"Initial points for reporter: {initial_points}")
        
        # Create a new trash report
        report_response = requests.post(
            f"{BASE_URL}/api/trash/report",
            json={
                "location": {"lat": 52.5202, "lng": 13.4052, "address": "Test Delete Location"},
                "image_url": "https://res.cloudinary.com/dx9sbx0lc/image/upload/test_delete_report.jpg"
            },
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert report_response.status_code == 200, f"Failed to create report: {report_response.text}"
        report_id = report_response.json()["report_id"]
        points_awarded = report_response.json()["points_awarded"]
        
        print(f"Created report {report_id} with {points_awarded} points awarded")
        
        # Get points after report creation
        user_response_after_report = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        points_after_report = user_response_after_report.json().get("total_points", 0)
        print(f"Points after report: {points_after_report}")
        
        # Now delete the report as admin
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/trash/{report_id}",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        data = delete_response.json()
        
        # Verify response mentions points deducted
        assert "points_deducted" in data, "Response should contain points_deducted"
        print(f"Points deducted info: {data['points_deducted']}")
        
        # Verify the reporter's points were deducted
        user_response_after_delete = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        points_after_delete = user_response_after_delete.json().get("total_points", 0)
        print(f"Points after delete: {points_after_delete}")
        
        # Points should be deducted by 5 (the report points)
        expected_points = points_after_report - 5
        assert points_after_delete == expected_points, \
            f"Expected points to be {expected_points} after deduction, got {points_after_delete}"
        
        print(f"✓ Report deleted and 5 points deducted from reporter")
        print(f"✓ Points: {points_after_report} -> {points_after_delete} (deducted 5)")


class TestAdminEndpointSecurity:
    """Test that admin endpoints require admin authentication"""
    
    def test_reset_points_requires_admin(self):
        """Verify that non-admin users cannot reset points"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}/reset-points",
            json={"total_points": 0, "monthly_points": 0, "weekly_points": 0},
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}  # Non-admin token
        )
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("✓ Non-admin cannot reset points (403 Forbidden)")
    
    def test_delete_report_requires_admin(self):
        """Verify that non-admin users cannot delete reports"""
        # Create a report first
        report_response = requests.post(
            f"{BASE_URL}/api/trash/report",
            json={
                "location": {"lat": 52.5203, "lng": 13.4053, "address": "Test Security Location"},
                "image_url": "https://res.cloudinary.com/dx9sbx0lc/image/upload/test_security.jpg"
            },
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        if report_response.status_code != 200:
            pytest.skip("Could not create report")
        
        report_id = report_response.json()["report_id"]
        
        # Try to delete as non-admin
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/trash/{report_id}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}  # Non-admin token
        )
        
        assert delete_response.status_code == 403, f"Expected 403 for non-admin, got {delete_response.status_code}"
        print("✓ Non-admin cannot delete reports (403 Forbidden)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
