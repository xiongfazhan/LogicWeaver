"""Script to export OpenAPI specification to JSON file."""

import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

def export_openapi():
    """Export OpenAPI specification to JSON file."""
    openapi_schema = app.openapi()
    
    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), "openapi.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    
    print(f"OpenAPI specification exported to: {output_path}")
    print(f"Total endpoints: {len(openapi_schema.get('paths', {}))}")
    
    # Print summary of endpoints
    print("\nAPI Endpoints:")
    for path, methods in openapi_schema.get("paths", {}).items():
        for method in methods.keys():
            if method.upper() in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                print(f"  {method.upper():6} {path}")

if __name__ == "__main__":
    export_openapi()
