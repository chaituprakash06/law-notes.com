// /app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Initialize Supabase client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Assistant IDs - replace with your actual assistant IDs
// You already have the company law assistant ID
const ASSISTANT_IDS = {
  'tax': process.env.TAX_ASSISTANT_ID || 'asst_7Bij1abWkIrFNlvAZ4yxz82c',
  'jurisprudence': process.env.JURISPRUDENCE_ASSISTANT_ID || 'asst_FewcSa9UhQf6CIJSYlD9lJKZ',
  'company': process.env.COMPANY_ASSISTANT_ID || 'asst_GdBzv82qEZXWo7dO6JQnCcYJ', // Your existing company assistant ID
};

export async function POST(req: NextRequest) {
  try {
    const { query, noteId, noteType, threadId } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Get the assistant ID for the note type
    const assistantId = ASSISTANT_IDS[noteType as keyof typeof ASSISTANT_IDS];
    if (!assistantId) {
      return NextResponse.json(
        { error: `No assistant configured for note type: ${noteType}` },
        { status: 400 }
      );
    }
    
    console.log(`Using assistant ${assistantId} for note type ${noteType}`);
    
    // Step 2: Create a Thread or use existing one
    let currentThreadId = threadId;
    if (!currentThreadId) {
      // Create a new thread
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      console.log(`Created new thread ${currentThreadId}`);
    } else {
      console.log(`Using existing thread ${currentThreadId}`);
    }
    
    // Step 3: Add a Message to the Thread
    await openai.beta.threads.messages.create(
      currentThreadId,
      {
        role: "user",
        content: query
      }
    );
    console.log(`Added message to thread ${currentThreadId}`);
    
    // Step 4: Run the Assistant on the Thread
    try {
      // Create a run with streaming
      const stream = await openai.beta.threads.runs.stream(
        currentThreadId, 
        { 
          assistant_id: assistantId
        }
      );
      
      // We'll wait for the run to complete
      const run = await stream.finalRun();
      console.log(`Run completed with status: ${run.status}`);
      
      if (run.status !== 'completed') {
        return NextResponse.json(
          { error: `Run failed with status: ${run.status}` },
          { status: 500 }
        );
      }
      
      // Get the latest messages
      const messagesResponse = await openai.beta.threads.messages.list(
        currentThreadId
      );
      
      // Get the first (most recent) assistant message
      const assistantMessages = messagesResponse.data.filter(
        msg => msg.role === 'assistant'
      );
      
      if (assistantMessages.length === 0) {
        return NextResponse.json(
          { error: 'No response from assistant' },
          { status: 500 }
        );
      }
      
      // Extract the content from the message
      const latestMessage = assistantMessages[0];
      let responseContent = '';
      
      for (const contentPart of latestMessage.content) {
        if (contentPart.type === 'text') {
          responseContent += contentPart.text.value;
        }
      }
      
      // Return the response with thread ID for continuity
      return NextResponse.json({
        response: responseContent,
        threadId: currentThreadId
      });
      
    } catch (runError) {
      console.error('Error running assistant:', runError);
      return NextResponse.json(
        { error: `Error running assistant: ${runError instanceof Error ? runError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}