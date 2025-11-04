#!/bin/bash

# Next Level Real Estate - System Integration Test
# Tests all infrastructure components and API Gateway

set -e

echo "=================================================="
echo "Next Level Real Estate - System Integration Test"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "1. Testing Docker Infrastructure Services"
echo "==========================================="

# Test MongoDB
echo -n "  MongoDB (port 27017)... "
docker exec nlre-mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1
test_result $? "MongoDB is accessible and responding"

# Test Redis
echo -n "  Redis (port 6379)... "
docker exec nlre-redis redis-cli ping > /dev/null 2>&1
test_result $? "Redis is accessible and responding"

# Test Qdrant
echo -n "  Qdrant (port 6333)... "
curl -s http://localhost:6333/healthz > /dev/null 2>&1
test_result $? "Qdrant is accessible and responding"

# Test Kafka
echo -n "  Kafka (port 9092)... "
docker exec nlre-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1
test_result $? "Kafka is accessible and responding"

echo ""
echo "2. Testing Database Initialization"
echo "===================================="

# Test MongoDB Collections
echo -n "  MongoDB collections... "
COLLECTIONS=$(docker exec nlre-mongodb mongosh next_level_real_estate --eval "db.getCollectionNames()" --quiet)
if echo "$COLLECTIONS" | grep -q "leads" && echo "$COLLECTIONS" | grep -q "campaigns"; then
    test_result 0 "MongoDB collections created (leads, campaigns, calls, etc.)"
else
    test_result 1 "MongoDB collections missing"
fi

# Test Qdrant Collections
echo -n "  Qdrant collections... "
QDRANT_COLLECTIONS=$(curl -s http://localhost:6333/collections | grep -c '"name"')
if [ "$QDRANT_COLLECTIONS" -ge 6 ]; then
    test_result 0 "Qdrant has $QDRANT_COLLECTIONS vector collections"
else
    test_result 1 "Expected 6 Qdrant collections, found $QDRANT_COLLECTIONS"
fi

echo ""
echo "3. Testing API Gateway"
echo "======================="

# Test Health Endpoint
echo -n "  Health endpoint... "
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    test_result 0 "API Gateway health check passed"
else
    test_result 1 "API Gateway health check failed"
fi

# Test Liveness Endpoint
echo -n "  Liveness endpoint... "
LIVE_RESPONSE=$(curl -s http://localhost:3000/health/live)
if echo "$LIVE_RESPONSE" | grep -q '"alive":true'; then
    test_result 0 "API Gateway liveness check passed"
else
    test_result 1 "API Gateway liveness check failed"
fi

# Test Readiness Endpoint
echo -n "  Readiness endpoint... "
READY_RESPONSE=$(curl -s http://localhost:3000/health/ready)
if echo "$READY_RESPONSE" | grep -q '"ready":true'; then
    test_result 0 "API Gateway readiness check passed"
else
    test_result 1 "API Gateway readiness check failed"
fi

echo ""
echo "4. Testing Database Connectivity"
echo "=================================="

# Test MongoDB Write/Read
echo -n "  MongoDB write/read... "
TEST_DOC_ID="test-$(date +%s)"
docker exec nlre-mongodb mongosh next_level_real_estate --eval "db.test_collection.insertOne({_id: '$TEST_DOC_ID', test: true})" --quiet > /dev/null 2>&1
FIND_RESULT=$(docker exec nlre-mongodb mongosh next_level_real_estate --eval "db.test_collection.findOne({_id: '$TEST_DOC_ID'})" --quiet)
docker exec nlre-mongodb mongosh next_level_real_estate --eval "db.test_collection.deleteOne({_id: '$TEST_DOC_ID'})" --quiet > /dev/null 2>&1
if echo "$FIND_RESULT" | grep -q "test: true"; then
    test_result 0 "MongoDB write and read operations work"
else
    test_result 1 "MongoDB write/read test failed"
fi

# Test Redis Write/Read
echo -n "  Redis write/read... "
docker exec nlre-redis redis-cli SET test_key "test_value" > /dev/null 2>&1
REDIS_VALUE=$(docker exec nlre-redis redis-cli GET test_key)
docker exec nlre-redis redis-cli DEL test_key > /dev/null 2>&1
if [ "$REDIS_VALUE" = "test_value" ]; then
    test_result 0 "Redis write and read operations work"
else
    test_result 1 "Redis write/read test failed"
fi

echo ""
echo "5. System Resource Usage"
echo "========================="

# Docker stats
echo "  Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" nlre-mongodb nlre-redis nlre-qdrant nlre-kafka nlre-zookeeper | head -6

echo ""
echo "=================================================="
echo "TEST SUMMARY"
echo "=================================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    echo ""
    echo "Some tests failed. Please check the output above for details."
    exit 1
else
    echo -e "${YELLOW}Tests Failed: 0${NC}"
    echo ""
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Your Next Level Real Estate development environment is fully operational!"
    echo ""
    echo "Running Services:"
    echo "  • API Gateway:  http://localhost:3000"
    echo "  • MongoDB:      mongodb://localhost:27017"
    echo "  • Qdrant:       http://localhost:6333"
    echo "  • Redis:        redis://localhost:6379"
    echo "  • Kafka:        localhost:9092"
    echo ""
    echo "Next Steps:"
    echo "  1. Review LOCAL_SETUP_GUIDE.md for service startup commands"
    echo "  2. Configure API keys in .env for full functionality"
    echo "  3. Start Lead Service: cd services/lead-service && npm run dev"
    echo "  4. Start Calling Service: cd services/calling-service && npm run dev"
    exit 0
fi
