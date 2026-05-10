"""add invite code and push subscriptions

Revision ID: 002_invite_push
Revises: 001_initial
Create Date: 2026-05-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision: str = "002_invite_push"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    id_as_text = "CAST(id AS TEXT)" if bind.dialect.name == "sqlite" else "id::text"

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "invite_code" not in user_columns:
        op.add_column("users", sa.Column("invite_code", sa.String(16), nullable=True))

    op.execute(
        f"""
        UPDATE users
        SET invite_code = 'NIRA' || substr(replace({id_as_text}, '-', ''), 1, 12)
        WHERE invite_code IS NULL
        """
    )

    if bind.dialect.name != "sqlite":
        op.alter_column("users", "invite_code", nullable=False)

    user_indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_invite_code" not in user_indexes:
        op.create_index("ix_users_invite_code", "users", ["invite_code"], unique=True)

    tables = set(inspector.get_table_names())
    if "push_subscriptions" not in tables:
        op.create_table(
            "push_subscriptions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", sa.String(128), nullable=False),
            sa.Column("openid", sa.String(128), nullable=True),
            sa.Column("subscribed", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("template_id", sa.String(128), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )

    push_indexes = {index["name"] for index in inspector.get_indexes("push_subscriptions")}
    if "ix_push_subscriptions_user_id" not in push_indexes:
        op.create_index("ix_push_subscriptions_user_id", "push_subscriptions", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_push_subscriptions_user_id", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_index("ix_users_invite_code", table_name="users")
    op.drop_column("users", "invite_code")
