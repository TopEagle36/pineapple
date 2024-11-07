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
const amtPerCall = 10;

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
    let message = '';
    for (let i = 0; i< response.data.choices.length; i+= 1){
      message+= response.data.choices[i].message.content;
    }

    return message;
  } catch (error) {
    console.error('Error fetching GPT response:', error);
  }
}

export async function POST(request) {
  const post = await request.json();

  const client = await clientPromise;
  const timestamp = new Date().getTime() / 1000; //time in second
  const db = client.db('gpt_visits');
  const user_gpt_usage = await db.collection('posts').findOne({ address: post.address });

  if (user_gpt_usage) {
    const filter = { address: post.address };
    if (timestamp - user_gpt_usage.timestamp >= 24 * 60 * 60) {
      const update = {
        $set: { timestamp, holding: post.pineappleAmt, usage: amtPerCall },
      };
      const result = await db.collection('posts').updateOne(filter, update);
      const message = await getGPTResponse(post.query);
      return new Response(
        JSON.stringify({
          type: 'success',
          holding: post.pineappleAmt,
          usage: user_gpt_usage.usage,
          message,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      if (post.pineappleAmt - user_gpt_usage.usage >= amtPerCall) {
        const update = {
          $set: { holding: post.pineappleAmt, usage: user_gpt_usage.usage + amtPerCall },
        };
        const result = await db.collection('posts').updateOne(filter, update);
        const message = await getGPTResponse(post.query);
        return new Response(
          JSON.stringify({
            type: 'success',
            holding: post.pineappleAmt,
            usage: user_gpt_usage.usage,
            message,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            type: 'limit reached',
            holding: post.pineappleAmt,
            usage: user_gpt_usage.usage,
            message: '',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  } else {
    console.log('come here 3');
    const result = await db.collection('posts').insertOne({
      address: post.address,
      holding: post.pineappleAmt,
      usage: amtPerCall,
      timestamp,
    });
    const message = await getGPTResponse(post.query);
    return new Response(
      JSON.stringify({
        type: 'success',
        holding: post.pineappleAmt,
        usage: amtPerCall,
        message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// response type
// {
//   "id": "chatcmpl-AQOusZUeHzNkhpqISXyLcpOFiDJme",
//   "object": "chat.completion",
//   "created": 1730855670,
//   "model": "gpt-4-0613",
//   "choices": [
//       {
//           "index": 0,
//           "message": {
//               "role": "assistant",
//               "content": "As an artificial intelligence, I don't have a job in the traditional sense. However, I'm designed for various tasks like answering your questions accurately, providing information, setting alarms, managing tasks, sending reminders, and overall to assist you in any way I can.",
//               "refusal": null
//           },
//           "logprobs": null,
//           "finish_reason": "stop"
//       }
//   ],
//   "usage": {
//       "prompt_tokens": 12,
//       "completion_tokens": 53,
//       "total_tokens": 65,
//       "prompt_tokens_details": {
//           "cached_tokens": 0
//       },
//       "completion_tokens_details": {
//           "reasoning_tokens": 0,
//           "accepted_prediction_tokens": 0,
//           "rejected_prediction_tokens": 0
//       }
//   },
//   "system_fingerprint": null
// }
