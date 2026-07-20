from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.tree import (
    TreeCreateRequest, TreeCreateResponse, TreeInfoResponse,
    TreeMemberInviteRequest, TreeMemberUpdateRequest, TreeMembersResponse,
)
from app.schemas.common import DataResponse
from app.services.tree_service import TreeService

router = APIRouter(prefix="/trees", tags=["Trees"])


@router.post("", response_model=DataResponse[TreeCreateResponse])
def create_tree(request: TreeCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    result = service.create_tree(name=request.name, user=user)
    return DataResponse(data=TreeCreateResponse(id=result["id"], name=result["name"]))


@router.get("", response_model=DataResponse[dict])
def list_trees(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    trees = service.get_user_trees(user)
    return DataResponse(data={"items": trees})


@router.get("/{tree_id}/structure", response_model=DataResponse[dict])
def get_tree_structure(tree_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    result = service.get_tree_structure(tree_id, user)
    return DataResponse(data=result)


@router.get("/{tree_id}", response_model=DataResponse[TreeInfoResponse])
def get_tree(tree_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    result = service.get_tree_info(tree_id, user)
    return DataResponse(data=TreeInfoResponse(name=result["name"], createdBy=result["createdBy"]))


@router.get("/{tree_id}/humans", response_model=DataResponse[dict])
def list_tree_humans(
    tree_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(None),
    first_name: str | None = Query(None),
    second_name: str | None = Query(None),
    gender: str | None = Query(None),
    place_of_birth: str | None = Query(None),
    country: str | None = Query(None),
    limit: int | None = Query(None),
    offset: int | None = Query(None),
):
    service = TreeService(db)
    result = service.get_tree_humans(tree_id, user, search=search, first_name=first_name,
                                     second_name=second_name, gender=gender,
                                     place_of_birth=place_of_birth, country=country,
                                     limit=limit, offset=offset)
    return DataResponse(data=result)


@router.patch("/{tree_id}", response_model=DataResponse[TreeCreateResponse])
def update_tree(tree_id: int, request: TreeCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    result = service.update_tree(tree_id, user, name=request.name)
    return DataResponse(data=TreeCreateResponse(id=result["id"], name=result["name"]))


@router.delete("/{tree_id}")
def delete_tree(tree_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    service.delete_tree(tree_id, user)
    return DataResponse(data={"success": True})


@router.get("/{tree_id}/filter-values", response_model=DataResponse[dict])
def get_tree_filter_values(tree_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    result = service.get_filter_values(tree_id, user)
    return DataResponse(data=result)


@router.get("/{tree_id}/users", response_model=DataResponse[TreeMembersResponse])
def list_tree_users(tree_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TreeService(db)
    result = service.list_members(tree_id, user)
    return DataResponse(data=TreeMembersResponse(items=result["items"]))


@router.post("/{tree_id}/users", response_model=DataResponse[dict])
def invite_tree_user(
    tree_id: int,
    request: TreeMemberInviteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TreeService(db)
    result = service.invite_member(tree_id, user, login=request.login, user_id=request.userId, role_name=request.role)
    return DataResponse(data=result)


@router.patch("/{tree_id}/users/{target_user_id}", response_model=DataResponse[dict])
def update_tree_user_role(
    tree_id: int,
    target_user_id: int,
    request: TreeMemberUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TreeService(db)
    result = service.update_member_role(tree_id, user, target_user_id, role_name=request.role)
    return DataResponse(data=result)


@router.delete("/{tree_id}/users/me")
def leave_tree(
    tree_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TreeService(db)
    service.leave_tree(tree_id, user)
    return DataResponse(data={"success": True})


@router.delete("/{tree_id}/users/{target_user_id}")
def remove_tree_user(
    tree_id: int,
    target_user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TreeService(db)
    service.remove_member(tree_id, user, target_user_id)
    return DataResponse(data={"success": True})


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{tree_id}/photo", response_model=DataResponse[dict])
async def upload_tree_photo(
    tree_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TreeService(db)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"tree_{tree_id}_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    service.update_tree(tree_id, user, photo=filename)
    return DataResponse(data={"photo": filename})
