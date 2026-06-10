export async function onRequestGet(context: any) {
  const { env, params } = context;
  
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
  
  if (!path) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    if (!env.STORAGE) {
      return new Response('R2 Storage not configured yet. Please enable R2 in Cloudflare dashboard and create the bucket.', { status: 500 });
    }

    const object = await env.STORAGE.get(path);

    if (object === null) {
      return new Response('Image Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, {
      headers,
    });
  } catch (error: any) {
    return new Response(`Error retrieving image: ${error.message}`, { status: 500 });
  }
}
