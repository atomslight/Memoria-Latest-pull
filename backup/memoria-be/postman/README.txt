Memoria Postman assets
========================

Import into Postman (or compatible clients):

1. Memoria-API.postman_collection.json  — all API routes + Bull Board
2. Memoria-Local.postman_environment.json — variables (baseUrl, tokens, ids)

Steps:
- Import collection, then import environment
- Select environment "Memoria Local"
- Run "Auth > POST Login" or "POST Register" — tests save accessToken and refreshToken
- Set collection variables memoryId, circleId, conversationId, targetUserId from API responses as needed

Regenerate collection after route changes:
  npm run postman:collection
