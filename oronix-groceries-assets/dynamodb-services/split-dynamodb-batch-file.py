import os
import json

def split_dynamodb_batch_file(input_file, output_dir, batch_size=25):
    """
    Splits a DynamoDB batch-write JSON file into multiple subfiles,
    each containing up to `batch_size` PutRequest items.
    
    Parameters:
    - input_file: path to the original batch JSON file (e.g., oronix_items_ddb.json)
    - output_dir: directory where subfiles will be written
    - batch_size: maximum number of PutRequests per subfile
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Load the original batch file
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Expecting a single top-level key (table name)
    if len(data) != 1:
        raise ValueError("Input JSON must have exactly one top-level key (the table name).")
    
    table_name, put_requests = next(iter(data.items()))
    
    # Split into chunks
    for idx in range(0, len(put_requests), batch_size):
        chunk = put_requests[idx : idx + batch_size]
        subfile = os.path.join(output_dir, f"{table_name}_batch_{idx//batch_size:02d}.json")
        with open(subfile, 'w', encoding='utf-8') as out_f:
            json.dump({table_name: chunk}, out_f, indent=2, ensure_ascii=False)
        print(f"Created {subfile} with {len(chunk)} items")

if __name__ == "__main__":
    # Example usage:
    split_dynamodb_batch_file(
        input_file="../data-dynamodb/oronix_items_ddb.json",
        output_dir="../data-dynamodb/data-batches-items",
        batch_size=25
    )

# python split-dynamodb-batch-file.py
