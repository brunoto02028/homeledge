"""
HomeLedger Docling Document Processing Service
Extracts structured data from PDFs, images, and documents using IBM Docling.
Runs as a FastAPI microservice on port 3200.
"""

import os
import io
import json
import base64
import tempfile
import traceback
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat

app = FastAPI(title="HomeLedger Docling Service", version="1.0.0")

# Initialize converter once (expensive to create)
converter = None

def get_converter():
    global converter
    if converter is None:
        converter = DocumentConverter()
    return converter


@app.get("/health")
async def health():
    return {"status": "ok", "service": "docling", "timestamp": datetime.utcnow().isoformat()}


@app.post("/extract")
async def extract_document(
    file: Optional[UploadFile] = File(None),
    file_base64: Optional[str] = Form(None),
    file_name: Optional[str] = Form("document.pdf"),
    extract_tables: bool = Form(True),
    extract_images: bool = Form(False),
):
    """
    Extract structured text, tables, and metadata from a document.
    Accepts either a file upload or base64-encoded file content.
    """
    try:
        # Get file content
        if file:
            content = await file.read()
            file_name = file.filename or file_name
        elif file_base64:
            content = base64.b64decode(file_base64)
        else:
            raise HTTPException(status_code=400, detail="Either file or file_base64 is required")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        # Write to temp file (Docling needs a file path)
        suffix = os.path.splitext(file_name)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            conv = get_converter()
            result = conv.convert(tmp_path)
            doc = result.document

            # Extract full markdown text
            markdown_text = doc.export_to_markdown()

            # Extract plain text
            plain_text = ""
            for item in doc.iterate_items():
                element = item[1] if isinstance(item, tuple) else item
                if hasattr(element, 'text') and element.text:
                    plain_text += element.text + "\n"

            # Extract tables
            tables = []
            if extract_tables:
                for table_ix, table in enumerate(doc.tables):
                    table_data = {
                        "index": table_ix,
                        "markdown": table.export_to_markdown() if hasattr(table, 'export_to_markdown') else "",
                    }
                    # Try to get structured table data
                    if hasattr(table, 'export_to_dataframe'):
                        try:
                            df = table.export_to_dataframe()
                            table_data["headers"] = list(df.columns)
                            table_data["rows"] = df.values.tolist()
                            table_data["row_count"] = len(df)
                        except Exception:
                            pass
                    tables.append(table_data)

            # Build response
            response = {
                "success": True,
                "file_name": file_name,
                "file_size": len(content),
                "plain_text": plain_text.strip(),
                "markdown_text": markdown_text.strip(),
                "text_length": len(plain_text),
                "tables": tables,
                "table_count": len(tables),
                "page_count": getattr(doc, 'num_pages', None),
            }

            return JSONResponse(content=response)

        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__,
            }
        )


@app.post("/extract-bank-statement")
async def extract_bank_statement(
    file: Optional[UploadFile] = File(None),
    file_base64: Optional[str] = Form(None),
    file_name: Optional[str] = Form("statement.pdf"),
):
    """
    Specialized endpoint for bank statement extraction.
    Returns structured text optimized for transaction parsing.
    """
    try:
        if file:
            content = await file.read()
            file_name = file.filename or file_name
        elif file_base64:
            content = base64.b64decode(file_base64)
        else:
            raise HTTPException(status_code=400, detail="Either file or file_base64 is required")

        suffix = os.path.splitext(file_name)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            conv = get_converter()
            result = conv.convert(tmp_path)
            doc = result.document

            plain_text = ""
            for item in doc.iterate_items():
                element = item[1] if isinstance(item, tuple) else item
                if hasattr(element, 'text') and element.text:
                    plain_text += element.text + "\n"

            # Extract tables (bank statements often have transaction tables)
            tables_md = []
            tables_data = []
            for table in doc.tables:
                if hasattr(table, 'export_to_markdown'):
                    tables_md.append(table.export_to_markdown())
                if hasattr(table, 'export_to_dataframe'):
                    try:
                        df = table.export_to_dataframe()
                        tables_data.append({
                            "headers": list(df.columns),
                            "rows": df.values.tolist(),
                        })
                    except Exception:
                        pass

            return JSONResponse(content={
                "success": True,
                "file_name": file_name,
                "plain_text": plain_text.strip(),
                "tables_markdown": tables_md,
                "tables_structured": tables_data,
                "table_count": len(tables_md),
                "text_length": len(plain_text),
            })

        finally:
            os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


@app.post("/extract-invoice")
async def extract_invoice(
    file: Optional[UploadFile] = File(None),
    file_base64: Optional[str] = Form(None),
    file_name: Optional[str] = Form("invoice.pdf"),
):
    """
    Specialized endpoint for invoice extraction.
    Returns structured text and tables for invoice parsing.
    """
    try:
        if file:
            content = await file.read()
            file_name = file.filename or file_name
        elif file_base64:
            content = base64.b64decode(file_base64)
        else:
            raise HTTPException(status_code=400, detail="Either file or file_base64 is required")

        suffix = os.path.splitext(file_name)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            conv = get_converter()
            result = conv.convert(tmp_path)
            doc = result.document

            markdown_text = doc.export_to_markdown()
            plain_text = ""
            for item in doc.iterate_items():
                element = item[1] if isinstance(item, tuple) else item
                if hasattr(element, 'text') and element.text:
                    plain_text += element.text + "\n"

            tables = []
            for table in doc.tables:
                table_info = {}
                if hasattr(table, 'export_to_markdown'):
                    table_info["markdown"] = table.export_to_markdown()
                if hasattr(table, 'export_to_dataframe'):
                    try:
                        df = table.export_to_dataframe()
                        table_info["headers"] = list(df.columns)
                        table_info["rows"] = df.values.tolist()
                    except Exception:
                        pass
                tables.append(table_info)

            return JSONResponse(content={
                "success": True,
                "file_name": file_name,
                "plain_text": plain_text.strip(),
                "markdown_text": markdown_text.strip(),
                "tables": tables,
                "table_count": len(tables),
                "text_length": len(plain_text),
            })

        finally:
            os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


if __name__ == "__main__":
    port = int(os.environ.get("DOCLING_PORT", 3200))
    print(f"Starting Docling service on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
