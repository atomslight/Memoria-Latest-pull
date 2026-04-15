const fs = require('fs');
let s = fs.readFileSync('memoria-be/src/services/faceMatchingService.ts', 'utf8');

s = s.replace(/userId: user_id: userId,/g, 'user_id: userId,');
s = s.replace(/WHERE userId = \$\{userId\}/g, 'WHERE user_id = ${userId}');
s = s.replace(/this\.matchAndGroupFaces\(user_id: userId/g, 'this.matchAndGroupFaces(userId');

fs.writeFileSync('memoria-be/src/services/faceMatchingService.ts', s);
