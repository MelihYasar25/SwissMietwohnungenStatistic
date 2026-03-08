// Supabase client setup
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Function to fetch all apartments
async function fetchApartments() {
  try {
    const { data, error } = await supabase
      .from(CONFIG.TABLE_NAME)
      .select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching apartments:', error);
    return [];
  }
}

// Export for use in other modules
window.supabase = supabase;
window.fetchApartments = fetchApartments;