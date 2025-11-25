from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from app.models.user import User
from app.core.security import get_password_hash


async def get_user(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user by ID"""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[User]:
    """Get all users with optional filtering"""
    query = select(User)
    
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    role: str = "user",
    phone: Optional[str] = None,
    emergency_contact_name: Optional[str] = None,
    emergency_contact_phone: Optional[str] = None,
    is_initial_admin: bool = False
) -> User:
    """Create a new user"""
    hashed_password = get_password_hash(password)
    
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        role=role,
        phone=phone,
        emergency_contact_name=emergency_contact_name,
        emergency_contact_phone=emergency_contact_phone,
        is_initial_admin=is_initial_admin,
        is_active=True
    )
    db.add(db_user)
    await db.flush()
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user(
    db: AsyncSession,
    user_id: UUID,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    phone: Optional[str] = None,
    emergency_contact_name: Optional[str] = None,
    emergency_contact_phone: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Optional[User]:
    """Update a user"""
    db_user = await get_user(db, user_id)
    if not db_user:
        return None
    
    if full_name is not None:
        db_user.full_name = full_name
    if role is not None:
        db_user.role = role
    if phone is not None:
        db_user.phone = phone
    if emergency_contact_name is not None:
        db_user.emergency_contact_name = emergency_contact_name
    if emergency_contact_phone is not None:
        db_user.emergency_contact_phone = emergency_contact_phone
    if is_active is not None:
        db_user.is_active = is_active
    
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user_password(
    db: AsyncSession,
    user_id: UUID,
    new_password: str
) -> Optional[User]:
    """Update a user's password"""
    db_user = await get_user(db, user_id)
    if not db_user:
        return None
    
    db_user.hashed_password = get_password_hash(new_password)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def delete_user(db: AsyncSession, user_id: UUID) -> bool:
    """Delete a user"""
    db_user = await get_user(db, user_id)
    if not db_user:
        return False
    
    await db.delete(db_user)
    await db.commit()
    return True
