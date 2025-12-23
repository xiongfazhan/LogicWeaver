"""诊断模板 API 错误"""
import asyncio
import traceback
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, selectinload
from sqlalchemy import select

DATABASE_URL = "postgresql+asyncpg://postgres:postgres123@192.168.31.71:5432/sop_architect"

async def diagnose():
    # 导入模型
    import sys
    sys.path.insert(0, '.')
    from app.models import Workflow, Task, WorkflowStep
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    output = []
    
    try:
        async with async_session() as db:
            # 1. 检查 is_template 字段
            result = await db.execute(text("""
                SELECT id, name, is_template FROM workflows WHERE is_template = true
            """))
            templates_raw = result.fetchall()
            output.append(f"Raw templates (is_template=true): {len(templates_raw)}")
            for t in templates_raw:
                output.append(f"  - {t[1]} (id: {t[0]}, is_template: {t[2]})")
            
            # 2. 尝试 ORM 查询
            output.append("\nTrying ORM query...")
            try:
                result = await db.execute(
                    select(Workflow)
                    .where(Workflow.is_template == True)
                    .options(selectinload(Workflow.tasks).selectinload(Task.steps))
                )
                workflows = list(result.scalars().all())
                output.append(f"ORM query returned: {len(workflows)} workflows")
                
                # 3. 尝试序列化
                for w in workflows:
                    output.append(f"\nWorkflow: {w.name}")
                    output.append(f"  id: {w.id}")
                    output.append(f"  is_template: {w.is_template}")
                    output.append(f"  tasks: {w.tasks}")
                    if w.tasks:
                        for t in w.tasks:
                            output.append(f"    Task: {t.name}")
                            output.append(f"      steps: {t.steps}")
                            if t.steps:
                                output.append(f"      steps count: {len(t.steps)}")
                            
            except Exception as e:
                output.append(f"ORM query error: {e}")
                output.append(traceback.format_exc())
                
    except Exception as e:
        output.append(f"Error: {e}")
        output.append(traceback.format_exc())
    
    # 写入文件
    result_text = "\n".join(output)
    with open("diagnose_result.txt", "w", encoding="utf-8") as f:
        f.write(result_text)
    print(result_text)

asyncio.run(diagnose())
