from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)
from db import get_db, engine
from models import Dataset, Query, User
from stripe_webhook import router as stripe_router
from gemini_client import model
import pandas as pd
import numpy as np
import uuid
import json
from db import Base, engine
import models

app = FastAPI(title="AI SQL Assistant Backend")

app.include_router(stripe_router)

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_id = int(payload["sub"])
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

@app.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "is_pro": user.is_pro,
    }

@app.post("/auth/register")
def register(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"success": True}


@app.post("/auth/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
        },
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form("Untitled Dataset"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    table_name = f"dataset_{uuid.uuid4().hex[:8]}"

    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {e}")

    try:
        df.to_sql(
            table_name,
            engine,
            index=False,
            if_exists="fail",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create table: {e}")

    dataset = Dataset(
        user_id=user.id,
        name=name,
        table_name=table_name,
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return {
        "id": dataset.id,
        "name": dataset.name,
        "table_name": dataset.table_name,
    }

@app.get("/api/datasets/{dataset_id}/queries")
def get_query_history(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    queries = (
        db.query(Query)
        .filter(
            Query.dataset_id == dataset_id,
            Query.user_id == user.id,
        )
        .order_by(Query.created_at.desc())
        .all()
    )

    return [
        {
            "id": q.id,
            "question": q.question,
            "sql": q.sql,
            "created_at": q.created_at.isoformat(),
        }
        for q in queries
    ]
    
@app.post("/api/queries/{query_id}/replay")
def replay_query(
    query_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Query)
        .filter(Query.id == query_id, Query.user_id == user.id)
        .first()
    )

    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    df = pd.read_sql_query(q.sql, engine)

    return {
        "query_id": q.id,
        "sql": q.sql,
        "rows": df.to_dict(orient="records"),
    }

@app.get("/api/datasets")
def list_datasets(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == user.id)
        .order_by(Dataset.created_at.desc())
        .all()
    )

    return [
        {
            "id": d.id,
            "name": d.name,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in datasets
    ]

@app.get("/api/datasets/{dataset_id}")
def get_dataset(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.user_id == user.id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return {
        "id": dataset.id,
        "name": dataset.name,
        "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
    }


@app.delete("/api/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.user_id == user.id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        db.execute(text(f'DROP TABLE IF EXISTS "{dataset.table_name}"'))
        db.delete(dataset)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True}

@app.post("/api/datasets/{dataset_id}/ask")
async def ask_dataset(
    dataset_id: int,
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.user_id == user.id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    table_name = dataset.table_name

    
    try:
        sample_df = pd.read_sql_query(
            f'SELECT * FROM "{table_name}" LIMIT 5',
            engine,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read sample data: {e}",
        )

    schema_desc = ", ".join(
        f"{col} ({dtype})"
        for col, dtype in zip(sample_df.columns, sample_df.dtypes)
    )

    prompt = f"""
You are an expert PostgreSQL SQL generator.

Table name: "{table_name}"
Columns:
{schema_desc}

Rules:
- Only SELECT queries
- No DELETE, UPDATE, INSERT, DROP
- Cast date strings using ::DATE
- Use double quotes for identifiers

User question: "{question}"
"""

    gemini_resp = model.generate_content(prompt)

    sql = (
        gemini_resp.text
        .replace("```sql", "")
        .replace("```", "")
        .strip()
    )

    banned = ["delete ", "update ", "insert ", "drop ", "alter ", "truncate "]
    if any(b in sql.lower() for b in banned):
        raise HTTPException(status_code=400, detail="Unsafe SQL generated")

    try:
        df = pd.read_sql_query(sql, engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL error: {e}")

    analysis = {}
    if not df.empty:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            col = numeric_cols[0]
            analysis = {
                "rows": int(len(df)),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": float(df[col].mean()),
            }

    q = Query(
        dataset_id=dataset.id,
        user_id=user.id,
        question=question,
        sql=sql,
        result_json=json.loads(df.to_json(orient="records")),
    )

    db.add(q)
    db.commit()
    db.refresh(q)

    return {
        "query_id": q.id,
        "sql": sql,
        "rows": q.result_json,
        "analysis": analysis,
    }