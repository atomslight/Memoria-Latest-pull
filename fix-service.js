const fs = require('fs');

let s = fs.readFileSync('memoria-be/src/services/faceMatchingService.ts', 'utf8');
s = s.replace(/groupId: item.groupId/g, 'group_id: item.groupId');
s = s.replace(/user_id: userId/g, 'user_id: userId');
fs.writeFileSync('memoria-be/src/services/faceMatchingService.ts', s);

let fe = fs.readFileSync('memoria-fe/src/screens/tabs/faceGroupScreen.tsx', 'utf8');
fe = fe.replace(/import \{ COLORS \} from '\.\.\/\.\.\/constants\/colors';/g, "import { COLORS } from '../../constants/colors';\nimport { getImageUrl } from '../../utils/imageCompression';");
fe = fe.replace(/source=\{\{ uri: item\.photo\?\.storagePath \}\}/g, "source={{ uri: getImageUrl(item.photo.storagePath, 'thumb') }}");
fs.writeFileSync('memoria-fe/src/screens/tabs/faceGroupScreen.tsx', fe);
