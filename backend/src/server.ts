import app from "./app";

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

console.log("JWT_SECRET:", process.env.JWT_SECRET ? "ĐÃ CÓ" : "CHƯA CÓ");
