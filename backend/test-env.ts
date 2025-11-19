import 'dotenv/config';

console.log('VITE_PAYPAL_CLIENT_ID:', process.env.VITE_PAYPAL_CLIENT_ID);
console.log('PAYPAL_SECRET:', process.env.PAYPAL_SECRET?.slice(0,5) + '...');
console.log('PAYPAL_API_BASE:', process.env.PAYPAL_API_BASE);
console.log('PAYPAL_VND_EXCHANGE_RATE:', process.env.PAYPAL_VND_EXCHANGE_RATE);