const fs = require('fs');
let s = fs.readFileSync('memoria-be/src/services/faceMatchingService.ts', 'utf8');
s = s.replace(/user_id: userId/g, 'user_id: userId');
// The error says "userId does not exist ... Did you mean user_id?"
s = s.replace(/userId,/g, 'user_id: userId,');
fs.writeFileSync('memoria-be/src/services/faceMatchingService.ts', s);

let fe = fs.readFileSync('memoria-fe/src/screens/tabs/faceGroupScreen.tsx', 'utf8');
fe = fe.replace(/import \{ getImageUrl \} from '\.\.\/\.\.\/utils\/imageCompression';\n/g, "");
fe = fe.replace(/source=\{\{ uri: getImageUrl\(item\.photo\.storagePath, 'thumb'\) \}\}/g, 'source={{ uri: item.photo?.storagePath }}');
fs.writeFileSync('memoria-fe/src/screens/tabs/faceGroupScreen.tsx', fe);
