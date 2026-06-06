import fetch from 'node-fetch';

const OPENCORPORATES_BASE_URL = 'https://api.opencorporates.com/v0.4';

/**
 * Helper to call OpenCorporates API
 */
async function fetchOpenCorporates(endpoint, params = {}) {
  const apiKey = process.env.OPENCORPORATES_API_TOKEN;
  
  const url = new URL(`${OPENCORPORATES_BASE_URL}${endpoint}`);
  
  if (apiKey) {
    url.searchParams.append('api_token', apiKey);
  }
  
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`[OpenCorporates] API error ${res.status}: ${await res.text()}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[OpenCorporates] Fetch error:`, err);
    return null;
  }
}

/**
 * Search for a company by name
 */
export async function searchCompany(query) {
  const data = await fetchOpenCorporates('/companies/search', { q: query, normalise_company_name: true });
  if (data && data.results && data.results.companies) {
    return data.results.companies.map(c => c.company);
  }
  return [];
}

/**
 * Get detailed company info
 */
export async function getCompany(jurisdiction, companyNumber) {
  const data = await fetchOpenCorporates(`/companies/${jurisdiction}/${companyNumber}`);
  if (data && data.results && data.results.company) {
    return data.results.company;
  }
  return null;
}
