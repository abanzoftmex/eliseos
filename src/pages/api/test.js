// Test endpoint
export default function handler(req, res) {
  res.status(200).json({ 
    success: true, 
    message: "Test endpoint funciona",
    test: true 
  });
}
