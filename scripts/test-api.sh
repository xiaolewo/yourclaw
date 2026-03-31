#!/bin/bash
# End-to-end API test for YourClaw /claw/* endpoints
# Usage: ./scripts/test-api.sh [BASE_URL]
# Example: ./scripts/test-api.sh https://ai.example.com

set -e
BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "========================================"
echo "  YourClaw API Test"
echo "  Server: $BASE"
echo "========================================"

test_endpoint() {
  local method=$1
  local path=$2
  local data=$3
  local expect=$4
  local desc=$5

  if [ "$method" = "GET" ]; then
    STATUS=$(curl -s -o /tmp/yc-test-body -w "%{http_code}" "$BASE$path" -H "Content-Type: application/json" ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
  else
    STATUS=$(curl -s -o /tmp/yc-test-body -w "%{http_code}" -X "$method" "$BASE$path" -H "Content-Type: application/json" ${TOKEN:+-H "Authorization: Bearer $TOKEN"} -d "$data")
  fi

  BODY=$(cat /tmp/yc-test-body)

  if [ "$STATUS" = "$expect" ]; then
    echo "  PASS  $method $path -> $STATUS"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $method $path -> $STATUS (expected $expect)"
    echo "        Body: $(echo "$BODY" | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "--- Public endpoints ---"
test_endpoint GET "/claw/auth/config" "" "200" "Auth config"

echo ""
echo "--- Login (email) ---"
test_endpoint POST "/claw/auth/login" '{"type":"email","email":"test@test.com","password":"wrong"}' "400" "Wrong password should 400"

echo ""
echo "--- Protected endpoints (no token) ---"
test_endpoint GET "/claw/models" "" "401" "Models without token"
test_endpoint GET "/claw/user/info" "" "401" "User info without token"

echo ""
echo "--- Heartbeat ---"
test_endpoint POST "/claw/heartbeat" '{"licenseKey":"YPRO-TEST-0000"}' "200" "Heartbeat"

echo ""
echo "--- OpenAI compat (no token) ---"
test_endpoint POST "/v1/chat/completions" '{"model":"test","messages":[{"role":"user","content":"hi"}]}' "401" "Chat without token"

echo ""
echo "========================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================"

rm -f /tmp/yc-test-body
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
