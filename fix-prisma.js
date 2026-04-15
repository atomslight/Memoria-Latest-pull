const fs = require('fs');

// fix faceGroupsController.ts
let c = fs.readFileSync('memoria-be/src/controllers/v1/faceGroupsController.ts', 'utf8');
c = c.replace(/prisma\.face_groups\./g, 'prisma.face_groups.'); // actually schema had face_groups model, let's check
fs.writeFileSync('memoria-be/src/controllers/v1/faceGroupsController.ts', c);

// fix faceMatchingService.ts
let s = fs.readFileSync('memoria-be/src/services/faceMatchingService.ts', 'utf8');
s = s.replace(/group_id: /g, 'groupId: ');
s = s.replace(/user_id/g, 'userId'); // check if face_groups uses user_id or userId? The schema has `user_id` for face_groups but maybe I should check again.
fs.writeFileSync('memoria-be/src/services/faceMatchingService.ts', s);
