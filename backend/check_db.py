"""检查模板是否已创建"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:postgres123@192.168.31.71:5432/sop_architect"

async def check_templates():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT id, name, is_template FROM workflows WHERE is_template = true
        """))
        templates = result.fetchall()
        
        with open("templates_result.txt", "w") as f:
            f.write(f"Found {len(templates)} templates:\n")
            for t in templates:
                f.write(f"  - {t[1]} (id: {t[0]})\n")
        
        print(f"Found {len(templates)} templates")
        for t in templates:
            print(f"  - {t[1]}")

asyncio.run(check_templates())
