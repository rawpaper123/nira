"""initial tables

Revision ID: 001_initial
Revises:
Create Date: 2026-04-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("openid", sa.String(128), unique=True, nullable=False, index=True),
        sa.Column("nickname", sa.String(64), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("city", sa.String(64), nullable=True),
        sa.Column("age", sa.Integer, nullable=True),
        sa.Column("gender", sa.String(10), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("interests", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("activity_types", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("availability", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("personality_tags", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("embedding_vector", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_a_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_b_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("simulation_result", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("compatibility_detail", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("week_number", sa.Integer, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_matches_week", "matches", ["week_number", "status"])

    op.create_table(
        "activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("match_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("activity_type", sa.String(64), nullable=False),
        sa.Column("location", sa.String(256), nullable=True),
        sa.Column("suggested_time", sa.String(128), nullable=True),
        sa.Column("poster_url", sa.String(512), nullable=True),
        sa.Column("chat_group_url", sa.String(512), nullable=True),
        sa.Column("plan_detail", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("status", sa.String(20), nullable=False, server_default="planned"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "feedbacks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("match_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("feedbacks")
    op.drop_table("activities")
    op.drop_index("ix_matches_week", table_name="matches")
    op.drop_table("matches")
    op.drop_table("user_profiles")
    op.drop_table("users")
