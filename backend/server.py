from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import cloudinary
import cloudinary.utils
import time
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import base64
import io
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "UnTrash Berlin API", "version": "1.0.0", "status": "running"}

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    total_points: int = 0
    monthly_points: int = 0
    weekly_points: int = 0
    medals: Dict[str, List[str]] = Field(default_factory=dict)  # {"2025-01": ["bronze", "silver"]}
    joined_groups: List[str] = Field(default_factory=list)
    is_admin: bool = False  # Admin flag
    is_banned: bool = False  # Banned flag
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Location(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None

class TrashReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    report_id: str = Field(default_factory=lambda: f"trash_{uuid.uuid4().hex[:12]}")
    location: Location
    image_url: str
    thumbnail_url: Optional[str] = None
    status: str = "reported"  # reported, collected
    reporter_id: str
    collector_id: Optional[str] = None
    ai_verified: bool = False
    points_awarded: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    collected_at: Optional[datetime] = None

class AreaCleaning(BaseModel):
    model_config = ConfigDict(extra="ignore")
    area_id: str = Field(default_factory=lambda: f"area_{uuid.uuid4().hex[:12]}")
    user_id: str
    center_location: Location
    polygon_coords: List[List[float]]  # [[lat, lng], [lat, lng], ...]
    area_size: float  # in square meters
    image_url: str
    ai_verified: bool = False
    admin_approved: bool = False  # Admin verification required
    points_awarded: int = 0
    expires_at: datetime  # When green zone expires
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    group_id: str = Field(default_factory=lambda: f"group_{uuid.uuid4().hex[:12]}")
    name: str
    description: Optional[str] = None
    admin_ids: List[str]
    member_ids: List[str] = Field(default_factory=list)
    total_points: int = 0
    weekly_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str = Field(default_factory=lambda: f"event_{uuid.uuid4().hex[:12]}")
    group_id: str
    title: str
    description: Optional[str] = None
    location: Optional[Location] = None
    event_date: datetime
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPER FUNCTIONS ====================

async def get_user_from_session(request: Request) -> Optional[User]:
    """Extract and validate user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    # Check if user is banned
    if user_doc.get("is_banned", False):
        return None
    
    return User(**user_doc)

async def check_admin(user: User) -> bool:
    """Check if user is admin"""
    return user.is_admin if user else False

async def verify_trash_in_image(image_url: str) -> bool:
    """Use OpenAI Vision to verify trash in image"""
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"verify_{uuid.uuid4().hex[:8]}",
            system_message="You are an image verification assistant. Analyze images and determine if trash/litter is visible."
        ).with_model("openai", "gpt-5.2")
        
        # Download and convert image to base64
        import requests
        response = requests.get(image_url)
        img_data = response.content
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        image_content = ImageContent(image_base64=img_base64)
        user_message = UserMessage(
            text="Is there visible trash, litter, or waste in this image? Answer with just 'yes' or 'no'.",
            file_contents=[image_content]
        )
        
        result = await chat.send_message(user_message)
        return "yes" in result.lower()
    except Exception as e:
        logger.error(f"Error verifying image: {e}")
        return False

def calculate_medal_for_points(monthly_points: int) -> Optional[str]:
    """Calculate medal based on monthly points (adjusted for reduced point values)"""
    if monthly_points >= 500:
        return "diamond"
    elif monthly_points >= 300:
        return "platinum"
    elif monthly_points >= 150:
        return "gold"
    elif monthly_points >= 75:
        return "silver"
    elif monthly_points >= 30:
        return "bronze"
    return None

async def update_user_points(user_id: str, points: int):
    """Update user points and check for medals. Points cannot go below 0."""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        return
    
    # Calculate new points, ensuring they don't go negative
    new_total = max(0, user_doc.get("total_points", 0) + points)
    new_monthly = max(0, user_doc.get("monthly_points", 0) + points)
    new_weekly = max(0, user_doc.get("weekly_points", 0) + points)
    
    # Check for medal achievement based on monthly points
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    medals = user_doc.get("medals", {})
    new_medal = calculate_medal_for_points(new_monthly)
    
    if new_medal:
        if current_month not in medals:
            medals[current_month] = []
        if new_medal not in medals[current_month]:
            medals[current_month].append(new_medal)
    
    # Remove medals if points dropped below threshold (e.g., admin reset or point deduction)
    if current_month in medals:
        # Keep only medals that match current point level
        valid_medals = []
        medal_thresholds = [
            ("bronze", 30), ("silver", 75), ("gold", 150), 
            ("platinum", 300), ("diamond", 500)
        ]
        for medal, threshold in medal_thresholds:
            if new_monthly >= threshold and medal in medals[current_month]:
                valid_medals.append(medal)
        medals[current_month] = valid_medals
        if not medals[current_month]:
            del medals[current_month]
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "total_points": new_total,
            "monthly_points": new_monthly,
            "weekly_points": new_weekly,
            "medals": medals
        }}
    )

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/auth/session")
async def create_session(session_id: str, response: Response):
    """Exchange session_id for user data and create session"""
    try:
        import requests
        headers = {"X-Session-ID": session_id}
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers=headers
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        data = resp.json()
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            update_data = {
                "name": data["name"],
                "picture": data["picture"]
            }
            # Set admin flag for specific email
            if data["email"] == "stephanj.thurm@gmail.com":
                update_data["is_admin"] = True
            
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
        else:
            # Create new user
            user = User(
                user_id=user_id,
                email=data["email"],
                name=data["name"],
                picture=data["picture"],
                is_admin=(data["email"] == "stephanj.thurm@gmail.com")  # Set admin for your email
            )
            await db.users.insert_one(user.model_dump())
        
        # Create session
        session_token = data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            expires_at=expires_at
        )
        await db.user_sessions.insert_one(session.model_dump())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return user_doc
    
    except Exception as e:
        logger.error(f"Session creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ==================== CLOUDINARY ENDPOINTS ====================

@api_router.get("/cloudinary/signature")
async def generate_cloudinary_signature(
    request: Request,
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = "untrash"
):
    """Generate signed upload parameters for Cloudinary"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder,
        "resource_type": resource_type
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder,
        "resource_type": resource_type
    }

# ==================== IMAGE UPLOAD ENDPOINTS (BACKUP) ====================

@api_router.post("/images/upload")
async def upload_image_base64(request: Request, data: dict):
    """Upload image as base64 (simple storage solution)"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Get base64 image data
        image_data = data.get("image")
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # If it's a data URL, extract just the base64 part
        if image_data.startswith('data:'):
            image_data = image_data.split(',')[1]
        
        # Store in MongoDB (simple solution)
        image_doc = {
            "image_id": f"img_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "image_data": image_data,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.images.insert_one(image_doc)
        
        # Return URL that points to our image endpoint
        image_url = f"/api/images/{image_doc['image_id']}"
        
        return {
            "url": image_url,
            "image_id": image_doc['image_id']
        }
    except Exception as e:
        logger.error(f"Image upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/images/{image_id}")
async def get_image(image_id: str):
    """Retrieve image by ID"""
    image_doc = await db.images.find_one({"image_id": image_id}, {"_id": 0})
    if not image_doc:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Return image as base64 data URL
    image_data = image_doc['image_data']
    # Determine format (default to jpeg)
    data_url = f"data:image/jpeg;base64,{image_data}"
    
    return JSONResponse(content={"data_url": data_url})

# ==================== TRASH ENDPOINTS ====================

@api_router.post("/trash/report")
async def report_trash(request: Request, data: dict):
    """Report a new trash location"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify trash in image
    ai_verified = await verify_trash_in_image(data["image_url"])
    
    report = TrashReport(
        location=Location(**data["location"]),
        image_url=data["image_url"],
        thumbnail_url=data.get("thumbnail_url"),
        reporter_id=user.user_id,
        ai_verified=ai_verified,
        points_awarded=5  # Reduced from 10
    )
    
    await db.trash_reports.insert_one(report.model_dump())
    await update_user_points(user.user_id, 5)  # Reduced from 10
    
    return report

@api_router.post("/trash/collect/{report_id}")
async def collect_trash(request: Request, report_id: str, data: dict):
    """Mark trash as collected with proof photo (requires admin verification for points)"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    report = await db.trash_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report["status"] == "collected":
        raise HTTPException(status_code=400, detail="Already collected")
    
    # Verify trash is gone using AI
    ai_verified = not await verify_trash_in_image(data["proof_image_url"])
    
    # Points to be awarded after admin verification (reduced)
    points = 25 if ai_verified else 15  # Reduced from 50/30
    
    await db.trash_reports.update_one(
        {"report_id": report_id},
        {"$set": {
            "status": "collected",
            "collector_id": user.user_id,
            "collected_at": datetime.now(timezone.utc),
            "collection_image_url": data["proof_image_url"],
            "ai_verified": ai_verified,
            "admin_verified": False,
            "points_awarded": points,
            "points_given": False
        }}
    )
    
    return {
        "message": "Collection submitted for admin verification",
        "points_pending": points,
        "ai_verified": ai_verified
    }

@api_router.get("/trash/list")
async def list_trash_reports(
    status: Optional[str] = None,
    limit: int = 100,
    include_test: bool = False
):
    """Get list of trash reports (excludes test data by default)"""
    from datetime import timedelta
    
    # Calculate date 7 days ago
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Build query
    query = {}
    
    if status:
        query["status"] = status
    else:
        # Default: Show all reported trash + collected trash from last 7 days
        query = {
            "$or": [
                {"status": "reported"},
                {
                    "status": "collected",
                    "collected_at": {"$gte": week_ago}
                }
            ]
        }
    
    # Filter out test data (placeholder images, test URLs)
    if not include_test:
        query["image_url"] = {
            "$not": {"$regex": "(placeholder|test|via\\.placeholder|example\\.com)", "$options": "i"}
        }
    
    reports = await db.trash_reports.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return reports

@api_router.get("/trash/{report_id}")
async def get_trash_report(report_id: str):
    """Get specific trash report"""
    report = await db.trash_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

# ==================== AREA CLEANING ENDPOINTS ====================

@api_router.post("/areas/clean")
async def clean_area(request: Request, data: dict):
    """Mark an area as cleaned (requires admin approval for points)"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Calculate points based on area size (2 points per 100 sq meters, min 10)
    area_size = data.get("area_size", 100)
    points = max(10, int(area_size / 100 * 2))  # Reduced from 5 pts/100m², min 25
    
    # Area stays green for 7 days
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    area = AreaCleaning(
        user_id=user.user_id,
        center_location=Location(**data["center_location"]),
        polygon_coords=data["polygon_coords"],
        area_size=area_size,
        image_url=data["image_url"],
        points_awarded=points,
        expires_at=expires_at,
        ai_verified=False,
        admin_approved=False
    )
    
    await db.area_cleanings.insert_one(area.model_dump())
    
    return {
        "message": "Area submitted for admin approval",
        "area_id": area.area_id,
        "points_pending": points
    }

@api_router.get("/areas/active")
async def get_active_areas():
    """Get active cleaned areas (green zones) - only admin-approved"""
    now = datetime.now(timezone.utc)
    areas = await db.area_cleanings.find(
        {
            "expires_at": {"$gt": now},
            "admin_approved": True  # Only show approved areas
        },
        {"_id": 0}
    ).to_list(1000)
    return areas

# ==================== GROUP ENDPOINTS ====================

@api_router.post("/groups")
async def create_group(request: Request, data: dict):
    """Create a new group"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    group = Group(
        name=data["name"],
        description=data.get("description"),
        admin_ids=[user.user_id],
        member_ids=[user.user_id]
    )
    
    await db.groups.insert_one(group.model_dump())
    
    # Add group to user's joined groups
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$addToSet": {"joined_groups": group.group_id}}
    )
    
    return group

@api_router.get("/groups")
async def list_groups(limit: int = 50):
    """List all groups"""
    groups = await db.groups.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return groups

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str):
    """Get specific group"""
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@api_router.post("/groups/{group_id}/join")
async def join_group(request: Request, group_id: str):
    """Join a group"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if user.user_id in group.get("member_ids", []):
        raise HTTPException(status_code=400, detail="Already a member")
    
    await db.groups.update_one(
        {"group_id": group_id},
        {"$addToSet": {"member_ids": user.user_id}}
    )
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$addToSet": {"joined_groups": group_id}}
    )
    
    return {"message": "Joined successfully"}

@api_router.post("/groups/{group_id}/leave")
async def leave_group(request: Request, group_id: str):
    """Leave a group"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is the owner (first admin) - owners must delete group instead
    if group.get("admin_ids") and group["admin_ids"][0] == user.user_id:
        raise HTTPException(status_code=400, detail="Group owner cannot leave. Delete the group instead.")
    
    await db.groups.update_one(
        {"group_id": group_id},
        {"$pull": {"member_ids": user.user_id, "admin_ids": user.user_id}}
    )
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$pull": {"joined_groups": group_id}}
    )
    
    return {"message": "Left successfully"}

@api_router.delete("/groups/{group_id}")
async def delete_group(request: Request, group_id: str):
    """Delete a group (owner only)"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is the owner (first admin) or app admin
    is_owner = group.get("admin_ids") and group["admin_ids"][0] == user.user_id
    is_app_admin = user.is_admin
    
    if not (is_owner or is_app_admin):
        raise HTTPException(status_code=403, detail="Only the group owner can delete this group")
    
    # Remove group from all members' joined_groups
    member_ids = group.get("member_ids", [])
    if member_ids:
        await db.users.update_many(
            {"user_id": {"$in": member_ids}},
            {"$pull": {"joined_groups": group_id}}
        )
    
    # Delete all group events
    await db.group_events.delete_many({"group_id": group_id})
    
    # Delete the group
    await db.groups.delete_one({"group_id": group_id})
    
    return {"message": "Group deleted successfully"}

@api_router.get("/groups/{group_id}/members")
async def get_group_members(group_id: str):
    """Get group members"""
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    members = await db.users.find(
        {"user_id": {"$in": group.get("member_ids", [])}},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "total_points": 1}
    ).to_list(1000)
    
    return members

@api_router.post("/groups/{group_id}/events")
async def create_group_event(request: Request, group_id: str, data: dict):
    """Create a group event"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if user.user_id not in group.get("member_ids", []):
        raise HTTPException(status_code=403, detail="Not a group member")
    
    event = GroupEvent(
        group_id=group_id,
        title=data["title"],
        description=data.get("description"),
        location=Location(**data["location"]) if data.get("location") else None,
        event_date=datetime.fromisoformat(data["event_date"]),
        created_by=user.user_id
    )
    
    await db.group_events.insert_one(event.model_dump())
    
    # Send mock notifications to all group members
    for member_id in group.get("member_ids", []):
        if member_id != user.user_id:  # Don't notify the creator
            # Check if user wants notifications
            prefs = await db.notification_preferences.find_one({"user_id": member_id}, {"_id": 0})
            if prefs and prefs.get("notify_new_events", True):
                await send_mock_notification(
                    member_id,
                    "new_event",
                    f"New Event in {group['name']}",
                    f"{user.name} created a new event: '{event.title}' on {event.event_date.strftime('%B %d, %Y')}"
                )
    
    return event

@api_router.get("/groups/{group_id}/events")
async def get_group_events(group_id: str):
    """Get group events"""
    events = await db.group_events.find(
        {"group_id": group_id},
        {"_id": 0}
    ).sort("event_date", 1).to_list(100)
    return events

@api_router.delete("/groups/{group_id}/events/{event_id}")
async def delete_group_event(request: Request, group_id: str, event_id: str):
    """Delete a group event (admin, group admin, or event creator)"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    event = await db.group_events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    group = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is app admin, group admin, or event creator
    is_app_admin = user.is_admin
    is_group_admin = user.user_id in group.get("admin_ids", [])
    is_event_creator = user.user_id == event.get("created_by")
    
    if not (is_app_admin or is_group_admin or is_event_creator):
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    
    await db.group_events.delete_one({"event_id": event_id})
    return {"message": "Event deleted successfully"}

# ==================== RANKINGS ENDPOINTS ====================

@api_router.get("/rankings/weekly/users")
async def get_weekly_user_rankings(limit: int = 50):
    """Get weekly user rankings"""
    users = await db.users.find(
        {},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "weekly_points": 1}
    ).sort("weekly_points", -1).limit(limit).to_list(limit)
    return users

@api_router.get("/rankings/weekly/groups")
async def get_weekly_group_rankings(limit: int = 50):
    """Get weekly group rankings"""
    groups = await db.groups.find(
        {},
        {"_id": 0, "group_id": 1, "name": 1, "weekly_points": 1}
    ).sort("weekly_points", -1).limit(limit).to_list(limit)
    return groups

# ==================== HEATMAP ENDPOINTS ====================

@api_router.get("/heatmap/data")
async def get_heatmap_data():
    """Get heatmap data for trash density"""
    # Get all reported trash (high density)
    trash_reports = await db.trash_reports.find(
        {"status": "reported"},
        {"_id": 0, "location": 1}
    ).to_list(1000)
    
    # Get cleaned areas (low density)
    now = datetime.now(timezone.utc)
    cleaned_areas = await db.area_cleanings.find(
        {"expires_at": {"$gt": now}},
        {"_id": 0, "center_location": 1, "area_size": 1}
    ).to_list(1000)
    
    return {
        "trash_points": [{"lat": r["location"]["lat"], "lng": r["location"]["lng"], "intensity": 1.0} for r in trash_reports],
        "clean_areas": [{"lat": a["center_location"]["lat"], "lng": a["center_location"]["lng"], "intensity": -0.5} for a in cleaned_areas]
    }

# ==================== USER ENDPOINTS ====================

@api_router.get("/users/profile")
async def get_user_profile(request: Request):
    """Get current user profile with medals"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.get("/users/{user_id}")
async def get_user_by_id(user_id: str):
    """Get user by ID"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

# ==================== ADMIN ENDPOINTS ====================

@api_router.post("/admin/users/{user_id}/ban")
async def ban_user(request: Request, user_id: str):
    """Ban a user (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_banned": True}}
    )
    
    # Delete all sessions for banned user
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": f"User {user_id} has been banned"}

@api_router.post("/admin/users/{user_id}/unban")
async def unban_user(request: Request, user_id: str):
    """Unban a user (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_banned": False}}
    )
    
    return {"message": f"User {user_id} has been unbanned"}

@api_router.delete("/admin/trash/{report_id}")
async def delete_trash_report(request: Request, report_id: str):
    """Delete a trash report and deduct any awarded points (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = await db.trash_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    points_deducted = []
    
    # Helper to deduct points safely (never go below 0)
    async def safe_deduct_points(user_id: str, points: int):
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            return
        
        new_total = max(0, user_doc.get("total_points", 0) - points)
        new_monthly = max(0, user_doc.get("monthly_points", 0) - points)
        new_weekly = max(0, user_doc.get("weekly_points", 0) - points)
        
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "total_points": new_total,
                "monthly_points": new_monthly,
                "weekly_points": new_weekly
            }}
        )
    
    # Deduct reporter points (5 points for reporting - using new reduced value)
    if report.get("reporter_id"):
        reporter_id = report["reporter_id"]
        await safe_deduct_points(reporter_id, 5)
        points_deducted.append(f"Reporter {reporter_id}: -5 points")
    
    # Deduct collector points if collection was verified and points were given
    if report.get("collector_id") and report.get("points_given", False):
        collector_id = report["collector_id"]
        collector_points = report.get("points_awarded", 0)
        if collector_points > 0:
            await safe_deduct_points(collector_id, collector_points)
            points_deducted.append(f"Collector {collector_id}: -{collector_points} points")
            
            # Also deduct from groups (with floor at 0)
            collector_doc = await db.users.find_one({"user_id": collector_id}, {"_id": 0, "joined_groups": 1})
            if collector_doc and collector_doc.get("joined_groups"):
                for group_id in collector_doc["joined_groups"]:
                    group_doc = await db.groups.find_one({"group_id": group_id}, {"_id": 0})
                    if group_doc:
                        new_group_total = max(0, group_doc.get("total_points", 0) - collector_points)
                        new_group_weekly = max(0, group_doc.get("weekly_points", 0) - collector_points)
                        await db.groups.update_one(
                            {"group_id": group_id},
                            {"$set": {"total_points": new_group_total, "weekly_points": new_group_weekly}}
                        )
    
    await db.trash_reports.delete_one({"report_id": report_id})
    
    return {
        "message": f"Report {report_id} deleted",
        "points_deducted": points_deducted
    }

@api_router.post("/admin/users/{user_id}/reset-points")
async def reset_user_points(request: Request, user_id: str, data: dict = None):
    """Reset or adjust user points (admin only). Points cannot be negative. Medals auto-adjust to match points."""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get new values from request or default to 0, ensure non-negative
    data = data or {}
    new_total = max(0, int(data.get("total_points", 0)))
    new_monthly = max(0, int(data.get("monthly_points", 0)))
    new_weekly = max(0, int(data.get("weekly_points", 0)))
    clear_medals = data.get("clear_medals", False)
    
    # Calculate valid medals based on new monthly points
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    medals = target_user.get("medals", {})
    
    if clear_medals:
        medals = {}
    else:
        # Auto-adjust medals to match new monthly points
        medal_thresholds = [
            ("bronze", 30), ("silver", 75), ("gold", 150), 
            ("platinum", 300), ("diamond", 500)
        ]
        valid_medals = []
        for medal, threshold in medal_thresholds:
            if new_monthly >= threshold:
                valid_medals.append(medal)
        
        # Update current month's medals to match points
        if valid_medals:
            medals[current_month] = valid_medals
        elif current_month in medals:
            del medals[current_month]
    
    update_fields = {
        "total_points": new_total,
        "monthly_points": new_monthly,
        "weekly_points": new_weekly,
        "medals": medals
    }
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_fields}
    )
    
    return {
        "message": f"Points reset for user {user_id}",
        "new_points": {
            "total": new_total,
            "monthly": new_monthly,
            "weekly": new_weekly
        },
        "medals_cleared": clear_medals,
        "medals_adjusted": not clear_medals
    }
    }

@api_router.put("/admin/trash/{report_id}")
async def update_trash_report(request: Request, report_id: str, data: dict):
    """Update a trash report (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = await db.trash_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update allowed fields
    update_fields = {}
    if "status" in data:
        update_fields["status"] = data["status"]
    if "location" in data:
        update_fields["location"] = data["location"]
    if "image_url" in data:
        update_fields["image_url"] = data["image_url"]
    
    if update_fields:
        await db.trash_reports.update_one(
            {"report_id": report_id},
            {"$set": update_fields}
        )
    
    return {"message": f"Report {report_id} updated"}

@api_router.get("/admin/users")
async def list_all_users(request: Request, limit: int = 50):
    """List all users (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return users

@api_router.get("/admin/areas/pending")
async def list_pending_areas(request: Request):
    """List area cleanings pending approval (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    areas = await db.area_cleanings.find(
        {"admin_approved": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add user info
    for area in areas:
        user_doc = await db.users.find_one({"user_id": area["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        if user_doc:
            area["user_name"] = user_doc.get("name")
            area["user_email"] = user_doc.get("email")
    
    return areas

@api_router.post("/admin/areas/{area_id}/approve")
async def approve_area_cleaning(request: Request, area_id: str):
    """Approve area cleaning and award points (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    area = await db.area_cleanings.find_one({"area_id": area_id}, {"_id": 0})
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    if area.get("admin_approved"):
        raise HTTPException(status_code=400, detail="Area already approved")
    
    # Approve and award points
    await db.area_cleanings.update_one(
        {"area_id": area_id},
        {"$set": {"admin_approved": True, "ai_verified": True}}
    )
    
    # Award points to user
    await update_user_points(area["user_id"], area["points_awarded"])
    
    return {"message": "Area approved and points awarded", "points": area["points_awarded"]}

@api_router.delete("/admin/areas/{area_id}")
async def reject_area_cleaning(request: Request, area_id: str):
    """Reject/delete area cleaning (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    area = await db.area_cleanings.find_one({"area_id": area_id}, {"_id": 0})
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    await db.area_cleanings.delete_one({"area_id": area_id})
    
    return {"message": "Area cleaning rejected and deleted"}

@api_router.get("/admin/collections/pending")
async def list_pending_collections(request: Request):
    """List trash collections pending admin verification (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    collections = await db.trash_reports.find(
        {
            "status": "collected",
            "admin_verified": False
        },
        {"_id": 0}
    ).sort("collected_at", -1).to_list(100)
    
    # Add user info for collector
    for collection in collections:
        if collection.get("collector_id"):
            collector_doc = await db.users.find_one(
                {"user_id": collection["collector_id"]},
                {"_id": 0, "name": 1, "email": 1}
            )
            if collector_doc:
                collection["collector_name"] = collector_doc.get("name")
                collection["collector_email"] = collector_doc.get("email")
    
    return collections

@api_router.post("/admin/collections/{report_id}/approve")
async def approve_collection(request: Request, report_id: str):
    """Approve trash collection and award points (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = await db.trash_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.get("status") != "collected":
        raise HTTPException(status_code=400, detail="Report is not in collected status")
    
    if report.get("admin_verified"):
        raise HTTPException(status_code=400, detail="Collection already verified")
    
    # Mark as verified
    await db.trash_reports.update_one(
        {"report_id": report_id},
        {"$set": {"admin_verified": True, "points_given": True}}
    )
    
    # Award points to collector
    collector_id = report.get("collector_id")
    points = report.get("points_awarded", 30)
    
    if collector_id:
        await update_user_points(collector_id, points)
        
        # Update group points
        collector_doc = await db.users.find_one({"user_id": collector_id}, {"_id": 0, "joined_groups": 1})
        if collector_doc and collector_doc.get("joined_groups"):
            for group_id in collector_doc["joined_groups"]:
                await db.groups.update_one(
                    {"group_id": group_id},
                    {"$inc": {"total_points": points, "weekly_points": points}}
                )
    
    return {"message": "Collection approved and points awarded", "points": points}

@api_router.delete("/admin/collections/{report_id}")
async def reject_collection(request: Request, report_id: str):
    """Reject trash collection - revert to reported status (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = await db.trash_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.get("status") != "collected":
        raise HTTPException(status_code=400, detail="Report is not in collected status")
    
    # Revert to reported status
    await db.trash_reports.update_one(
        {"report_id": report_id},
        {
            "$set": {"status": "reported"},
            "$unset": {
                "collector_id": "",
                "collected_at": "",
                "collection_image_url": "",
                "ai_verified": "",
                "admin_verified": "",
                "points_awarded": "",
                "points_given": ""
            }
        }
    )
    
    return {"message": "Collection rejected - report reverted to 'reported' status"}

@api_router.get("/admin/pending-count")
async def get_pending_counts(request: Request):
    """Get counts of pending verifications for admin dashboard (admin only)"""
    user = await get_user_from_session(request)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pending_collections = await db.trash_reports.count_documents({
        "status": "collected",
        "admin_verified": False
    })
    
    pending_areas = await db.area_cleanings.count_documents({
        "admin_approved": False
    })
    
    return {
        "pending_collections": pending_collections,
        "pending_areas": pending_areas,
        "total_pending": pending_collections + pending_areas
    }

# ==================== STATS ENDPOINTS ====================

@api_router.get("/stats/weekly")
async def get_weekly_stats():
    """Get Berlin-wide weekly statistics"""
    from datetime import timedelta
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Count reports from this week
    reports_count = await db.trash_reports.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Count collections from this week
    collections_count = await db.trash_reports.count_documents({
        "status": "collected",
        "collected_at": {"$gte": week_ago}
    })
    
    return {
        "reports": reports_count,
        "collections": collections_count
    }

@api_router.get("/events/upcoming")
async def get_upcoming_events(request: Request, limit: int = 5):
    """Get upcoming events for user's groups"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user's groups
    user_groups = user.joined_groups or []
    
    if not user_groups:
        return []
    
    # Get upcoming events from user's groups
    now = datetime.now(timezone.utc)
    events = await db.group_events.find(
        {
            "group_id": {"$in": user_groups},
            "event_date": {"$gte": now}
        },
        {"_id": 0}
    ).sort("event_date", 1).limit(limit).to_list(limit)
    
    # Add group names to events
    for event in events:
        group = await db.groups.find_one({"group_id": event["group_id"]}, {"_id": 0, "name": 1})
        event["group_name"] = group.get("name", "Unknown") if group else "Unknown"
    
    return events

# ==================== NOTIFICATION ENDPOINTS ====================

class NotificationPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email_notifications: bool = True
    push_notifications: bool = False
    notify_new_events: bool = True
    notify_nearby_trash: bool = False
    notify_group_updates: bool = True

@api_router.get("/settings/notifications")
async def get_notification_settings(request: Request):
    """Get user notification preferences"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    prefs = await db.notification_preferences.find_one({"user_id": user.user_id}, {"_id": 0})
    if not prefs:
        # Create default preferences
        default_prefs = NotificationPreferences(user_id=user.user_id)
        await db.notification_preferences.insert_one(default_prefs.model_dump())
        return default_prefs
    
    return NotificationPreferences(**prefs)

@api_router.put("/settings/notifications")
async def update_notification_settings(request: Request, preferences: dict):
    """Update user notification preferences"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.notification_preferences.update_one(
        {"user_id": user.user_id},
        {"$set": preferences},
        upsert=True
    )
    
    return {"message": "Preferences updated"}

@api_router.get("/notifications/mock")
async def get_mock_notifications(request: Request, limit: int = 20):
    """Get mock notification log for testing"""
    user = await get_user_from_session(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    notifications = await db.mock_notifications.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications

async def send_mock_notification(user_id: str, notification_type: str, title: str, message: str):
    """Log a mock notification (simulates sending)"""
    notification = {
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "created_at": datetime.now(timezone.utc),
        "read": False
    }
    await db.mock_notifications.insert_one(notification)
    logger.info(f"Mock notification sent to {user_id}: {title}")

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
