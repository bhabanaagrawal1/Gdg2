import app from './src/app.js';
import connectDB from './src/config/database.js';

const PORT = 3000;

connectDB();


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})