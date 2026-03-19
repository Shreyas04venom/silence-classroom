const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const customId = crypto.randomUUID();
  console.log("Testing insert without select into Lessons table with ID:", customId);
  
  const { error } = await supabase
    .from("Lessons")
    .insert({
      id: customId,
      subject: "Test Subject",
      standard: "Test Standard",
      topic: "Test Topic",
      explanation: "Test Explanation",
      transcript: "Test Transcript"
    });

  if (error) {
    console.error("Insert Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Insert Success!");
  }
}

testInsert();
