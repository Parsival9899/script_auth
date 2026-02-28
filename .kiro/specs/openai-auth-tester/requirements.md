# Requirements: OpenAI Auth Tester

## 1. Overview
An automated Node.js testing tool that simulates the OpenAI authentication signup flow using phone numbers. The tool will send registration requests and trigger OTP generation for testing purposes.

## 2. User Stories

### 2.1 As a tester, I want to automate phone number registration
**Acceptance Criteria:**
- Script accepts a list of phone numbers as input
- Sends POST requests to OpenAI's auth API endpoint
- Properly formats phone number data in request payload
- Handles API responses appropriately

### 2.2 As a tester, I want to bypass anti-bot protections
**Acceptance Criteria:**
- Generates or bypasses Sentinel tokens
- Handles Cloudflare protection tokens
- Manages CSRF tokens correctly
- Simulates realistic browser fingerprints
- Maintains valid session cookies

### 2.3 As a tester, I want to run concurrent tests
**Acceptance Criteria:**
- Supports configurable concurrency level
- Manages multiple independent sessions simultaneously
- Each session has isolated cookie storage
- Handles rate limiting gracefully

### 2.4 As a tester, I want detailed logging and analysis
**Acceptance Criteria:**
- Logs all HTTP requests and responses
- Stores response data in structured format
- Tracks success/failure rates
- Exports results to JSON files
- Includes timestamps for all operations

### 2.5 As a tester, I want flexible configuration
**Acceptance Criteria:**
- Load phone numbers from file or array
- Configure concurrency settings
- Set request delays and throttling
- Configure retry logic
- Customize output directory

## 3. Functional Requirements

### 3.1 HTTP Request Handling
- Send POST requests to `https://auth.openai.com/api/accounts/authorize/continue`
- Include all required headers (accept, content-type, user-agent, etc.)
- Manage cookies across requests
- Handle redirects appropriately

### 3.2 Token Management
- Generate OpenAI Sentinel tokens
- Handle Cloudflare tokens (cf_clearance, __cf_bm, __cflb)
- Manage CSRF tokens (oai-login-csrf)
- Maintain session cookies (oai-did, login_session, etc.)

### 3.3 Session Management
- Create isolated sessions for each phone number
- Maintain separate cookie jars per session
- Handle session expiration
- Clean up sessions after completion

### 3.4 Data Management
- Read phone numbers from input file (JSON/CSV/TXT)
- Validate phone number format
- Store results in structured JSON format
- Generate summary statistics

### 3.5 Error Handling
- Retry failed requests with exponential backoff
- Handle network errors gracefully
- Log error details for debugging
- Continue processing remaining numbers on failure

## 4. Non-Functional Requirements

### 4.1 Performance
- Support at least 10 concurrent sessions
- Process requests with configurable delays
- Minimize memory footprint

### 4.2 Reliability
- Handle network interruptions
- Implement retry logic
- Validate responses before logging

### 4.3 Maintainability
- Clean, modular code structure
- Configuration via external file
- Clear logging messages
- Documented functions

### 4.4 Security
- Do not store sensitive data in logs
- Use environment variables for sensitive config
- Implement rate limiting to avoid abuse

## 5. Technical Constraints

### 5.1 Technology Stack
- Node.js (v16 or higher)
- axios or node-fetch for HTTP requests
- tough-cookie for cookie management
- File system (fs) for I/O operations

### 5.2 Input Format
Phone numbers file (phones.json):
```json
[
  "+525612588136",
  "+525612588137",
  "+525612588138"
]
```

Configuration file (config.json):
```json
{
  "concurrency": 5,
  "delayBetweenRequests": 1000,
  "retryAttempts": 3,
  "outputDir": "./results"
}
```

### 5.3 Output Format
Results file (results.json):
```json
{
  "summary": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "startTime": "2026-02-28T10:00:00Z",
    "endTime": "2026-02-28T10:05:00Z"
  },
  "results": [
    {
      "phoneNumber": "+525612588136",
      "status": "success",
      "timestamp": "2026-02-28T10:00:01Z",
      "response": { ... }
    }
  ]
}
```

## 6. Out of Scope
- OTP verification (users receive OTPs manually)
- Full account creation beyond registration
- GUI interface
- Real-time monitoring dashboard
- Database storage

## 7. Assumptions
- Phone numbers are valid and in international format
- OpenAI API endpoint remains stable
- Anti-bot protections can be bypassed programmatically
- This is for legitimate testing purposes only

## 8. Risks
- API changes may break the script
- Anti-bot protections may detect automation
- Rate limiting may block requests
- Legal/ethical concerns with automated testing
