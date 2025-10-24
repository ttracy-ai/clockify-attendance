const bcrypt = require('bcryptjs');

const password = 'Travis3923!';
const hash = bcrypt.hashSync(password, 10);

console.log('Generated hash:', hash);
console.log('Password matches:', bcrypt.compareSync(password, hash));
