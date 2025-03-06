// utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Hardcode credentials temporarily to fix the upload issue
cloudinary.config({
    cloud_name: 'desbbx38m',
    api_key: '523336557241993',
    api_secret: 'JeomgPpqTUkqf4Pzlgyd2Nmy7Ns',
});

export default cloudinary;

