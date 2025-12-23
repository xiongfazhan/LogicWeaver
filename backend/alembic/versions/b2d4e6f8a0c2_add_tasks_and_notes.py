"""Add tasks and step_notes tables

Revision ID: b2d4e6f8a0c2
Revises: afc6c85d43ae
Create Date: 2024-12-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2d4e6f8a0c2'
down_revision: Union[str, None] = 'afc6c85d43ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 修改 workflows 表
    # 添加新列
    op.add_column('workflows', sa.Column('is_template', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('workflows', sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # 添加自引用外键
    op.create_foreign_key(
        'fk_workflows_template_id',
        'workflows', 'workflows',
        ['template_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # 删除旧的状态约束，添加新的
    op.drop_constraint('ck_workflow_status', 'workflows', type_='check')
    op.create_check_constraint(
        'ck_workflow_status',
        'workflows',
        "status IN ('draft', 'worker_done', 'expert_done', 'analyzed', 'confirmed', 'delivered')"
    )
    
    # 2. 创建 tasks 表
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('task_order', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('workflow_id', 'task_order', name='uq_workflow_task_order'),
        sa.CheckConstraint("status IN ('pending', 'completed')", name='ck_task_status'),
    )
    
    # 3. 修改 workflow_steps 表，添加 task_id 和 expert_notes
    op.add_column('workflow_steps', sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('workflow_steps', sa.Column('expert_notes', sa.Text(), nullable=True))
    
    op.create_foreign_key(
        'fk_workflow_steps_task_id',
        'workflow_steps', 'tasks',
        ['task_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # 4. 创建 step_notes 表
    op.create_table(
        'step_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('step_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflow_steps.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content_type', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('voice_transcript', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(20), nullable=True, server_default='worker'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.CheckConstraint("content_type IN ('image', 'voice', 'video', 'text')", name='ck_note_content_type'),
        sa.CheckConstraint("created_by IN ('worker', 'expert')", name='ck_note_created_by'),
    )


def downgrade() -> None:
    # Drop step_notes table
    op.drop_table('step_notes')
    
    # Remove task_id and expert_notes from workflow_steps
    op.drop_constraint('fk_workflow_steps_task_id', 'workflow_steps', type_='foreignkey')
    op.drop_column('workflow_steps', 'task_id')
    op.drop_column('workflow_steps', 'expert_notes')
    
    # Drop tasks table
    op.drop_table('tasks')
    
    # Restore workflows table
    op.drop_constraint('fk_workflows_template_id', 'workflows', type_='foreignkey')
    op.drop_column('workflows', 'template_id')
    op.drop_column('workflows', 'is_template')
    
    # Restore old status constraint
    op.drop_constraint('ck_workflow_status', 'workflows', type_='check')
    op.create_check_constraint(
        'ck_workflow_status',
        'workflows',
        "status IN ('draft', 'deployed')"
    )
