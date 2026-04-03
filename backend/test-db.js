const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Atlas connection...');
console.log(`📡 Connection string: ${MONGODB_URI.replace(/\/\/(.*)@/, '//****:****@')}`);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000
})
.then(() => {
    console.log('✅ Connected successfully to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    mongoose.connection.close();
    console.log('🔌 Connection closed');
})
.catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\n💡 Possible issues:');
    console.log('1. Check username/password in .env file');
    console.log('2. Add your IP to Network Access (0.0.0.0/0)');
    console.log('3. Check if cluster is active (not paused)');
    console.log('4. Verify database name is correct');
});