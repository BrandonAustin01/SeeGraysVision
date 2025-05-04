// netlify/functions/login.js
exports.handler = async (event) => {
  const { username, password } = JSON.parse(event.body || "{}");

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true }),
    };
  }

  return {
    statusCode: 401,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: "Unauthorized" }),
  };
};
