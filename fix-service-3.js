const fs = require('fs');
let s = fs.readFileSync('memoria-be/src/services/faceMatchingService.ts', 'utf8');

// I made a mistake using regex replacement
s = s.replace(/user_id: userId, userId,/g, 'user_id: userId,');

fs.writeFileSync('memoria-be/src/services/faceMatchingService.ts', s);
