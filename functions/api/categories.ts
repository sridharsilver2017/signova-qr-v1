export async function onRequest(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM product_categories ORDER BY created_at ASC"
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
