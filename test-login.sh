#!/bin/bash

echo "========================================"
echo "🔍 HydrateMate Login Test"
echo "========================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Backend Health Check..."
curl -s http://localhost:3000/health | jq . || echo "❌ Backend nicht erreichbar!"
echo ""

# Test 2: Existing User Login
echo "2️⃣ Login Test mit existierendem User..."
echo "   Email: dorian@test.com"
echo "   Passwort: test123"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dorian@test.com",
    "password": "test123"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ Login erfolgreich!"
  echo "$BODY" | jq .
else
  echo "❌ Login fehlgeschlagen! HTTP Status: $HTTP_STATUS"
  echo "$BODY"
fi

echo ""
echo "========================================"
echo "📋 Zusammenfassung:"
echo "========================================"
echo ""
echo "✅ Backend läuft auf: http://localhost:3000"
echo "✅ Login-Endpoint: POST /api/auth/login"
echo "✅ Test-User:"
echo "   - Email: dorian@test.com"
echo "   - Passwort: test123"
echo ""
echo "💡 Tipp: Verwende diese Credentials im Frontend!"
echo ""
