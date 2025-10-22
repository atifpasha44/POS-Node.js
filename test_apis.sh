#!/bin/bash
echo "=== POS Database API Validation Test ==="
echo "Testing all key APIs used by ItemMaster form..."
echo ""

echo "1. Testing Tax Structure API:"
curl -s http://localhost:3001/api/tax-structure | python -c "import sys, json; data = json.load(sys.stdin); print(f'Success: {data[\"success\"]}, Count: {len(data[\"data\"])}')" 2>/dev/null || echo "Failed"
echo ""

echo "2. Testing UOM (Units) API:"
curl -s http://localhost:3001/api/uom | python -c "import sys, json; data = json.load(sys.stdin); print(f'Success: {data[\"success\"]}, Count: {len(data[\"data\"])}')" 2>/dev/null || echo "Failed"
echo ""

echo "3. Testing Item Categories API:"
curl -s http://localhost:3001/api/item-categories | python -c "import sys, json; data = json.load(sys.stdin); print(f'Success: {data[\"success\"]}, Count: {len(data[\"data\"])}')" 2>/dev/null || echo "Failed"
echo ""

echo "4. Testing Item Departments API:"
curl -s http://localhost:3001/api/item-departments | python -c "import sys, json; data = json.load(sys.stdin); print(f'Success: {data[\"success\"]}, Count: {len(data[\"data\"])}')" 2>/dev/null || echo "Failed"
echo ""

echo "5. Testing Outlet Setup API:"
curl -s http://localhost:3001/api/outlet-setup | python -c "import sys, json; data = json.load(sys.stdin); print(f'Success: {data[\"success\"]}, Count: {len(data[\"data\"])}')" 2>/dev/null || echo "Failed"
echo ""

echo "=== Sample Data Check ==="
echo "Tax Structure sample:"
curl -s http://localhost:3001/api/tax-structure | python -c "import sys, json; data = json.load(sys.stdin); [print(f'  {item[\"tax_structure_code\"]}: {item[\"tax_structure_name\"]}') for item in data['data'][:3]]" 2>/dev/null || echo "Failed to get sample"
echo ""

echo "UOM sample:"
curl -s http://localhost:3001/api/uom | python -c "import sys, json; data = json.load(sys.stdin); [print(f'  {item[\"uom_code\"]}: {item[\"uom_name\"]}') for item in data['data'][:3]]" 2>/dev/null || echo "Failed to get sample"
echo ""

echo "=== Test Complete ==="