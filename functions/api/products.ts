export async function onRequest(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM products ORDER BY created_at ASC"
    ).all();
    
    const products = results.map((product: any) => ({
      ...product,
      sizes: product.sizes ? JSON.parse(product.sizes) : []
    }));

    return new Response(JSON.stringify(products), {
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
