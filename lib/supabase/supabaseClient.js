import { createClient } from '@supabase/supabase-js'
const supabaseUrl = "https://yayqexmbyxxouzakgnwq.supabase.co"
const supabaseKey = "sb_publishable_sFqswp4ihOddl3TPI_kWKw_M6oNTKct"
export const supabase = createClient(supabaseUrl, supabaseKey)
