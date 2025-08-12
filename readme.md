# AI Vulnerability Scanner

A tiny full-stack project that scans code for security issues using an LLM. Built to learn modern TS/Node patterns: auth with Google OAuth + JWT, schema-first validation, and clean logging.

LLM used: [openai/gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b)

| | |
| :--: | :--: |
| `SQL injection` <img width="800" alt="image" src="https://github.com/user-attachments/assets/5361b10d-fc2a-4a0e-8743-c3599dc5f486" />| `buffer overflow` <img width="800" alt="image" src="https://github.com/user-attachments/assets/577f04b0-615a-4d40-896d-d842ca10925f" />|
|`DoS` <img width="865" height="800" alt="image" src="https://github.com/user-attachments/assets/16725efe-bfbe-4e56-88ce-d5a18a73e948" />| `command injection` <img width="800" alt="image" src="https://github.com/user-attachments/assets/6e541c4a-6ccf-460d-93d7-b233bc501081" />|

## Features
- **Auth**: Google OAuth 2.0 (Passport) → JWT (15m) with per-login `jwtSecureCode` rotation
- **Scan API**: `POST /api/scan` → prompts LLM and returns structured findings (line, type, severity, description)
- **Frontend**: minimal React (Vite) UI to sign in, paste code, and view results
- **DB**: Prisma + SQLite for users/scans/vulnerabilities
- **Logging**: Pino with request correlation
- **Rate limiting**: per-user Redis rate limiting + usage headers

## Example
```
/* An example of an ERROR for some 64-bit architectures,
if "unsigned int" is 32 bits and "size_t" is 64 bits: */
#include <unistd.h>
#include <stdlib.h>
#include <stdlib.h>
void *mymalloc(unsigned int size) { return malloc(size); }

int main()
{
    char *buf;
    size_t len;
    read(0, &len, sizeof(len));
    /* we forgot to check the maximum length */
    /* 64-bit size_t gets truncated to 32-bit unsigned int */
    buf = mymalloc(len);
    read(0, buf, len);
    return 0;
}
```
<img width="800" alt="image" src="https://github.com/user-attachments/assets/de02d6ae-b659-4112-8743-d6828375c71d" />


## Rate limit
Rolling window based rate limiting is implemented with Redis.
<img width="800" alt="image" src="https://github.com/user-attachments/assets/1e0f9f36-fc21-42c5-b86b-3fc9d477ac49" />


## Stack
TypeScript • Express • Passport (google + jwt) • Prisma (SQLite) • React (Vite) • Pino • Zod • OpenRouter

