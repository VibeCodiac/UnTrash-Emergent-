"""
Test suite for UnTrash Berlin - Points System & Medal Updates
Tests:
1. Test data filtering from trash list
2. Reduced point values (Report: 5, Collect: 15-25, Area: 2 per 100m²)
3. Admin reset points functionality
4. Updated medal thresholds (Bronze 30, Silver 75, Gold 150, Platinum 300, Diamond 500)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_SESSION_TOKEN = "mTuak5CtB7pp7_9RmTUgwYofl8AIFgBO9v_bxDlxN0o"
ADMIN_USER_ID = "user_5f414c29c917"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def admin_client(api_client):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"})
    return api_client


class TestTrashListFiltering:
    """Test filtering of test/placeholder data from trash list"""
    
    def test_trash_list_excludes_test_data_by_default(self, api_client):
        """GET /api/trash/list should exclude test/placeholder images by default"""
        response = api_client.get(f"{BASE_URL}/api/trash/list")
        assert response.status_code == 200
        
        reports = response.json()
        # Check that no reports have placeholder/test URLs
        for report in reports:
            image_url = report.get("image_url", "").lower()
            assert "placeholder" not in image_url, f"Found placeholder in: {image_url}"
            assert "via.placeholder" not in image_url, f"Found via.placeholder in: {image_url}"
            assert "example.com" not in image_url, f"Found example.com in: {image_url}"
        print(f"✓ Trash list returned {len(reports)} reports without test data")
    
    def test_trash_list_includes_test_data_with_flag(self, admin_client):
        """GET /api/trash/list?include_test=true should include all reports"""
        # First get without flag
        response_without = admin_client.get(f"{BASE_URL}/api/trash/list")
        assert response_without.status_code == 200
        count_without = len(response_without.json())
        
        # Then get with flag
        response_with = admin_client.get(f"{BASE_URL}/api/trash/list?include_test=true")
        assert response_with.status_code == 200
        count_with = len(response_with.json())
        
        # With flag should return >= without flag
        assert count_with >= count_without, f"Expected include_test to return more or equal reports"
        print(f"✓ Without flag: {count_without}, With flag: {count_with}")


class TestReducedPointValues:
    """Test that point values have been reduced"""
    
    def test_report_trash_awards_5_points(self, admin_client):
        """POST /api/trash/report should award 5 points (reduced from 10)"""
        # Get current user points
        user_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        assert user_response.status_code == 200
        initial_points = user_response.json().get("total_points", 0)
        
        # Create a test report
        report_data = {
            "location": {"lat": 52.5200, "lng": 13.4050, "address": "Test Location"},
            "image_url": "https://res.cloudinary.com/test/image/upload/test_report.jpg"
        }
        
        response = admin_client.post(f"{BASE_URL}/api/trash/report", json=report_data)
        assert response.status_code == 200
        
        report = response.json()
        assert report.get("points_awarded") == 5, f"Expected 5 points, got {report.get('points_awarded')}"
        
        # Verify user points increased by 5
        user_response_after = admin_client.get(f"{BASE_URL}/api/auth/me")
        new_points = user_response_after.json().get("total_points", 0)
        assert new_points == initial_points + 5, f"Expected points to increase by 5"
        
        print(f"✓ Report awarded 5 points (was {initial_points}, now {new_points})")
        
        # Store report_id for cleanup
        return report.get("report_id")
    
    def test_collect_trash_awards_15_to_25_points(self, admin_client):
        """POST /api/trash/collect/{id} should set points_awarded to 15-25 (reduced from 30-50)"""
        # First create a report to collect
        report_data = {
            "location": {"lat": 52.5201, "lng": 13.4051, "address": "Test Collection Location"},
            "image_url": "https://res.cloudinary.com/test/image/upload/test_collect.jpg"
        }
        
        create_response = admin_client.post(f"{BASE_URL}/api/trash/report", json=report_data)
        assert create_response.status_code == 200
        report_id = create_response.json().get("report_id")
        
        # Collect the trash
        collect_data = {
            "proof_image_url": "https://res.cloudinary.com/test/image/upload/proof.jpg"
        }
        
        collect_response = admin_client.post(
            f"{BASE_URL}/api/trash/collect/{report_id}",
            json=collect_data
        )
        assert collect_response.status_code == 200
        
        result = collect_response.json()
        points_pending = result.get("points_pending")
        
        # Points should be 15 (not AI verified) or 25 (AI verified)
        assert points_pending in [15, 25], f"Expected 15 or 25 points, got {points_pending}"
        print(f"✓ Collection set points_pending to {points_pending} (15-25 range)")
    
    def test_area_clean_awards_2_points_per_100sqm(self, admin_client):
        """POST /api/areas/clean should calculate points as 2 per 100m² (reduced from 5)"""
        # Test with 500 sq meters - should award max(10, 500/100*2) = 10 points
        area_data = {
            "center_location": {"lat": 52.5202, "lng": 13.4052, "address": "Test Area"},
            "polygon_coords": [[52.52, 13.40], [52.52, 13.41], [52.53, 13.41], [52.53, 13.40]],
            "area_size": 500,
            "image_url": "https://res.cloudinary.com/test/image/upload/area.jpg"
        }
        
        response = admin_client.post(f"{BASE_URL}/api/areas/clean", json=area_data)
        assert response.status_code == 200
        
        result = response.json()
        points_pending = result.get("points_pending")
        
        # 500 sq meters / 100 * 2 = 10 points (min is 10)
        expected_points = max(10, int(500 / 100 * 2))
        assert points_pending == expected_points, f"Expected {expected_points} points, got {points_pending}"
        print(f"✓ Area cleaning (500m²) set points_pending to {points_pending}")
        
        # Test with 1000 sq meters - should award 1000/100*2 = 20 points
        area_data_large = {
            "center_location": {"lat": 52.5203, "lng": 13.4053, "address": "Large Test Area"},
            "polygon_coords": [[52.52, 13.40], [52.52, 13.42], [52.54, 13.42], [52.54, 13.40]],
            "area_size": 1000,
            "image_url": "https://res.cloudinary.com/test/image/upload/area_large.jpg"
        }
        
        response_large = admin_client.post(f"{BASE_URL}/api/areas/clean", json=area_data_large)
        assert response_large.status_code == 200
        
        result_large = response_large.json()
        points_large = result_large.get("points_pending")
        expected_large = max(10, int(1000 / 100 * 2))  # 20 points
        assert points_large == expected_large, f"Expected {expected_large} points, got {points_large}"
        print(f"✓ Area cleaning (1000m²) set points_pending to {points_large}")


class TestAdminResetPoints:
    """Test admin reset points functionality"""
    
    def test_reset_points_to_zero(self, admin_client):
        """POST /api/admin/users/{user_id}/reset-points should reset points to 0"""
        # First create a test user
        test_user_id = f"test_user_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # We'll use the admin user for testing (we'll restore points after)
        # Get current admin points
        user_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        assert user_response.status_code == 200
        original_points = user_response.json()
        
        # Skip if admin has no points to reset
        if original_points.get("total_points", 0) == 0:
            pytest.skip("Admin has no points to test reset")
        
        # Reset to zero
        reset_data = {
            "total_points": 0,
            "monthly_points": 0,
            "weekly_points": 0,
            "clear_medals": False
        }
        
        response = admin_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json=reset_data
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("new_points", {}).get("total") == 0
        assert result.get("new_points", {}).get("monthly") == 0
        assert result.get("new_points", {}).get("weekly") == 0
        print(f"✓ Reset points to zero successful")
        
        # Restore original points
        restore_data = {
            "total_points": original_points.get("total_points", 0),
            "monthly_points": original_points.get("monthly_points", 0),
            "weekly_points": original_points.get("weekly_points", 0)
        }
        admin_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json=restore_data
        )
    
    def test_reset_points_custom_values(self, admin_client):
        """POST /api/admin/users/{user_id}/reset-points can set custom values"""
        # Get current points
        user_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        original_points = user_response.json()
        
        # Set custom values
        custom_data = {
            "total_points": 100,
            "monthly_points": 50,
            "weekly_points": 25
        }
        
        response = admin_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json=custom_data
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("new_points", {}).get("total") == 100
        assert result.get("new_points", {}).get("monthly") == 50
        assert result.get("new_points", {}).get("weekly") == 25
        print(f"✓ Set custom points: total=100, monthly=50, weekly=25")
        
        # Verify by fetching user
        verify_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        verify_user = verify_response.json()
        assert verify_user.get("total_points") == 100
        assert verify_user.get("monthly_points") == 50
        assert verify_user.get("weekly_points") == 25
        print(f"✓ Verified custom points persisted")
        
        # Restore original points
        restore_data = {
            "total_points": original_points.get("total_points", 0),
            "monthly_points": original_points.get("monthly_points", 0),
            "weekly_points": original_points.get("weekly_points", 0)
        }
        admin_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json=restore_data
        )
    
    def test_reset_points_clear_medals(self, admin_client):
        """POST /api/admin/users/{user_id}/reset-points can clear medals"""
        # Get current user data
        user_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        original_user = user_response.json()
        
        # Reset with clear_medals=True
        reset_data = {
            "total_points": original_user.get("total_points", 0),
            "monthly_points": original_user.get("monthly_points", 0),
            "weekly_points": original_user.get("weekly_points", 0),
            "clear_medals": True
        }
        
        response = admin_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json=reset_data
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("medals_cleared") == True
        print(f"✓ Clear medals flag accepted")
        
        # Verify medals are cleared
        verify_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        verify_user = verify_response.json()
        assert verify_user.get("medals") == {} or verify_user.get("medals") is None or len(verify_user.get("medals", {})) == 0
        print(f"✓ Medals cleared successfully")
    
    def test_reset_points_requires_admin(self, api_client):
        """POST /api/admin/users/{user_id}/reset-points requires admin access"""
        # Try without auth
        response = api_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json={"total_points": 0}
        )
        assert response.status_code == 403
        print(f"✓ Reset points correctly requires admin access")


class TestMedalThresholds:
    """Test updated medal thresholds"""
    
    def test_medal_thresholds_in_code(self, admin_client):
        """Verify medal thresholds are: Bronze 30, Silver 75, Gold 150, Platinum 300, Diamond 500"""
        # We can verify this by checking the calculate_medal_for_points function behavior
        # by setting monthly points and checking medal assignment
        
        # Get original user data
        user_response = admin_client.get(f"{BASE_URL}/api/auth/me")
        original_user = user_response.json()
        
        # Test Bronze threshold (30 points)
        test_cases = [
            (29, None, "29 points should not earn bronze"),
            (30, "bronze", "30 points should earn bronze"),
            (74, "bronze", "74 points should still be bronze"),
            (75, "silver", "75 points should earn silver"),
            (149, "silver", "149 points should still be silver"),
            (150, "gold", "150 points should earn gold"),
            (299, "gold", "299 points should still be gold"),
            (300, "platinum", "300 points should earn platinum"),
            (499, "platinum", "499 points should still be platinum"),
            (500, "diamond", "500 points should earn diamond"),
        ]
        
        print("Medal threshold verification:")
        for points, expected_medal, description in test_cases:
            # Set monthly points
            reset_data = {
                "total_points": points,
                "monthly_points": points,
                "weekly_points": points,
                "clear_medals": True
            }
            admin_client.post(
                f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
                json=reset_data
            )
            
            # Award 1 point to trigger medal calculation
            report_data = {
                "location": {"lat": 52.5200, "lng": 13.4050},
                "image_url": "https://res.cloudinary.com/test/image/upload/medal_test.jpg"
            }
            admin_client.post(f"{BASE_URL}/api/trash/report", json=report_data)
            
            # Check medals
            verify_response = admin_client.get(f"{BASE_URL}/api/auth/me")
            verify_user = verify_response.json()
            medals = verify_user.get("medals", {})
            current_month = datetime.now().strftime("%Y-%m")
            month_medals = medals.get(current_month, [])
            
            if expected_medal:
                assert expected_medal in month_medals, f"{description}: expected {expected_medal} in {month_medals}"
                print(f"  ✓ {description}")
            else:
                # For 29 points, no medal should be earned
                assert len(month_medals) == 0 or "bronze" not in month_medals, f"{description}: should not have bronze"
                print(f"  ✓ {description}")
        
        # Restore original points
        restore_data = {
            "total_points": original_user.get("total_points", 0),
            "monthly_points": original_user.get("monthly_points", 0),
            "weekly_points": original_user.get("weekly_points", 0)
        }
        admin_client.post(
            f"{BASE_URL}/api/admin/users/{ADMIN_USER_ID}/reset-points",
            json=restore_data
        )


class TestAPIEndpointStatus:
    """Basic API endpoint status checks"""
    
    def test_api_root(self, api_client):
        """GET /api/ should return API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "UnTrash Berlin API"
        print(f"✓ API root endpoint working")
    
    def test_auth_me_with_token(self, admin_client):
        """GET /api/auth/me should return user with valid token"""
        response = admin_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        user = response.json()
        assert user.get("user_id") == ADMIN_USER_ID
        assert user.get("is_admin") == True
        print(f"✓ Auth endpoint working, admin user verified")
    
    def test_admin_users_list(self, admin_client):
        """GET /api/admin/users should return user list for admin"""
        response = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"✓ Admin users list returned {len(users)} users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
