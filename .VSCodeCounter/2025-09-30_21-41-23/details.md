# Details

Date : 2025-09-30 21:41:23

Directory d:\\Users\\JUSTsoo\\Documents\\aprojectCODE\\ResuOpti\\backend

Total : 47 files,  15466 codes, 3166 comments, 1629 blanks, all 20261 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/.dockerignore](/backend/.dockerignore) | Ignore | 9 | 0 | 0 | 9 |
| [backend/Dockerfile](/backend/Dockerfile) | Docker | 8 | 6 | 7 | 21 |
| [backend/jest.config.js](/backend/jest.config.js) | JavaScript | 20 | 4 | 1 | 25 |
| [backend/package-lock.json](/backend/package-lock.json) | JSON | 7,999 | 0 | 1 | 8,000 |
| [backend/package.json](/backend/package.json) | JSON | 45 | 0 | 1 | 46 |
| [backend/src/api/auth/index.js](/backend/src/api/auth/index.js) | JavaScript | 116 | 74 | 22 | 212 |
| [backend/src/api/positions/index.js](/backend/src/api/positions/index.js) | JavaScript | 245 | 134 | 51 | 430 |
| [backend/src/api/resumes/index.js](/backend/src/api/resumes/index.js) | JavaScript | 298 | 152 | 59 | 509 |
| [backend/src/api/upload/index.js](/backend/src/api/upload/index.js) | JavaScript | 141 | 57 | 24 | 222 |
| [backend/src/app.js](/backend/src/app.js) | JavaScript | 32 | 13 | 12 | 57 |
| [backend/src/config/database.js](/backend/src/config/database.js) | JavaScript | 48 | 4 | 2 | 54 |
| [backend/src/config/index.js](/backend/src/config/index.js) | JavaScript | 32 | 6 | 5 | 43 |
| [backend/src/middleware/auth.js](/backend/src/middleware/auth.js) | JavaScript | 59 | 82 | 21 | 162 |
| [backend/src/middleware/error.js](/backend/src/middleware/error.js) | JavaScript | 127 | 87 | 23 | 237 |
| [backend/src/middleware/upload.js](/backend/src/middleware/upload.js) | JavaScript | 96 | 70 | 22 | 188 |
| [backend/src/middleware/validation.js](/backend/src/middleware/validation.js) | JavaScript | 378 | 227 | 38 | 643 |
| [backend/src/models/ApplicationRecord.js](/backend/src/models/ApplicationRecord.js) | JavaScript | 87 | 5 | 3 | 95 |
| [backend/src/models/ResumeMetadata.js](/backend/src/models/ResumeMetadata.js) | JavaScript | 72 | 6 | 3 | 81 |
| [backend/src/models/ResumeVersion.js](/backend/src/models/ResumeVersion.js) | JavaScript | 80 | 5 | 3 | 88 |
| [backend/src/models/TargetPosition.js](/backend/src/models/TargetPosition.js) | JavaScript | 57 | 4 | 3 | 64 |
| [backend/src/models/User.js](/backend/src/models/User.js) | JavaScript | 44 | 4 | 3 | 51 |
| [backend/src/models/index.js](/backend/src/models/index.js) | JavaScript | 50 | 10 | 7 | 67 |
| [backend/src/server.js](/backend/src/server.js) | JavaScript | 7 | 3 | 3 | 13 |
| [backend/src/services/applicationService.js](/backend/src/services/applicationService.js) | JavaScript | 249 | 95 | 50 | 394 |
| [backend/src/services/authService.js](/backend/src/services/authService.js) | JavaScript | 115 | 68 | 26 | 209 |
| [backend/src/services/fileService.js](/backend/src/services/fileService.js) | JavaScript | 145 | 68 | 32 | 245 |
| [backend/src/services/metadataService.js](/backend/src/services/metadataService.js) | JavaScript | 174 | 79 | 37 | 290 |
| [backend/src/services/positionService.js](/backend/src/services/positionService.js) | JavaScript | 135 | 59 | 35 | 229 |
| [backend/src/services/resumeService.js](/backend/src/services/resumeService.js) | JavaScript | 213 | 97 | 51 | 361 |
| [backend/src/utils/crypto.js](/backend/src/utils/crypto.js) | JavaScript | 123 | 103 | 35 | 261 |
| [backend/src/utils/logger.js](/backend/src/utils/logger.js) | JavaScript | 190 | 93 | 37 | 320 |
| [backend/src/utils/response.js](/backend/src/utils/response.js) | JavaScript | 60 | 143 | 14 | 217 |
| [backend/tests/contract/auth-login.test.js](/backend/tests/contract/auth-login.test.js) | JavaScript | 191 | 165 | 60 | 416 |
| [backend/tests/contract/auth-register.test.js](/backend/tests/contract/auth-register.test.js) | JavaScript | 130 | 126 | 43 | 299 |
| [backend/tests/contract/resumes-post.test.js](/backend/tests/contract/resumes-post.test.js) | JavaScript | 310 | 56 | 59 | 425 |
| [backend/tests/contract/resumes-upload.test.js](/backend/tests/contract/resumes-upload.test.js) | JavaScript | 458 | 86 | 94 | 638 |
| [backend/tests/contract/target-positions-delete.test.js](/backend/tests/contract/target-positions-delete.test.js) | JavaScript | 145 | 79 | 36 | 260 |
| [backend/tests/contract/target-positions-get-by-id.test.js](/backend/tests/contract/target-positions-get-by-id.test.js) | JavaScript | 146 | 74 | 36 | 256 |
| [backend/tests/contract/target-positions-get.test.js](/backend/tests/contract/target-positions-get.test.js) | JavaScript | 98 | 51 | 23 | 172 |
| [backend/tests/contract/target-positions-post.test.js](/backend/tests/contract/target-positions-post.test.js) | JavaScript | 202 | 76 | 45 | 323 |
| [backend/tests/contract/target-positions-put.test.js](/backend/tests/contract/target-positions-put.test.js) | JavaScript | 233 | 88 | 53 | 374 |
| [backend/tests/integration/README.md](/backend/tests/integration/README.md) | Markdown | 69 | 0 | 18 | 87 |
| [backend/tests/integration/auth.test.js](/backend/tests/integration/auth.test.js) | JavaScript | 313 | 304 | 105 | 722 |
| [backend/tests/integration/positions.test.js](/backend/tests/integration/positions.test.js) | JavaScript | 623 | 97 | 165 | 885 |
| [backend/tests/integration/resumes.test.js](/backend/tests/integration/resumes.test.js) | JavaScript | 592 | 89 | 106 | 787 |
| [backend/tests/integration/upload.test.js](/backend/tests/integration/upload.test.js) | JavaScript | 496 | 110 | 152 | 758 |
| [backend/tests/setup.js](/backend/tests/setup.js) | JavaScript | 6 | 7 | 3 | 16 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)