"""测试模板初始化"""
import asyncio
import traceback
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:postgres123@192.168.31.71:5432/sop_architect"

async def test_init():
    from app.services.template import init_preset_templates
    from app.models import Workflow, Task, WorkflowStep
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            result = await init_preset_templates(session)
            print(f"Result: {result}")
    except Exception as e:
        traceback.print_exc()
        with open("init_error.txt", "w") as f:
            f.write(traceback.format_exc())

asyncio.run(test_init())
