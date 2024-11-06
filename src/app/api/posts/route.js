import axios from 'axios';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db('gpt_visits');

  const posts = await db.collection('posts').find({}).toArray();
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
}

const gpt_api_key = process.env.CHATGPT_API_KEY;
const endpoint = 'https://api.openai.com/v1/chat/completions';

async function getGPTResponse(query) {
  try {
    const response = await axios.post(
      endpoint,
      {
        model: 'gpt-4', // or 'gpt-4' if you have access, gpt-3.5-turbo
        messages: [{ role: 'user', content: query }],
        max_tokens: 100, // Adjust as needed
      },
      {
        headers: {
          Authorization: `Bearer ${gpt_api_key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const message = response.data.choices[0].message.content;
    console.log('GPT Response:', message);

    return message;
  } catch (error) {
    console.error('Error fetching GPT response:', error);
  }
}

export async function POST(request) {
  console.log('come here?');
  const client = await clientPromise;
  const db = client.db('gpt_visits');
  console.log('gpt_ai_key', gpt_api_key);
  const post = await request.json();
  const message = await getGPTResponse(post.query);
  console.log('message here', message);
  const result = await db.collection('posts').insertOne(post);
  console.log('result', result);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}
